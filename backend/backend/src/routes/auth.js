const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const {
  loginValidation,
  signupRequestValidation,
  signupVerifyValidation,
  forgotPasswordRequestValidation,
  forgotPasswordVerifyValidation,
} = require('../utils/validators');
const { loginLimiter, otpLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth');
const { generateAndStoreOtp, verifyOtp, consumeOtp } = require('../services/otpService');
const { sendSignupOtpEmail, sendForgotPasswordOtpEmail } = require('../services/emailService');
const { ensureUserPrefix, generateUniqueUserPrefix } = require('../services/trackingNumberService');

const router = express.Router();

/**
 * POST /api/auth/login
 * Authenticate user, return JWT in httpOnly cookie.
 */
router.post('/login', loginLimiter, loginValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const db = req.app.get('db');

    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Contact your administrator.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const trackingPrefix = user.tracking_prefix || await ensureUserPrefix(db, user.id);

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      tracking_prefix: trackingPrefix,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY || '24h',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tracking_prefix: trackingPrefix,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * Clear the auth cookie.
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.json({ message: 'Logged out' });
});

/**
 * GET /api/auth/me
 * Return current authenticated user info.
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const user = await db('users')
      .select('id', 'name', 'email', 'role', 'is_active', 'tracking_prefix')
      .where({ id: req.user.id })
      .first();

    if (!user || !user.is_active) {
      res.clearCookie('token');
      return res.status(401).json({ error: 'Account not found or deactivated' });
    }

    if (!user.tracking_prefix) {
      user.tracking_prefix = await ensureUserPrefix(db, user.id);
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/signup/request-otp
 * Request an OTP for new user registration.
 */
router.post(
  '/signup/request-otp',
  otpLimiter,
  signupRequestValidation,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { name, email, password } = req.body;
      const db = req.app.get('db');
      const normalizedEmail = email.trim().toLowerCase();

      // Check if user already exists
      const existing = await db('users').where({ email: normalizedEmail }).first();
      if (existing) {
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Generate & store OTP with payload
      const otp = await generateAndStoreOtp(db, normalizedEmail, 'signup', {
        name,
        password_hash: passwordHash,
      });

      // Send email
      await sendSignupOtpEmail(normalizedEmail, otp.otpCode);

      res.json({
        message: 'Verification code sent to your email',
        email: normalizedEmail,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/signup/verify-otp
 * Verify registration OTP and create user account.
 */
router.post(
  '/signup/verify-otp',
  signupVerifyValidation,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { email, otp } = req.body;
      const db = req.app.get('db');
      const normalizedEmail = email.trim().toLowerCase();

      const verification = await verifyOtp(db, normalizedEmail, 'signup', otp);
      if (!verification.valid) {
        return res.status(400).json({ error: verification.error });
      }

      if (!verification.payload || !verification.payload.name || !verification.payload.password_hash) {
        return res.status(400).json({ error: 'Registration session expired. Please sign up again.' });
      }

      // Check again if email was registered meanwhile
      const existing = await db('users').where({ email: normalizedEmail }).first();
      if (existing) {
        await consumeOtp(db, verification.otpId);
        return res.status(400).json({ error: 'An account with this email already exists' });
      }

      // Generate unique 5-digit user prefix
      const trackingPrefix = await generateUniqueUserPrefix(db);

      // Create new user
      const newUser = {
        id: uuidv4(),
        name: verification.payload.name,
        email: normalizedEmail,
        password_hash: verification.payload.password_hash,
        role: 'user',
        is_active: true,
        tracking_prefix: trackingPrefix,
      };

      await db('users').insert(newUser);
      await consumeOtp(db, verification.otpId);

      // Log the user in automatically with JWT cookie
      const payload = {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name,
        tracking_prefix: trackingPrefix,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY || '24h',
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        message: 'Account created successfully',
        user: payload,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/forgot-password/request-otp
 * Request an OTP for password reset.
 */
router.post(
  '/forgot-password/request-otp',
  otpLimiter,
  forgotPasswordRequestValidation,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { email } = req.body;
      const db = req.app.get('db');
      const normalizedEmail = email.trim().toLowerCase();

      // Check if user exists
      const user = await db('users').where({ email: normalizedEmail }).first();
      if (!user) {
        return res.status(404).json({ error: 'No account found with this email address' });
      }

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is deactivated. Contact your administrator.' });
      }

      // Generate & store OTP
      const otp = await generateAndStoreOtp(db, normalizedEmail, 'forgot_password');

      // Send email
      await sendForgotPasswordOtpEmail(normalizedEmail, otp.otpCode);

      res.json({
        message: 'Password reset code sent to your email',
        email: normalizedEmail,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/forgot-password/verify-otp
 * Verify reset OTP and update password.
 */
router.post(
  '/forgot-password/verify-otp',
  forgotPasswordVerifyValidation,
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
      }

      const { email, otp, password } = req.body;
      const db = req.app.get('db');
      const normalizedEmail = email.trim().toLowerCase();

      const verification = await verifyOtp(db, normalizedEmail, 'forgot_password', otp);
      if (!verification.valid) {
        return res.status(400).json({ error: verification.error });
      }

      // User check
      const user = await db('users').where({ email: normalizedEmail }).first();
      if (!user) {
        return res.status(404).json({ error: 'Account not found' });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 12);

      await db('users')
        .where({ id: user.id })
        .update({ password_hash: passwordHash });

      await consumeOtp(db, verification.otpId);

      res.json({
        message: 'Password reset successfully. You can now sign in with your new password.',
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
