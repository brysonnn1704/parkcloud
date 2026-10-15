const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const app = require('../backend/src/app');
const { pool } = require('../backend/src/config/db');
const { normalizeAndValidatePlate, normalizeAndValidatePhone, formatINRFromPaise } = require('../backend/src/utils/indiaLocale');
const { seedDatabase } = require('../backend/src/database/seed');

let server;
let baseUrl;

test.before(async () => {
  await seedDatabase();
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

// Helper for HTTP requests
async function makeRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, data };
}

// 1. Localization Utilities Tests
test('India Locale: Vehicle plate validation and normalization', () => {
  // Valid standard state plates
  const p1 = normalizeAndValidatePlate('mh 02 ab 1234');
  assert.strictEqual(p1.valid, true);
  assert.strictEqual(p1.normalized, 'MH02AB1234');

  const p2 = normalizeAndValidatePlate('DL-01-C-9999');
  assert.strictEqual(p2.valid, true);
  assert.strictEqual(p2.normalized, 'DL01C9999');

  // Valid Bharat (BH) series plate
  const p3 = normalizeAndValidatePlate('22 bh 1234 aa');
  assert.strictEqual(p3.valid, true);
  assert.strictEqual(p3.normalized, '22BH1234AA');

  // Invalid formats
  const inv1 = normalizeAndValidatePlate('INVALID123');
  assert.strictEqual(inv1.valid, false);

  const inv2 = normalizeAndValidatePlate('');
  assert.strictEqual(inv2.valid, false);
});

test('India Locale: Phone number normalization and validation', () => {
  const ph1 = normalizeAndValidatePhone('9820011223');
  assert.strictEqual(ph1.valid, true);
  assert.strictEqual(ph1.normalized, '+919820011223');

  const ph2 = normalizeAndValidatePhone('+91 98199 88776');
  assert.strictEqual(ph2.valid, true);
  assert.strictEqual(ph2.normalized, '+919819988776');

  // Invalid numbers
  const invPh = normalizeAndValidatePhone('123456');
  assert.strictEqual(invPh.valid, false);
});

test('India Locale: Currency formatting in Paise to INR', () => {
  const formatted = formatINRFromPaise(12500050);
  assert.ok(formatted.includes('1,25,000.50') || formatted.includes('125,000.50'));
});

// 2. Health & Readiness Tests
test('Health Check: Returns HTTP 200 with service status', async () => {
  const res = await makeRequest('/api/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.status, 'healthy');
  assert.strictEqual(res.data.service, 'parkcloud-backend');
});

test('Readiness Check: Verifies DB connection', async () => {
  const res = await makeRequest('/api/ready');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.database, 'connected');
  assert.ok(typeof res.data.dbLatencyMs === 'number');
});

// 3. Authentication Tests
let userToken;
let adminToken;
let userId;

test('Auth: User Login with Seeded Demo User', async () => {
  const res = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: {
      email: 'rahul.sharma@example.com',
      password: 'User@ParkCloud2026!',
    },
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  assert.ok(res.data.token);
  userToken = res.data.token;
  userId = res.data.user.id;
});

test('Auth: Admin Login with Seeded Admin User', async () => {
  const res = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: {
      email: 'admin@parkcloud.in',
      password: 'Admin@ParkCloud2026!',
    },
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  assert.strictEqual(res.data.user.role, 'ADMIN');
  adminToken = res.data.token;
});

test('Auth: Rejects invalid credentials', async () => {
  const res = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: {
      email: 'rahul.sharma@example.com',
      password: 'WrongPassword!',
    },
  });
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.data.success, false);
});

test('Auth: User cannot access admin endpoints', async () => {
  const res = await makeRequest('/api/lots', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: {
      name: 'Unauthorized Lot',
      address: 'Test Road',
      city: 'Mumbai',
      pincode: '400001',
    },
  });
  assert.strictEqual(res.status, 403);
});

test('Auth: Reject access to protected endpoints without token', async () => {
  const res = await makeRequest('/api/bookings/my');
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.data.success, false);
});

test('Auth: Register new user with validation', async () => {
  const res = await makeRequest('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Vikram Malhotra',
      email: 'vikram.m@example.com',
      phone: '9820199887',
      password: 'SecurePassword123!',
    },
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.success, true);
  assert.ok(res.data.token);
});

test('Auth: Reject duplicate email registration', async () => {
  const res = await makeRequest('/api/auth/register', {
    method: 'POST',
    body: {
      fullName: 'Vikram Duplicate',
      email: 'vikram.m@example.com',
      phone: '9820199888',
      password: 'SecurePassword123!',
    },
  });
  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.data.success, false);
});

// 4. Lots & Slots Tests
let selectedLotId;
let selectedSlotId;

test('Lots: List all active parking lots', async () => {
  const res = await makeRequest('/api/lots');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  assert.ok(Array.isArray(res.data.lots));
  assert.strictEqual(res.data.lots.length, 5);
  selectedLotId = res.data.lots[0].id;
});

