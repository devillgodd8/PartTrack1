const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/keys
 * List API keys belonging to the authenticated user.
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const db = req.app.get('db');

    let query = db('api_keys')
      .select('id', 'name', 'key_prefix', 'permissions', 'is_active', 'last_used_at', 'created_at')
      .orderBy('created_at', 'desc');

    // Non-admin users only see their own keys
    if (req.user.role !== 'admin') {
      query = query.where({ user_id: req.user.id });
    }

    const keys = await query;
    res.json({ keys });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/keys
 * Create a new scoped API key.
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const name = (req.body.name || 'Website Integration').trim().substring(0, 100);

    // Generate pt_live_ + 48 hex characters
    const randomBytes = crypto.randomBytes(24).toString('hex');
    const apiKey = `pt_live_${randomBytes}`;
    const keyPrefix = `pt_live_${randomBytes.substring(0, 8)}...`;

    // Hash key with SHA-256 for secure storage
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    const id = uuidv4();
    const newRecord = {
      id,
      user_id: req.user.id,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      permissions: 'read:tracking',
      is_active: true,
      created_at: new Date(),
    };

    await db('api_keys').insert(newRecord);

    res.status(201).json({
      id,
      name,
      key_prefix: keyPrefix,
      apiKey, // Returned ONLY once upon creation
      permissions: 'read:tracking',
      created_at: newRecord.created_at,
      message: 'API key generated successfully. Copy it now, it will not be shown again.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/keys/:id
 * Revoke/delete an API key.
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const { id } = req.params;

    let query = db('api_keys').where({ id });

    // Non-admin can only delete their own keys
    if (req.user.role !== 'admin') {
      query = query.where({ user_id: req.user.id });
    }

    const key = await query.first();
    if (!key) {
      return res.status(404).json({ error: 'API key not found' });
    }

    await db('api_keys').where({ id }).del();

    res.json({ message: 'API key revoked successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
