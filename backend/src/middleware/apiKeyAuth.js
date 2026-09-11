const crypto = require('crypto');

/**
 * Middleware to authenticate requests via Scoped API Key (X-API-Key header).
 */
async function authenticateApiKey(req, res, next) {
  try {
    // Check X-API-Key header or Authorization: Bearer <key>
    let rawKey = req.headers['x-api-key'];

    if (!rawKey && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        rawKey = parts[1];
      }
    }

    if (!rawKey || typeof rawKey !== 'string') {
      return res.status(401).json({
        error: 'API key is required. Pass via X-API-Key header or Authorization: Bearer <key>',
      });
    }

    const trimmedKey = rawKey.trim();
    if (!trimmedKey.startsWith('pt_live_')) {
      return res.status(401).json({
        error: 'Invalid API key format. PartTrack API keys start with pt_live_',
      });
    }

    // Hash the incoming key to compare with the database
    const keyHash = crypto.createHash('sha256').update(trimmedKey).digest('hex');

    const db = req.app.get('db');
    const keyRecord = await db('api_keys')
      .where({ key_hash: keyHash, is_active: true })
      .first();

    if (!keyRecord) {
      return res.status(401).json({
        error: 'Invalid or revoked API key.',
      });
    }

    // Update last_used_at asynchronously
    db('api_keys')
      .where({ id: keyRecord.id })
      .update({ last_used_at: new Date() })
      .catch((err) => console.warn('Could not update API key last_used_at:', err.message));

    // Attach key metadata to request
    req.apiKey = keyRecord;

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticateApiKey };
