const rateLimit = require('express-rate-limit');

/**
 * Login rate limiter: 5 attempts per 15-minute window per IP.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * OTP rate limiter: 5 OTP requests per 15-minute window per IP.
 */
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: 'Too many OTP requests. Please wait a few minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter, otpLimiter };