test('Slots: Check slot availability with time interval', async () => {
  // Use tomorrow 10:00 - 12:00 IST (UTC 04:30 to 06:30)
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  const start = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 4, 30, 0)).toISOString();
  const end = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 6, 30, 0)).toISOString();

  const res = await makeRequest(`/api/lots/${selectedLotId}/availability?startTime=${encodeURIComponent(start)}&endTime=${encodeURIComponent(end)}&vehicleType=FOUR_WHEELER`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  assert.ok(Array.isArray(res.data.slots));
  assert.ok(res.data.slots.length > 0);
  selectedSlotId = res.data.slots[0].id;
});

// 5. Vehicles Tests
let newVehicleId;

test('Vehicles: Register vehicle with valid plate', async () => {
  const res = await makeRequest('/api/vehicles', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: {
      registrationNumber: 'MH 12 CD 3456',
      vehicleType: 'FOUR_WHEELER',
      nickname: 'Honda City',
    },
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.success, true);
  assert.strictEqual(res.data.vehicle.registration_number, 'MH12CD3456');
  newVehicleId = res.data.vehicle.id;
});

test('Vehicles: Reject duplicate registration for the same user', async () => {
  const res = await makeRequest('/api/vehicles', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: {
      registrationNumber: 'MH12CD3456',
      vehicleType: 'FOUR_WHEELER',
    },
  });
  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.data.success, false);
});

test('Vehicles: Reject invalid vehicle plate format', async () => {
  const res = await makeRequest('/api/vehicles', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: {
      registrationNumber: 'XYZ-NOT-A-PLATE',
      vehicleType: 'FOUR_WHEELER',
    },
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.data.success, false);
});

// 6. Booking & Concurrency Tests
let createdBookingId;
let createdBookingRef;
let validBookingStart;
let validBookingEnd;

test('Booking: Successful booking creation and QR pass generation', async () => {
  // Deterministic booking tomorrow 10:00 - 12:00 IST (UTC 04:30 - 06:30)
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  validBookingStart = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 4, 30, 0)).toISOString();
  validBookingEnd = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 6, 30, 0)).toISOString();

  const res = await makeRequest('/api/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: {
      lotId: selectedLotId,
      slotId: selectedSlotId,
      vehicleId: newVehicleId,
      startTime: validBookingStart,
      endTime: validBookingEnd,
    },
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.success, true);
  assert.ok(res.data.booking.id);
  assert.ok(res.data.booking.booking_reference);
  const qr = res.data.booking.qrCodeDataUrl || res.data.booking.qr_code_data;
  assert.ok(qr && qr.startsWith('data:image/png;base64,'));
  assert.strictEqual(res.data.booking.status, 'CONFIRMED');
  assert.ok(res.data.booking.estimated_fee_paise > 0);

  createdBookingId = res.data.booking.id;
  createdBookingRef = res.data.booking.booking_reference;
});

test('Booking: Rejects conflicting overlapping booking (Double-Booking Prevention)', async () => {
  // Attempt to book overlapping window (10:30 to 11:30 IST) on the same slot
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  const conflictStart = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 5, 0, 0)).toISOString();
  const conflictEnd = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 6, 0, 0)).toISOString();

  const res = await makeRequest('/api/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: {
      lotId: selectedLotId,
      slotId: selectedSlotId,
      vehicleId: newVehicleId,
      startTime: conflictStart,
      endTime: conflictEnd,
    },
  });

  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.data.code, 'SLOT_TIME_CONFLICT');
});

test('Booking: Rejects booking in the past', async () => {
  const pastStart = new Date(Date.now() - 3600 * 1000 * 2).toISOString();
  const pastEnd = new Date(Date.now() - 3600 * 1000).toISOString();

  const res = await makeRequest('/api/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: {
      lotId: selectedLotId,
      slotId: selectedSlotId,
      vehicleId: newVehicleId,
      startTime: pastStart,
      endTime: pastEnd,
    },
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.data.success, false);
});

test('Booking: Rejects booking where end time is before start time', async () => {
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  const start = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 6, 0, 0)).toISOString();
  const end = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate(), 5, 0, 0)).toISOString();

  const res = await makeRequest('/api/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: {
      lotId: selectedLotId,
      slotId: selectedSlotId,
      vehicleId: newVehicleId,
      startTime: start,
      endTime: end,
    },
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.data.success, false);
});

