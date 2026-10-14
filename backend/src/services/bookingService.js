const QRCode = require('qrcode');
const { pool } = require('../config/db');
const { getISTHour, formatINRFromPaise, formatISTDateTime } = require('../utils/indiaLocale');

/**
 * Calculate parking fee based on lot vehicle rates, duration in hours, and 18% GST
 */
function calculateFee(lot, vehicleType, startTime, endTime) {
  const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
  const durationHours = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60)));

  let hourlyRatePaise = lot.rate_four_wheeler_paise;
  switch (vehicleType) {
    case 'TWO_WHEELER':
      hourlyRatePaise = lot.rate_two_wheeler_paise;
      break;
    case 'THREE_WHEELER':
      hourlyRatePaise = lot.rate_three_wheeler_paise;
      break;
    case 'FOUR_WHEELER':
      hourlyRatePaise = lot.rate_four_wheeler_paise;
      break;
    case 'EV':
      hourlyRatePaise = lot.rate_ev_paise;
      break;
    case 'COMMERCIAL':
      hourlyRatePaise = lot.rate_commercial_paise;
      break;
  }

  const baseFeePaise = hourlyRatePaise * durationHours;
  const gstPaise = Math.round(baseFeePaise * 0.18);
  const totalFeePaise = baseFeePaise + gstPaise;

  return {
    durationHours,
    hourlyRatePaise,
    baseFeePaise,
    gstPaise,
    totalFeePaise,
  };
}

/**
 * Create a new booking with row-level locking and database exclusion constraint
 */
