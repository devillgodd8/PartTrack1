const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

/**
 * GET /api/dashboard/stats
 * Admin: total records, active shipments, by-status counts, by-user counts.
 * User: own stats only.
 */
router.get('/stats', async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const isAdmin = req.user.role === 'admin';

    let baseQuery = db('tracking_records');
    if (!isAdmin) {
      baseQuery = baseQuery.where('assigned_user_id', req.user.id);
    }

    // Total records
    const totalResult = await baseQuery.clone().count('id as total').first();
    const totalRecords = totalResult.total;

    // Active shipments (not Delivered, not Cancelled)
    const activeResult = await baseQuery
      .clone()
      .whereNotIn('current_status', ['Delivered', 'Cancelled'])
      .count('id as total')
      .first();
    const activeShipments = activeResult.total;

    // Records by status
    const byStatus = await baseQuery
      .clone()
      .select('current_status as status')
      .count('id as count')
      .groupBy('current_status');

    // Records by user (admin only)
    let byUser = [];
    if (isAdmin) {
      byUser = await db('tracking_records')
        .select('users.name as user_name', 'tracking_records.assigned_user_id as user_id')
        .count('tracking_records.id as count')
        .leftJoin('users', 'tracking_records.assigned_user_id', 'users.id')
        .groupBy('tracking_records.assigned_user_id', 'users.name');
    }

    // Recent activity (last 10 status changes)
    let recentActivityQuery = db('status_history')
      .select(
        'status_history.*',
        'users.name as updated_by_name',
        'tracking_records.tracking_number'
      )
      .leftJoin('users', 'status_history.updated_by_id', 'users.id')
      .leftJoin('tracking_records', 'status_history.tracking_record_id', 'tracking_records.id')
      .orderBy('status_history.updated_at', 'desc')
      .limit(10);

    if (!isAdmin) {
      recentActivityQuery = recentActivityQuery.where(
        'tracking_records.assigned_user_id',
        req.user.id
      );
    }

    const recentActivity = await recentActivityQuery;

    res.json({
      totalRecords,
      activeShipments,
      byStatus,
      byUser,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
