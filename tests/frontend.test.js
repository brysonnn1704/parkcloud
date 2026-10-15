const test = require('node:test');
const assert = require('node:assert');

// Test frontend formatters using dynamic import for ES modules
test('Frontend Utilities: Currency formatting in INR', async () => {
  const { formatINR } = await import('../frontend/src/utils/formatters.js');
  const res = formatINR(5000);
  assert.ok(res.includes('50.00'));

  const large = formatINR(12500050);
  assert.ok(large.includes('1,25,000.50') || large.includes('125,000.50'));
});

test('Frontend Utilities: Date formatting in Asia/Kolkata IST', async () => {
  const { formatIST } = await import('../frontend/src/utils/formatters.js');
  // UTC 2026-10-15T04:30:00Z = IST 2026-10-15 10:00 AM
  const formatted = formatIST('2026-10-15T04:30:00Z');
  assert.ok(formatted.includes('10:00'));
  assert.ok(formatted.includes('am') || formatted.includes('AM'));
});

test('Frontend Utilities: Indian plate normalization & validation', async () => {
  const { validatePlate } = await import('../frontend/src/utils/formatters.js');
  assert.strictEqual(validatePlate('mh-02-de-1234').valid, true);
  assert.strictEqual(validatePlate('mh-02-de-1234').normalized, 'MH02DE1234');

  assert.strictEqual(validatePlate('22 bh 9999 xy').valid, true);
  assert.strictEqual(validatePlate('22 bh 9999 xy').normalized, '22BH9999XY');

  assert.strictEqual(validatePlate('NOT_A_PLATE').valid, false);
});

test('Frontend Utilities: Mobile phone validation', async () => {
  const { validatePhone } = await import('../frontend/src/utils/formatters.js');
  assert.strictEqual(validatePhone('9820011223').valid, true);
  assert.strictEqual(validatePhone('9820011223').normalized, '+919820011223');

  assert.strictEqual(validatePhone('12345').valid, false);
});

test('Frontend Utilities: Email validation', async () => {
  const { validateEmail } = await import('../frontend/src/utils/formatters.js');
  assert.strictEqual(validateEmail('admin@parkcloud.in'), true);
  assert.strictEqual(validateEmail('invalid-email'), false);
});