async function createBooking({ userId, lotId, slotId, vehicleId, startTime, endTime }) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();

  // 1. Time validity checks
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw { statusCode: 400, message: 'Invalid start or end timestamp provided.' };
  }
  if (end <= start) {
    throw { statusCode: 400, message: 'End time must be after start time.' };
  }
  if (start < new Date(now.getTime() - 5 * 60 * 1000)) {
    throw { statusCode: 400, message: 'Booking start time cannot be in the past.' };
  }
  const maxDurationMs = 7 * 24 * 3600 * 1000; // 7 days max
  if (end.getTime() - start.getTime() > maxDurationMs) {
    throw { statusCode: 400, message: 'Maximum booking duration is 7 days.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 2. Fetch and lock lot to verify operating hours in IST
    const lotRes = await client.query(`
      SELECT * FROM parking_lots WHERE id = $1 AND is_active = true FOR SHARE;
    `, [lotId]);
    if (lotRes.rows.length === 0) {
      throw { statusCode: 404, message: 'Parking lot not found or inactive.' };
    }
    const lot = lotRes.rows[0];

    const startHourIST = getISTHour(start);
    const endHourIST = getISTHour(end);
    if (startHourIST < lot.operating_start_hour || endHourIST > lot.operating_end_hour) {
      throw {
        statusCode: 400,
        message: `Operating hours for ${lot.name} are ${lot.operating_start_hour}:00 to ${lot.operating_end_hour}:00 IST.`,
      };
    }

    // 3. Fetch and verify vehicle ownership
    const vehicleRes = await client.query(`
      SELECT * FROM vehicles WHERE id = $1 AND user_id = $2 AND is_active = true;
    `, [vehicleId, userId]);
    if (vehicleRes.rows.length === 0) {
      throw { statusCode: 404, message: 'Vehicle not found or does not belong to you.' };
    }
    const vehicle = vehicleRes.rows[0];

    // 4. Lock specific slot using SELECT ... FOR UPDATE to avoid race conditions
    const slotRes = await client.query(`
      SELECT * FROM parking_slots 
      WHERE id = $1 AND lot_id = $2 AND is_active = true 
      FOR UPDATE;
    `, [slotId, lotId]);
    if (slotRes.rows.length === 0) {
      throw { statusCode: 404, message: 'Selected slot does not exist in this lot.' };
    }
    const slot = slotRes.rows[0];

    // 5. Pre-check for overlapping bookings on this slot (double safety alongside DB exclusion constraint)
    const overlapRes = await client.query(`
      SELECT id, booking_reference FROM bookings
      WHERE slot_id = $1
        AND status IN ('CONFIRMED', 'ACTIVE')
        AND tstzrange(start_time, end_time, '[)') && tstzrange($2, $3, '[)');
    `, [slotId, start.toISOString(), end.toISOString()]);

    if (overlapRes.rows.length > 0) {
      throw {
        statusCode: 409,
        message: 'Slot conflict: This slot is already booked during the requested time window.',
        code: 'SLOT_TIME_CONFLICT',
      };
    }

    // 6. Compute server-side fees
    const fees = calculateFee(lot, vehicle.vehicle_type, start, end);

    // 7. Generate unique booking reference
    const timestampPart = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingRef = `PC-${timestampPart}-${randomPart}`;

    // 8. Insert booking (protected by exclusion constraint in PostgreSQL)
    const insertRes = await client.query(`
      INSERT INTO bookings (
        booking_reference, user_id, vehicle_id, lot_id, slot_id,
        start_time, end_time, status, estimated_fee_paise, base_fee_paise, gst_paise
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'CONFIRMED', $8, $9, $10)
      RETURNING *;
    `, [
      bookingRef, userId, vehicleId, lotId, slotId,
      start.toISOString(), end.toISOString(),
      fees.totalFeePaise, fees.baseFeePaise, fees.gstPaise
    ]);
    const booking = insertRes.rows[0];

    // 9. Generate QR Code Pass Data
    const qrPayload = JSON.stringify({
      ref: booking.booking_reference,
      id: booking.id,
      lot: lot.name,
      slot: slot.slot_number,
      plate: vehicle.registration_number,
      start: formatISTDateTime(booking.start_time),
      end: formatISTDateTime(booking.end_time),
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload);

    // 10. Audit log
    await client.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, 'CREATE_BOOKING', 'BOOKING', $2, $3);
    `, [userId, booking.booking_reference, JSON.stringify({ lotId, slotId, vehicleId, fee: fees.totalFeePaise })]);

    await client.query('COMMIT');

    return {
      ...booking,
      qrCodeDataUrl,
      feesFormatted: {
        baseFee: formatINRFromPaise(fees.baseFeePaise),
        gst: formatINRFromPaise(fees.gstPaise),
        totalFee: formatINRFromPaise(fees.totalFeePaise),
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Cancel a booking if eligible (at least 30 minutes before start time)
 */
async function cancelBooking({ bookingId, userId, isAdmin, reason }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const res = await client.query(`
      SELECT b.*, l.name as lot_name FROM bookings b
      JOIN parking_lots l ON b.lot_id = l.id
      WHERE b.id = $1
      FOR UPDATE;
    `, [bookingId]);

    if (res.rows.length === 0) {
      throw { statusCode: 404, message: 'Booking not found.' };
    }
    const booking = res.rows[0];

    // Permission check
    if (!isAdmin && booking.user_id !== userId) {
      throw { statusCode: 403, message: 'You are not authorized to cancel this booking.' };
    }

    if (booking.status !== 'CONFIRMED') {
      throw { statusCode: 400, message: `Cannot cancel booking in '${booking.status}' status.` };
    }

    // Cancellation policy: Free cancellation up to 30 mins before scheduled start
    const now = new Date();
    const startTime = new Date(booking.start_time);
    const diffMinutes = (startTime.getTime() - now.getTime()) / (1000 * 60);

    if (!isAdmin && diffMinutes < 30 && diffMinutes > 0) {
      // Allowed but note late cancellation
    } else if (!isAdmin && diffMinutes <= 0) {
      throw { statusCode: 400, message: 'Cannot cancel a booking that has already started.' };
    }

    const cancelRes = await client.query(`
      UPDATE bookings
      SET status = 'CANCELLED',
          cancellation_reason = $1,
          cancelled_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `, [reason || 'Cancelled by user', bookingId]);

    await client.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, 'CANCEL_BOOKING', 'BOOKING', $2, $3);
    `, [userId, booking.booking_reference, JSON.stringify({ reason })]);

    await client.query('COMMIT');
    return cancelRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Check-in workflow (QR Scan or Admin Gate Entry)
 */
async function checkIn({ bookingReference, operatorUserId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query(`
      SELECT * FROM bookings WHERE booking_reference = $1 FOR UPDATE;
    `, [bookingReference]);

    if (res.rows.length === 0) {
      throw { statusCode: 404, message: 'Booking reference not found.' };
    }
    const booking = res.rows[0];

    if (booking.status !== 'CONFIRMED') {
      throw { statusCode: 400, message: `Cannot check in. Current booking status is '${booking.status}'.` };
    }

    // Transition to ACTIVE
    await client.query(`
      UPDATE bookings SET status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP WHERE id = $1;
    `, [booking.id]);

    // Create session record
    await client.query(`
      INSERT INTO parking_sessions (booking_id, check_in_time, checked_in_by, notes)
      VALUES ($1, CURRENT_TIMESTAMP, $2, 'Checked in via QR Scan / Operator');
    `, [booking.id, operatorUserId]);

    await client.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, 'CHECK_IN', 'BOOKING', $2, '{"status": "ACTIVE"}');
    `, [operatorUserId, booking.booking_reference]);

    await client.query('COMMIT');
    return { success: true, message: `Vehicle checked in successfully for pass ${bookingReference}` };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Check-out workflow
 */
async function checkOut({ bookingReference, operatorUserId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const res = await client.query(`
      SELECT * FROM bookings WHERE booking_reference = $1 FOR UPDATE;
    `, [bookingReference]);

    if (res.rows.length === 0) {
      throw { statusCode: 404, message: 'Booking reference not found.' };
    }
    const booking = res.rows[0];

    if (booking.status !== 'ACTIVE') {
      throw { statusCode: 400, message: `Cannot check out. Current booking status is '${booking.status}'.` };
    }

    // Transition to COMPLETED
    await client.query(`
      UPDATE bookings 
      SET status = 'COMPLETED',
          actual_fee_paise = estimated_fee_paise,
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1;
    `, [booking.id]);

    // Update session record
    await client.query(`
      UPDATE parking_sessions 
      SET check_out_time = CURRENT_TIMESTAMP,
          checked_out_by = $1,
          notes = 'Completed checkout'
      WHERE booking_id = $2 AND check_out_time IS NULL;
    `, [operatorUserId, booking.id]);

    await client.query(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES ($1, 'CHECK_OUT', 'BOOKING', $2, '{"status": "COMPLETED"}');
    `, [operatorUserId, booking.booking_reference]);

    await client.query('COMMIT');
    return { success: true, message: `Vehicle checked out successfully. Pass ${bookingReference} completed.` };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  createBooking,
  cancelBooking,
  checkIn,
  checkOut,
  calculateFee,
};
