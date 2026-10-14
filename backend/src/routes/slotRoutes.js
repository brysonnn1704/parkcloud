const express = require('express');
const { z } = require('zod');
const { pool } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

const slotSchema = z.object({
  slotNumber: z.string().min(1),
  category: z.enum(['STANDARD', 'ACCESSIBLE', 'EV_CHARGING', 'TWO_WHEELER', 'RESERVED']).default('STANDARD'),
});

// List slots for a lot
router.get('/lots/:lotId/slots', async (req, res, next) => {
  try {
    const slotsRes = await pool.query(`
      SELECT * FROM parking_slots 
      WHERE lot_id = $1 AND is_active = true
      ORDER BY slot_number ASC;
    `, [req.params.lotId]);

    res.json({ success: true, slots: slotsRes.rows });
  } catch (err) {
    next(err);
  }
});

// Create slot (Admin only)
router.post('/lots/:lotId/slots', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const parsed = slotSchema.parse(req.body);

    // Verify lot exists
    const lotRes = await pool.query('SELECT id FROM parking_lots WHERE id = $1;', [req.params.lotId]);
    if (lotRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Parking lot not found.' });
    }

    const result = await pool.query(`
      INSERT INTO parking_slots (lot_id, slot_number, category)
      VALUES ($1, $2, $3)
      RETURNING *;
    `, [req.params.lotId, parsed.slotNumber.toUpperCase().trim(), parsed.category]);

    res.status(201).json({ success: true, slot: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// Time-interval based availability check for a lot
router.get('/lots/:lotId/availability', async (req, res, next) => {
  try {
    const { startTime, endTime, vehicleType } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Query parameters startTime and endTime (ISO format) are required.',
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time window. End time must be after start time.',
      });
    }

    // Fetch all slots in lot with overlap check
    const query = `
      SELECT 
        s.id,
        s.lot_id,
        s.slot_number,
        s.category,
        s.is_active,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.slot_id = s.id
              AND b.status IN ('CONFIRMED', 'ACTIVE')
              AND tstzrange(b.start_time, b.end_time, '[)') && tstzrange($2::timestamptz, $3::timestamptz, '[)')
          ) THEN false
          ELSE true
        END as is_available
      FROM parking_slots s
      WHERE s.lot_id = $1 AND s.is_active = true
      ORDER BY s.slot_number ASC;
    `;

    const result = await pool.query(query, [req.params.lotId, start.toISOString(), end.toISOString()]);

    // Annotate suitability for vehicle type
    const slots = result.rows.map(slot => {
      let suitable = true;
      if (vehicleType === 'EV' && slot.category !== 'EV_CHARGING' && slot.category !== 'STANDARD') {
        suitable = false;
      }
      if (vehicleType === 'TWO_WHEELER' && slot.category !== 'TWO_WHEELER' && slot.category !== 'STANDARD') {
        suitable = false;
      }
      return {
        ...slot,
        is_available: slot.is_available,
        is_suitable_for_vehicle: suitable,
      };
    });

    const totalAvailable = slots.filter(s => s.is_available).length;

    res.json({
      success: true,
      timeWindow: {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
      totalSlots: slots.length,
      availableSlotsCount: totalAvailable,
      slots,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