test('Booking: High-concurrency race condition test (Simultaneous requests for same slot)', async () => {
  // Test a future window on day after tomorrow (14:00 - 16:00 IST = UTC 08:30 - 10:30)
  const dayAfter = new Date(Date.now() + 48 * 3600 * 1000);
  const raceStart = new Date(Date.UTC(dayAfter.getUTCFullYear(), dayAfter.getUTCMonth(), dayAfter.getUTCDate(), 8, 30, 0)).toISOString();
  const raceEnd = new Date(Date.UTC(dayAfter.getUTCFullYear(), dayAfter.getUTCMonth(), dayAfter.getUTCDate(), 10, 30, 0)).toISOString();

  const promises = Array.from({ length: 5 }, () =>
    makeRequest('/api/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        lotId: selectedLotId,
        slotId: selectedSlotId,
        vehicleId: newVehicleId,
        startTime: raceStart,
        endTime: raceEnd,
      },
    })
  );

  const results = await Promise.all(promises);
  const successCount = results.filter(r => r.status === 201).length;
  const conflictCount = results.filter(r => r.status === 409).length;

  assert.strictEqual(successCount, 1, 'Exactly ONE concurrent booking should succeed');
  assert.strictEqual(conflictCount, 4, 'All 4 competing concurrent requests must be rejected with 409 Conflict');
});

// 7. Check-in & Check-out Workflow Tests
test('Check-in: Operator checks in vehicle via booking reference', async () => {
  const res = await makeRequest('/api/bookings/check-in', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { bookingReference: createdBookingRef },
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
});

test('Check-in: Reject check-in for invalid non-existent reference', async () => {
  const res = await makeRequest('/api/bookings/check-in', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { bookingReference: 'PC-NONEXISTENT-999' },
  });
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.data.success, false);
});

test('Check-out: Operator checks out vehicle', async () => {
  const res = await makeRequest('/api/bookings/check-out', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { bookingReference: createdBookingRef },
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
});

test('Check-out: Reject check-out for already completed booking', async () => {
  const res = await makeRequest('/api/bookings/check-out', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { bookingReference: createdBookingRef },
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.data.success, false);
});

// 8. Cancellation Workflow
test('Cancellation: User can cancel upcoming booking', async () => {
  // Create a separate booking to cancel
  const futureDate = new Date(Date.now() + 72 * 3600 * 1000);
  const bStart = new Date(Date.UTC(futureDate.getUTCFullYear(), futureDate.getUTCMonth(), futureDate.getUTCDate(), 5, 0, 0)).toISOString();
  const bEnd = new Date(Date.UTC(futureDate.getUTCFullYear(), futureDate.getUTCMonth(), futureDate.getUTCDate(), 7, 0, 0)).toISOString();

  const createRes = await makeRequest('/api/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: {
      lotId: selectedLotId,
      slotId: selectedSlotId,
      vehicleId: newVehicleId,
      startTime: bStart,
      endTime: bEnd,
    },
  });
  assert.strictEqual(createRes.status, 201);
  const cancelBookingId = createRes.data.booking.id;

  const cancelRes = await makeRequest(`/api/bookings/${cancelBookingId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: { reason: 'Plans changed' },
  });
  assert.strictEqual(cancelRes.status, 200);
  assert.strictEqual(cancelRes.data.success, true);
  assert.strictEqual(cancelRes.data.booking.status, 'CANCELLED');
});

// 9. Analytics & Heatmap Tests
test('Analytics: Summary metrics with formula info', async () => {
  const res = await makeRequest('/api/analytics/summary');
  assert.strictEqual(res.status, 200);
  assert.ok(res.data.totalSlots > 0);
  assert.ok(res.data.metricsFormulaInfo.occupancyRate.includes('Active Occupied Slots'));
});

test('Analytics: Peak hours aggregation in IST', async () => {
  const res = await makeRequest('/api/analytics/peak-hours');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.peakHours.length, 24);
});

test('Analytics: Utilization heatmap (7 days x 24 hours)', async () => {
  const res = await makeRequest('/api/analytics/heatmap');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.heatmap.length, 7);
  assert.strictEqual(res.data.heatmap[0].hours.length, 24);
});

test('Analytics: Occupancy forecast returns projections', async () => {
  const res = await makeRequest('/api/analytics/forecast');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  assert.ok(res.data.forecast);
});

// 10. Security: SQL Injection Resistance
test('Security: SQL Injection attempt in query parameters handled safely', async () => {
  const sqlInjectionPayload = "'; DROP TABLE users; --";
  const res = await makeRequest(`/api/files?lotId=${encodeURIComponent(sqlInjectionPayload)}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  // Must return 200 with 0 results or 400 bad uuid, NEVER 500 database execution of injected query
  assert.ok([200, 400].includes(res.status));
});

// 11. File Storage & Report Generation Tests
test('Reports: Generate PDF report from real DB bookings', async () => {
  const res = await makeRequest('/api/files/generate-report', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { format: 'PDF', lotId: selectedLotId },
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.file.file_type, 'REPORT_PDF');
  assert.ok(res.data.file.file_size_bytes > 0);
});

test('Reports: Generate CSV report', async () => {
  const res = await makeRequest('/api/files/generate-report', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { format: 'CSV' },
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.file.file_type, 'REPORT_CSV');
});
