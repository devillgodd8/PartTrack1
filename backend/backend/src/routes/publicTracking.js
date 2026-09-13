const express = require('express');
const cors = require('cors');
const { authenticateApiKey } = require('../middleware/apiKeyAuth');

const router = express.Router();

// Allow cross-origin requests from ANY external website
router.use(cors({ origin: '*' }));

/**
 * GET /api/v1/track/:trackingNumber?
 * Public tracking lookup secured by Scoped API Key.
 * Supports both /api/v1/track/1234567890 and /api/v1/track?number=1234567890
 */
router.get(['/', '/:trackingNumber'], authenticateApiKey, async (req, res, next) => {
  try {
    const rawNumber = req.params.trackingNumber || req.query.number || req.query.tracking_number;

    if (!rawNumber || typeof rawNumber !== 'string' || !rawNumber.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Tracking number is required. Pass in URL path or ?number= query parameter.',
      });
    }

    const trackingNumber = rawNumber.trim();
    const db = req.app.get('db');

    // Query tracking record
    const record = await db('tracking_records')
      .select(
        'id',
        'tracking_number',
        'part_type',
        'vehicle_make',
        'vehicle_model',
        'vehicle_year',
        'shipment_origin',
        'destination',
        'current_status',
        'estimated_delivery_date',
        'date_created',
        'last_updated'
      )
      .where({ tracking_number: trackingNumber })
      .first();

    if (!record) {
      return res.status(404).json({
        success: false,
        error: `Tracking record with number "${trackingNumber}" not found.`,
      });
    }

    // Query status history timeline
    const history = await db('status_history')
      .select('status', 'notes', 'updated_at')
      .where({ tracking_record_id: record.id })
      .orderBy('updated_at', 'desc');

    res.json({
      success: true,
      data: {
        tracking_number: record.tracking_number,
        part_type: record.part_type,
        current_status: record.current_status,
        estimated_delivery_date: record.estimated_delivery_date,
        shipment: {
          origin: record.shipment_origin,
          destination: record.destination,
          date_created: record.date_created,
          last_updated: record.last_updated,
        },
        vehicle: {
          make: record.vehicle_make,
          model: record.vehicle_model,
          year: record.vehicle_year,
        },
        history,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
