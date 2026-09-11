const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Activity log is admin-only
router.use(authenticate, authorize('admin'));

/**
 * GET /api/activity
 * Paginated activity log of all status changes system-wide.
 */
router.get('/', async (req, res, next) => {
  try {
    const db = req.app.get('db');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const countResult = await db('status_history').count('id as total').first();
    const total = countResult.total;

    const entries = await db('status_history')
      .select(
        'status_history.*',
        'users.name as updated_by_name',
        'tracking_records.tracking_number',
        'tracking_records.part_type',
        'tracking_records.vehicle_make',
        'tracking_records.vehicle_model'
      )
      .leftJoin('users', 'status_history.updated_by_id', 'users.id')
      .leftJoin('tracking_records', 'status_history.tracking_record_id', 'tracking_records.id')
      .orderBy('status_history.updated_at', 'desc')
      .limit(limit)
      .offset(offset);

    res.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
