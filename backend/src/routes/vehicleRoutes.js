const express = require('express');
const { z } = require('zod');
const { pool } = require('../config/db');
const { authenticateToken } = require('../middlewares/auth');
const { normalizeAndValidatePlate } = require('../utils/indiaLocale');

const router = express.Router();

const vehicleSchema = z.object({
  registrationNumber: z.string(),
  vehicleType: z.enum(['TWO_WHEELER', 'THREE_WHEELER', 'FOUR_WHEELER', 'EV', 'COMMERCIAL']),
  nickname: z.string().optional(),
});

// List vehicles for logged-in user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT id, registration_number, vehicle_type, nickname, created_at
      FROM vehicles
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC;
    `, [req.user.id]);

    res.json({ success: true, vehicles: result.rows });
  } catch (err) {
    next(err);
  }
});

// Add a new vehicle
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const parsed = vehicleSchema.parse(req.body);

    const plateCheck = normalizeAndValidatePlate(parsed.registrationNumber);
    if (!plateCheck.valid) {
      return res.status(400).json({ success: false, error: plateCheck.error });
    }

    // Check duplicate for this user
    const existing = await pool.query(`
      SELECT id FROM vehicles 
      WHERE user_id = $1 AND registration_number = $2 AND is_active = true;
    `, [req.user.id, plateCheck.normalized]);

    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'You have already registered this vehicle.' });
    }

    const insertRes = await pool.query(`
      INSERT INTO vehicles (user_id, registration_number, vehicle_type, nickname)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `, [req.user.id, plateCheck.normalized, parsed.vehicleType, parsed.nickname || 'My Vehicle']);

    res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      vehicle: insertRes.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

// Delete vehicle
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const resCheck = await pool.query(`
      SELECT id FROM vehicles WHERE id = $1 AND user_id = $2;
    `, [req.params.id, req.user.id]);

    if (resCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Vehicle not found or unauthorized.' });
    }

    await pool.query(`
      UPDATE vehicles SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1;
    `, [req.params.id]);

    res.json({ success: true, message: 'Vehicle removed successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
