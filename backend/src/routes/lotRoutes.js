const express = require('express');
const { z } = require('zod');
const { pool } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');

const router = express.Router();

const lotSchema = z.object({
  name: z.string().min(3),
  address: z.string().min(5),
  city: z.string().min(2),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid 6-digit Indian PIN code'),
  description: z.string().optional(),
  operatingStartHour: z.number().int().min(0).max(23).default(6),
  operatingEndHour: z.number().int().min(0).max(23).default(23),
  rateTwoWheelerPaise: z.number().int().min(0).default(2000),
  rateThreeWheelerPaise: z.number().int().min(0).default(3000),
  rateFourWheelerPaise: z.number().int().min(0).default(5000),
  rateEvPaise: z.number().int().min(0).default(4000),
  rateCommercialPaise: z.number().int().min(0).default(8000),
});

// List all active parking lots
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.*,
        COUNT(s.id) as total_slots,
        COUNT(CASE WHEN s.category = 'EV_CHARGING' THEN 1 END) as ev_slots,
        COUNT(CASE WHEN s.category = 'TWO_WHEELER' THEN 1 END) as two_wheeler_slots
      FROM parking_lots l
      LEFT JOIN parking_slots s ON l.id = s.lot_id AND s.is_active = true
      WHERE l.is_active = true
      GROUP BY l.id
      ORDER BY l.city, l.name;
    `);

    res.json({ success: true, lots: result.rows });
  } catch (err) {
    next(err);
  }
});

// Get single lot with its slots
router.get('/:id', async (req, res, next) => {
  try {
    const lotRes = await pool.query(`SELECT * FROM parking_lots WHERE id = $1;`, [req.params.id]);
    if (lotRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Parking lot not found.' });
    }

    const slotsRes = await pool.query(`
      SELECT * FROM parking_slots 
      WHERE lot_id = $1 AND is_active = true
      ORDER BY slot_number ASC;
    `, [req.params.id]);

    res.json({
      success: true,
      lot: lotRes.rows[0],
      slots: slotsRes.rows,
    });
  } catch (err) {
    next(err);
  }
});

// Create lot (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const parsed = lotSchema.parse(req.body);

    const result = await pool.query(`
      INSERT INTO parking_lots (
        name, address, city, pincode, description,
        operating_start_hour, operating_end_hour,
        rate_two_wheeler_paise, rate_three_wheeler_paise, rate_four_wheeler_paise,
        rate_ev_paise, rate_commercial_paise
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `, [
      parsed.name, parsed.address, parsed.city, parsed.pincode, parsed.description || '',
      parsed.operatingStartHour, parsed.operatingEndHour,
      parsed.rateTwoWheelerPaise, parsed.rateThreeWheelerPaise, parsed.rateFourWheelerPaise,
      parsed.rateEvPaise, parsed.rateCommercialPaise
    ]);

    res.status(201).json({ success: true, message: 'Parking lot created', lot: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

// Update lot (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const parsed = lotSchema.partial().parse(req.body);
    const existing = await pool.query(`SELECT * FROM parking_lots WHERE id = $1;`, [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Parking lot not found.' });
    }

    const current = existing.rows[0];
    const updated = await pool.query(`
      UPDATE parking_lots SET
        name = COALESCE($1, name),
        address = COALESCE($2, address),
        city = COALESCE($3, city),
        pincode = COALESCE($4, pincode),
        description = COALESCE($5, description),
        operating_start_hour = COALESCE($6, operating_start_hour),
        operating_end_hour = COALESCE($7, operating_end_hour),
        rate_two_wheeler_paise = COALESCE($8, rate_two_wheeler_paise),
        rate_four_wheeler_paise = COALESCE($9, rate_four_wheeler_paise),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *;
    `, [
      parsed.name, parsed.address, parsed.city, parsed.pincode, parsed.description,
      parsed.operatingStartHour, parsed.operatingEndHour,
      parsed.rateTwoWheelerPaise, parsed.rateFourWheelerPaise,
      req.params.id
    ]);

    res.json({ success: true, message: 'Parking lot updated', lot: updated.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
