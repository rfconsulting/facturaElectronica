const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const cleanName = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const validEmail = (value) => { const email = normalizeEmail(value); return email.length <= 254 && EMAIL_RE.test(email); };
const validPassword = (value) => typeof value === 'string' && value.length >= 12 && value.length <= 72 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
module.exports = { normalizeEmail, cleanName, validEmail, validPassword };
