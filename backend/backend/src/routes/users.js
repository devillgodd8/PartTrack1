const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createUserValidation,
  updateUserValidation,
  resetPasswordValidation,
} = require('../utils/validators');
const { generateUniqueUserPrefix } = require('../services/trackingNumberService');

const router = express.Router();

// All user management routes require admin role
router.use(authenticate, authorize('admin'));

/**
 * GET /api/users
 * List all users.
 */
router.get('/', async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const users = await db('users')
      .select('id', 'name', 'email', 'role', 'is_active', 'created_at', 'tracking_prefix')
      .orderBy('created_at', 'desc');

    res.json({ users });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/users/:id
 * Get single user.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const user = await db('users')
      .select('id', 'name', 'email', 'role', 'is_active', 'created_at', 'tracking_prefix')
      .where({ id: req.params.id })
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/users
 * Create a new user.
 */
router.post('/', createUserValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const db = req.app.get('db');
    const { name, email, password, role } = req.body;

    // Check for duplicate email
    const existing = await db('users').where({ email }).first();
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    const trackingPrefix = await generateUniqueUserPrefix(db);

    await db('users').insert({
      id,
      name,
      email,
      password_hash: passwordHash,
      role: role || 'user',
      is_active: true,
      tracking_prefix: trackingPrefix,
    });

    res.status(201).json({
      user: { id, name, email, role: role || 'user', is_active: true, tracking_prefix: trackingPrefix },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/users/:id
 * Update user details (name, email, role, is_active).
 */
router.put('/:id', updateUserValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const db = req.app.get('db');
    const { id } = req.params;

    const user = await db('users').where({ id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.email !== undefined) {
      // Check for duplicate email
      const existing = await db('users').where({ email: req.body.email }).whereNot({ id }).first();
      if (existing) {
        return res.status(409).json({ error: 'A user with this email already exists' });
      }
      updates.email = req.body.email;
    }
    if (req.body.role !== undefined) updates.role = req.body.role;
    if (req.body.is_active !== undefined) updates.is_active = req.body.is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await db('users').where({ id }).update(updates);

    const updated = await db('users')
      .select('id', 'name', 'email', 'role', 'is_active', 'created_at')
      .where({ id })
      .first();

    res.json({ user: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/users/:id/deactivate
 * Deactivate a user account.
 */
router.put('/:id/deactivate', async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const { id } = req.params;

    // Prevent self-deactivation
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const user = await db('users').where({ id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db('users').where({ id }).update({ is_active: false });

    res.json({ message: 'User deactivated' });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/users/:id/reset-password
 * Reset a user's password (admin action).
 */
router.put('/:id/reset-password', resetPasswordValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const db = req.app.get('db');
    const { id } = req.params;

    const user = await db('users').where({ id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    await db('users').where({ id }).update({ password_hash: passwordHash });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user (only if they have no tracking records).
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await db('users').where({ id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check for associated tracking records
    const records = await db('tracking_records')
      .where({ assigned_user_id: id })
      .orWhere({ created_by_id: id })
      .first();

    if (records) {
      return res.status(409).json({
        error: 'Cannot delete user with associated tracking records. Deactivate instead.',
      });
    }

    await db('users').where({ id }).del();
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
