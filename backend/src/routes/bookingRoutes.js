const express = require('express');
const { z } = require('zod');
const { pool } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const bookingService = require('../services/bookingService');
const { formatINRFromPaise, formatISTDateTime } = require('../utils/indiaLocale');

const router = express.Router();

const createBookingSchema = z.object({
  lotId: z.string().uuid(),
  slotId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  startTime: z.string(),
  endTime: z.string(),
});

// Create a booking
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const parsed = createBookingSchema.parse(req.body);

    const booking = await bookingService.createBooking({
      userId: req.user.id,
      lotId: parsed.lotId,
      slotId: parsed.slotId,
      vehicleId: parsed.vehicleId,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
    });

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      booking,
    });
  } catch (err) {
    next(err);
  }
});

// Get logged-in user's bookings
router.get('/my', authenticateToken, async (req, res, next) => {
  try {
    const query = `
      SELECT 
        b.*,
        l.name as lot_name,
        l.city as lot_city,
        l.address as lot_address,
        s.slot_number,
        s.category as slot_category,
        v.registration_number,
        v.vehicle_type,
        v.nickname as vehicle_nickname
      FROM bookings b
      JOIN parking_lots l ON b.lot_id = l.id
      JOIN parking_slots s ON b.slot_id = s.id
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.user_id = $1
      ORDER BY b.start_time DESC;
    `;
    const result = await pool.query(query, [req.user.id]);

    const formatted = result.rows.map(b => ({
      ...b,
      feeFormatted: formatINRFromPaise(b.estimated_fee_paise),
      startTimeIST: formatISTDateTime(b.start_time),
      endTimeIST: formatISTDateTime(b.end_time),
    }));

    res.json({ success: true, bookings: formatted });
  } catch (err) {
    next(err);
  }
});

// Get single booking
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const query = `
      SELECT 
        b.*,
        l.name as lot_name,
        l.city as lot_city,
        l.address as lot_address,
        s.slot_number,
        s.category as slot_category,
        v.registration_number,
        v.vehicle_type,
        v.nickname as vehicle_nickname
      FROM bookings b
      JOIN parking_lots l ON b.lot_id = l.id
      JOIN parking_slots s ON b.slot_id = s.id
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.id = $1;
    `;
    const result = await pool.query(query, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found.' });
    }

    const booking = result.rows[0];
    if (req.user.role !== 'ADMIN' && booking.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    res.json({
      success: true,
      booking: {
        ...booking,
        feeFormatted: formatINRFromPaise(booking.estimated_fee_paise),
        startTimeIST: formatISTDateTime(booking.start_time),
        endTimeIST: formatISTDateTime(booking.end_time),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Cancel a booking
router.post('/:id/cancel', authenticateToken, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const cancelled = await bookingService.cancelBooking({
      bookingId: req.params.id,
      userId: req.user.id,
      isAdmin: req.user.role === 'ADMIN',
      reason,
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully.',
      booking: cancelled,
    });
  } catch (err) {
    next(err);
  }
});

// Operator / Admin Check-in (Scan or Manual Entry)
router.post('/check-in', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { bookingReference } = req.body;
    if (!bookingReference) {
      return res.status(400).json({ success: false, error: 'Booking reference is required.' });
    }

    const result = await bookingService.checkIn({
      bookingReference: bookingReference.trim(),
      operatorUserId: req.user.id,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Operator / Admin Check-out
router.post('/check-out', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { bookingReference } = req.body;
    if (!bookingReference) {
      return res.status(400).json({ success: false, error: 'Booking reference is required.' });
    }

    const result = await bookingService.checkOut({
      bookingReference: bookingReference.trim(),
      operatorUserId: req.user.id,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Admin list all bookings
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { status, lotId, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        b.*,
        u.email as user_email,
        u.full_name as user_name,
        l.name as lot_name,
        s.slot_number,
        v.registration_number,
        v.vehicle_type
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN parking_lots l ON b.lot_id = l.id
      JOIN parking_slots s ON b.slot_id = s.id
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND b.status = $${params.length}`;
    }
    if (lotId) {
      params.push(lotId);
      query += ` AND b.lot_id = $${params.length}`;
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      bookings: result.rows.map(b => ({
        ...b,
        feeFormatted: formatINRFromPaise(b.estimated_fee_paise),
        startTimeIST: formatISTDateTime(b.start_time),
        endTimeIST: formatISTDateTime(b.end_time),
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
