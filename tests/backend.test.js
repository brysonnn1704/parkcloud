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

  const inv2 = normalizeAndValidatePlate('1234');
  assert.strictEqual(inv2.valid, false);
});

test('India Locale: Phone number normalization and validation', () => {
  const phone1 = normalizeAndValidatePhone('9820011223');
  assert.strictEqual(phone1.valid, true);
  assert.strictEqual(phone1.normalized, '+919820011223');

  const phone2 = normalizeAndValidatePhone('+91 98199 88776');
  assert.strictEqual(phone2.valid, true);
  assert.strictEqual(phone2.normalized, '+919819988776');

  const invPhone = normalizeAndValidatePhone('123456');
  assert.strictEqual(invPhone.valid, false);
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
  assert.strictEqual(res.data.status, 'ready');
  assert.strictEqual(res.data.database, 'connected');
});

// 3. Authentication Tests
let userToken = '';
let adminToken = '';
let testUserId = '';

test('Auth: User Login with Seeded Demo User', async () => {
  const res = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'rahul.sharma@example.com', password: 'User@ParkCloud2026!' },
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  assert.strictEqual(res.data.user.role, 'USER');
  userToken = res.data.token;
  testUserId = res.data.user.id;
});

test('Auth: Admin Login with Seeded Admin User', async () => {
  const res = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@parkcloud.in', password: 'Admin@ParkCloud2026!' },
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  assert.strictEqual(res.data.user.role, 'ADMIN');
  adminToken = res.data.token;
});

test('Auth: Rejects invalid credentials', async () => {
  const res = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'rahul.sharma@example.com', password: 'WrongPassword!' },
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
      address: 'Test Address',
      city: 'Mumbai',
      pincode: '400001',
    },
  });
  assert.strictEqual(res.status, 403);
});

// 4. Parking Lots & Availability Tests
let selectedLotId = '';
let selectedSlotId = '';

test('Lots: List all active parking lots', async () => {
  const res = await makeRequest('/api/lots');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  assert.ok(res.data.lots.length >= 5);
  selectedLotId = res.data.lots[0].id;
});

test('Slots: Check slot availability with time interval', async () => {
  const start = new Date(Date.now() + 3600 * 1000 * 5).toISOString();
  const end = new Date(Date.now() + 3600 * 1000 * 7).toISOString();

  const res = await makeRequest(`/api/lots/${selectedLotId}/availability?startTime=${start}&endTime=${end}&vehicleType=FOUR_WHEELER`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  assert.ok(res.data.slots.length > 0);
  selectedSlotId = res.data.slots[0].id;
});

// 5. Vehicle Management Tests
let newVehicleId = '';

test('Vehicles: Register vehicle with valid plate', async () => {
  const res = await makeRequest('/api/vehicles', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: {
      registrationNumber: 'MH 12 CD 5678',
      vehicleType: 'FOUR_WHEELER',
      nickname: 'Pune City Car',
    },
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.vehicle.registration_number, 'MH12CD5678');
  newVehicleId = res.data.vehicle.id;
});

test('Vehicles: Reject duplicate registration for the same user', async () => {
  const res = await makeRequest('/api/vehicles', {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` },
    body: {
      registrationNumber: 'MH12CD5678',
      vehicleType: 'FOUR_WHEELER',
    },
  });
  assert.strictEqual(res.status, 409);
});

// 6. Concurrency & Booking Engine Tests
let createdBookingId = '';
let createdBookingRef = '';

test('Booking: Successful booking creation and QR pass generation', async () => {
  const start = new Date(Date.now() + 3600 * 1000 * 10).toISOString();
  const end = new Date(Date.now() + 3600 * 1000 * 12).toISOString();

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

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.data.success, true);
  assert.ok(res.data.booking.booking_reference.startsWith('PC-'));
  assert.ok(res.data.booking.qrCodeDataUrl.startsWith('data:image/png;base64,'));
  createdBookingId = res.data.booking.id;
  createdBookingRef = res.data.booking.booking_reference;
});

test('Booking: Rejects conflicting overlapping booking (Double-Booking Prevention)', async () => {
  // Attempt to book the exact same slot during an overlapping window (1 hour into the previous booking)
  const conflictStart = new Date(Date.now() + 3600 * 1000 * 11).toISOString();
  const conflictEnd = new Date(Date.now() + 3600 * 1000 * 13).toISOString();

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

test('Booking: High-concurrency race condition test (Simultaneous requests for same slot)', async () => {
  // Simulate 5 simultaneous requests attempting to book the exact same slot at the exact same future time
  const raceStart = new Date(Date.now() + 3600 * 1000 * 20).toISOString();
  const raceEnd = new Date(Date.now() + 3600 * 1000 * 22).toISOString();

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

test('Check-out: Operator checks out vehicle', async () => {
  const res = await makeRequest('/api/bookings/check-out', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: { bookingReference: createdBookingRef },
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
});

// 8. Analytics & Heatmap Tests
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

// 9. File Storage & Report Generation Tests
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
