const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createTrackingValidation,
  updateTrackingValidation,
  statusUpdateValidation,
} = require('../utils/validators');
const {
  ensureUserPrefix,
  generate12DigitTrackingNumber,
} = require('../services/trackingNumberService');

const router = express.Router();

// All tracking routes require authentication
router.use(authenticate);

/**
 * GET /api/tracking
 * List tracking records. Admin sees all, user sees own only.
 * Supports filters: status, part_type, assigned_user_id, date_from, date_to
 * Supports search: q (searches tracking_number, vin, part_stock_number)
 */
router.get('/', async (req, res, next) => {
  try {
    const db = req.app.get('db');
    let query = db('tracking_records')
      .select(
        'tracking_records.*',
        'assigned.name as assigned_user_name',
        'creator.name as created_by_name'
      )
      .leftJoin('users as assigned', 'tracking_records.assigned_user_id', 'assigned.id')
      .leftJoin('users as creator', 'tracking_records.created_by_id', 'creator.id');

    // Scope to own records for regular users
    if (req.user.role !== 'admin') {
      query = query.where('tracking_records.assigned_user_id', req.user.id);
    }

    // Filters
    if (req.query.status) {
      query = query.where('tracking_records.current_status', req.query.status);
    }
    if (req.query.part_type) {
      query = query.where('tracking_records.part_type', req.query.part_type);
    }
    if (req.query.assigned_user_id) {
      query = query.where('tracking_records.assigned_user_id', req.query.assigned_user_id);
    }
    if (req.query.date_from) {
      query = query.where('tracking_records.date_created', '>=', req.query.date_from);
    }
    if (req.query.date_to) {
      query = query.where('tracking_records.date_created', '<=', req.query.date_to);
    }

    // Search across tracking_number, vin, part_stock_number
    if (req.query.q) {
      const search = `%${req.query.q}%`;
      query = query.where(function () {
        this.where('tracking_records.tracking_number', 'like', search)
          .orWhere('tracking_records.vin', 'like', search)
          .orWhere('tracking_records.part_stock_number', 'like', search);
      });
    }

    query = query.orderBy('tracking_records.last_updated', 'desc');

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const countQuery = query.clone().clearSelect().clearOrder().count('tracking_records.id as total').first();
    const { total } = await countQuery;

    const records = await query.limit(limit).offset(offset);

    res.json({
      records,
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

/**
 * GET /api/tracking/lookup/:trackingNumber
 * Lookup by tracking number (requires login).
 */
router.get('/lookup/:trackingNumber', async (req, res, next) => {
  try {
    const db = req.app.get('db');

    const record = await db('tracking_records')
      .select(
        'tracking_records.*',
        'assigned.name as assigned_user_name',
        'creator.name as created_by_name'
      )
      .leftJoin('users as assigned', 'tracking_records.assigned_user_id', 'assigned.id')
      .leftJoin('users as creator', 'tracking_records.created_by_id', 'creator.id')
      .where('tracking_records.tracking_number', req.params.trackingNumber)
      .first();

    if (!record) {
      return res.status(404).json({ error: 'Tracking record not found' });
    }

    // Regular users can only look up their own records
    if (req.user.role !== 'admin' && record.assigned_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const history = await db('status_history')
      .select('status_history.*', 'users.name as updated_by_name')
      .leftJoin('users', 'status_history.updated_by_id', 'users.id')
      .where('status_history.tracking_record_id', record.id)
      .orderBy('status_history.updated_at', 'desc');

    res.json({ record, history });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/tracking/:id
 * Get single tracking record with full status history.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const db = req.app.get('db');

    const record = await db('tracking_records')
      .select(
        'tracking_records.*',
        'assigned.name as assigned_user_name',
        'creator.name as created_by_name'
      )
      .leftJoin('users as assigned', 'tracking_records.assigned_user_id', 'assigned.id')
      .leftJoin('users as creator', 'tracking_records.created_by_id', 'creator.id')
      .where('tracking_records.id', req.params.id)
      .first();

    if (!record) {
      return res.status(404).json({ error: 'Tracking record not found' });
    }

    // Regular users can only see their own records
    if (req.user.role !== 'admin' && record.assigned_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const history = await db('status_history')
      .select('status_history.*', 'users.name as updated_by_name')
      .leftJoin('users', 'status_history.updated_by_id', 'users.id')
      .where('status_history.tracking_record_id', record.id)
      .orderBy('status_history.updated_at', 'desc');

    res.json({ record, history });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tracking
 * Create a new tracking record.
 * Admin can assign to any user; regular user auto-assigns to self.
 */
router.post('/', createTrackingValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const db = req.app.get('db');
    const {
      part_type,
      vehicle_make,
      vehicle_model,
      vehicle_year,
      vin,
      part_stock_number,
      shipment_origin,
      destination,
      current_status,
      estimated_delivery_date,
      notes,
      assigned_user_id,
    } = req.body;

    // Determine assigned user
    let assignedUserId = req.user.id; // Default: self
    if (req.user.role === 'admin' && assigned_user_id) {
      // Admin can assign to any active user
      const assignee = await db('users').where({ id: assigned_user_id, is_active: true }).first();
      if (!assignee) {
        return res.status(400).json({ error: 'Assigned user not found or inactive' });
      }
      assignedUserId = assigned_user_id;
    }

    // Ensure the owner user has their fixed 5-digit prefix (all records belonging to this user share it)
    const targetUserId = assignedUserId || req.user.id;
    const userPrefix = await ensureUserPrefix(db, targetUserId);

    const id = uuidv4();
    const status = current_status || 'Pending';
    const now = new Date().toISOString();

    // Generate 12-digit tracking number: [5-digit user prefix][7-digit random suffix]
    // Safe for concurrent requests with unique constraint collision retries
    let finalTrackingNumber = null;
    let insertAttempts = 0;
    const maxInsertAttempts = 3;

    while (insertAttempts < maxInsertAttempts) {
      try {
        finalTrackingNumber = await generate12DigitTrackingNumber(db, userPrefix);

        await db('tracking_records').insert({
          id,
          tracking_number: finalTrackingNumber,
          part_type,
          vehicle_make,
          vehicle_model,
          vehicle_year,
          vin: vin || null,
          part_stock_number,
          shipment_origin,
          destination,
          current_status: status,
          estimated_delivery_date: estimated_delivery_date || null,
          notes: notes || null,
          assigned_user_id: assignedUserId,
          created_by_id: req.user.id,
          date_created: now,
          last_updated: now,
        });

        // Insert succeeded, exit retry loop
        break;
      } catch (insertErr) {
        // Unique constraint violation (Postgres error code 23505 or SQLite unique constraint)
        const isUniqueViolation =
          insertErr.code === '23505' ||
          (insertErr.message && insertErr.message.toLowerCase().includes('unique'));

        if (isUniqueViolation && insertAttempts < maxInsertAttempts - 1) {
          insertAttempts++;
          continue;
        }
        throw insertErr;
      }
    }

    // Create initial status history entry
    await db('status_history').insert({
      id: uuidv4(),
      tracking_record_id: id,
      status,
      notes: 'Record created',
      updated_by_id: req.user.id,
      updated_at: now,
    });

    const record = await db('tracking_records').where({ id }).first();
    res.status(201).json({ record });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/tracking/:id
 * Update tracking record fields (not status — use POST /:id/status for that).
 */
router.put('/:id', updateTrackingValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const db = req.app.get('db');
    const { id } = req.params;

    const record = await db('tracking_records').where({ id }).first();
    if (!record) {
      return res.status(404).json({ error: 'Tracking record not found' });
    }

    // Regular users can only edit their own records
    if (req.user.role !== 'admin' && record.assigned_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const allowedFields = [
      'part_type', 'vehicle_make', 'vehicle_model', 'vehicle_year',
      'vin', 'part_stock_number', 'shipment_origin', 'destination',
      'estimated_delivery_date', 'notes',
    ];

    // Admin can also reassign
    if (req.user.role === 'admin') {
      allowedFields.push('assigned_user_id');
    }

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field] || null;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.last_updated = new Date().toISOString();

    await db('tracking_records').where({ id }).update(updates);

    const updated = await db('tracking_records')
      .select(
        'tracking_records.*',
        'assigned.name as assigned_user_name',
        'creator.name as created_by_name'
      )
      .leftJoin('users as assigned', 'tracking_records.assigned_user_id', 'assigned.id')
      .leftJoin('users as creator', 'tracking_records.created_by_id', 'creator.id')
      .where('tracking_records.id', id)
      .first();

    res.json({ record: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tracking/:id/status
 * Add a status update (appends to history, updates current_status + last_updated).
 */
router.post('/:id/status', statusUpdateValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const db = req.app.get('db');
    const { id } = req.params;
    const { status, notes } = req.body;

    const record = await db('tracking_records').where({ id }).first();
    if (!record) {
      return res.status(404).json({ error: 'Tracking record not found' });
    }

    // Regular users can only update their own records
    if (req.user.role !== 'admin' && record.assigned_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const now = new Date().toISOString();

    // Insert status history entry
    await db('status_history').insert({
      id: uuidv4(),
      tracking_record_id: id,
      status,
      notes: notes || null,
      updated_by_id: req.user.id,
      updated_at: now,
    });

    // Update the tracking record's current status
    await db('tracking_records').where({ id }).update({
      current_status: status,
      last_updated: now,
    });

    const updated = await db('tracking_records').where({ id }).first();
    res.json({ record: updated });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/tracking/:id
 * Delete a tracking record (admin only).
 */
router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const { id } = req.params;

    const record = await db('tracking_records').where({ id }).first();
    if (!record) {
      return res.status(404).json({ error: 'Tracking record not found' });
    }

    // Status history deleted via CASCADE
    await db('tracking_records').where({ id }).del();
    res.json({ message: 'Tracking record deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
