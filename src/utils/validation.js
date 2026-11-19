/** Shared form validation helpers (Indian mobile + basic fields). */

export function normalizeIndianMobile(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

export function isValidIndianMobile(value) {
  return /^[6-9]\d{9}$/.test(normalizeIndianMobile(value));
}

export function validatePersonName(value) {
  const name = String(value || '').trim();
  if (!name) return 'Name is required';
  if (name.length < 2) return 'Name must be at least 2 characters';
  return '';
}

export function validateIndianMobile(value) {
  const mobile = normalizeIndianMobile(value);
  if (!mobile) return 'Mobile number is required';
  if (mobile.length !== 10) return 'Enter a 10-digit mobile number';
  if (!/^[6-9]/.test(mobile)) return 'Mobile must start with 6, 7, 8, or 9';
  if (!isValidIndianMobile(mobile)) return 'Enter a valid Indian mobile number';
  return '';
}

export function validatePassword(value, { minLength = 8 } = {}) {
  const password = String(value || '');
  if (!password) return 'Password is required';
  if (password.length < minLength) return `Password must be at least ${minLength} characters`;
  return '';
}

export function passwordStrengthHint(value) {
  const password = String(value || '');
  if (password.length >= 12) return 'Strong password';
  if (password.length >= 8) return 'Good password';
  if (password.length > 0) return `Need ${8 - password.length} more character(s)`;
  return '';
}
