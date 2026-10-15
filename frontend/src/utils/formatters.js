// Frontend Utility: Indian Formatting & Form Validation Helpers

export function formatINR(paise) {
  const amount = (paise || 0) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatIST(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

export function validatePlate(plate) {
  if (!plate || typeof plate !== 'string') return { valid: false, error: 'License plate is required' };
  const clean = plate.toUpperCase().replace(/[\s-]/g, '');
  const standardPattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
  const bhPattern = /^[0-9]{2}BH[0-9]{4}[A-Z]{1,2}$/;
  if (standardPattern.test(clean) || bhPattern.test(clean)) {
    return { valid: true, normalized: clean };
  }
  return { valid: false, error: 'Expected standard (e.g. MH02DE1234) or Bharat Series (e.g. 22BH1234AA)' };
}

export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return { valid: false, error: 'Phone number is required' };
  let clean = phone.trim().replace(/[\s-]/g, '');
  if (clean.startsWith('+91')) clean = clean.slice(3);
  else if (clean.startsWith('91') && clean.length === 12) clean = clean.slice(2);
  else if (clean.startsWith('0') && clean.length === 11) clean = clean.slice(1);

  if (/^[6-9][0-9]{9}$/.test(clean)) {
    return { valid: true, normalized: `+91${clean}` };
  }
  return { valid: false, error: 'Enter a valid 10-digit Indian mobile number' };
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
