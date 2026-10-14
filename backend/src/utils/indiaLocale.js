// Indian Localization & Standardization Utility
// Handles Currency (INR / Paise), Timezone (Asia/Kolkata), Vehicle Registrations, and Mobile numbers

/**
 * Format integer paise into Indian Rupee string with lakh/crore commas
 * Example: 12500050 paise -> ₹1,25,000.50
 */
function formatINRFromPaise(paise) {
  const amount = (paise || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format UTC Date to IST String (DD/MM/YYYY hh:mm A)
 */
function formatISTDateTime(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Get current hour in IST (0 - 23)
 */
function getISTHour(dateInput = new Date()) {
  const date = new Date(dateInput);
  const istString = date.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
  });
  return parseInt(istString, 10);
}

/**
 * Get IST day of week (0 = Sunday, 6 = Saturday)
 */
function getISTDayOfWeek(dateInput = new Date()) {
  const date = new Date(dateInput);
  const istDateString = date.toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
  });
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.indexOf(istDateString);
}

/**
 * Normalize and validate Indian vehicle registration plate
 * Supports:
 * - Standard state formats: MH02AB1234, DL01C1234, KA05M9999
 * - Bharat Series: 22BH1234AA, 23BH9876BB
 */
function normalizeAndValidatePlate(plateInput) {
  if (!plateInput || typeof plateInput !== 'string') {
    return { valid: false, error: 'Vehicle registration is required' };
  }
  const clean = plateInput.toUpperCase().replace(/[\s-]/g, '');

  // Standard Indian State Format: e.g., MH02AB1234 or MH02A1234
  const standardPattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
  // Bharat (BH) Series Format: Year (2 digits) + BH + 4 digits + 1-2 letters (e.g. 22BH1234AA)
  const bhPattern = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;

  if (standardPattern.test(clean) || bhPattern.test(clean)) {
    return { valid: true, normalized: clean };
  }

  return {
    valid: false,
    error: 'Invalid Indian registration format. Expected format like MH02AB1234 or 22BH1234AA',
  };
}

/**
 * Normalize and validate Indian phone number
 * 10 digits starting with 6, 7, 8, or 9; optional +91 or 0 prefix
 */
function normalizeAndValidatePhone(phoneInput) {
  if (!phoneInput || typeof phoneInput !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }
  let clean = phoneInput.trim().replace(/[\s-]/g, '');
  if (clean.startsWith('+91')) {
    clean = clean.slice(3);
  } else if (clean.startsWith('91') && clean.length === 12) {
    clean = clean.slice(2);
  } else if (clean.startsWith('0') && clean.length === 11) {
    clean = clean.slice(1);
  }

  const phonePattern = /^[6-9][0-9]{9}$/;
  if (phonePattern.test(clean)) {
    return { valid: true, normalized: `+91${clean}` };
  }

  return {
    valid: false,
    error: 'Invalid Indian mobile number. Expected a 10-digit number starting with 6-9',
  };
}

module.exports = {
  formatINRFromPaise,
  formatISTDateTime,
  getISTHour,
  getISTDayOfWeek,
  normalizeAndValidatePlate,
  normalizeAndValidatePhone,
};
