const express = require('express');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const pool = require('../config/database');
const env = require('../config/env');
const audit = require('../services/audit');
const { requireAuth, verifyCsrf } = require('../middleware/security');
const { normalizeEmail, validEmail } = require('../validation/auth');
const mfa = require('../services/mfa');
const { resetMfaAttempts, mfaChallengeAvailable, recordMfaFailure } = require('../services/mfa-attempts');

const router = express.Router();
const DUMMY_HASH = '$2b$12$2b2kYf7n1Thf0Wwq3QxWQO0BRYxRPRYSrxrYrpy0V9HDq4ZgFQYje';

router.post('/login', verifyCsrf, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    if (!validEmail(email) || password.length > 72) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    const [rows] = await pool.execute(`SELECT u.id,u.full_name,u.email,u.password_hash,u.status,u.auth_version,u.mfa_enabled,u.failed_login_attempts,u.locked_until,
      m.role,m.company_id AS companyId,c.tenant_id AS tenantId,c.legal_name AS companyName
      FROM users u LEFT JOIN company_memberships m ON m.user_id=u.id AND m.status='active'
      LEFT JOIN companies c ON c.id=m.company_id AND c.status='active'
      LEFT JOIN tenants t ON t.id=c.tenant_id AND t.status='active'
      WHERE u.email=? ORDER BY m.company_id LIMIT 1`, [email]);
    const user = rows[0];
    const matches = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);
    const locked = user?.locked_until && new Date(user.locked_until) > new Date();
    if (!user || !user.companyId || !matches || user.status !== 'active' || locked) {
      if (user && !locked) await pool.execute(`UPDATE users SET locked_until=IF(failed_login_attempts+1>=5,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 15 MINUTE),NULL),failed_login_attempts=IF(failed_login_attempts+1>=5,0,failed_login_attempts+1) WHERE id=?`, [user.id]);
      await audit(req, 'login_failed', 'user', user?.id || null);
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }
    await new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
    req.session.user = { id: user.id, fullName: user.full_name, email: user.email, role: user.role, authVersion: user.auth_version, companyId: Number(user.companyId), tenantId: Number(user.tenantId), companyName: user.companyName };
    req.company = { id: Number(user.companyId), tenantId: Number(user.tenantId), name: user.companyName };
    req.session.mfaVerified = user.role !== 'administrator';
    req.session.csrfToken = env.randomToken();
    await pool.execute('UPDATE users SET failed_login_attempts=0,locked_until=NULL,last_login_at=UTC_TIMESTAMP() WHERE id=?', [user.id]);
    await audit(req, 'login_succeeded', 'user', user.id);
    return res.json({ message: 'Contraseña verificada.', user: req.session.user, redirect: user.role === 'administrator' ? '/mfa.html' : '/dashboard.html' });
  } catch (error) { return next(error); }
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.session.user }));

router.get('/companies', requireAuth, async (req, res, next) => {
  try {
    const [companies] = await pool.execute(`SELECT c.id,c.tenant_id AS tenantId,c.legal_name AS legalName,c.trade_name AS tradeName,m.role
      FROM company_memberships m JOIN companies c ON c.id=m.company_id
      JOIN tenants t ON t.id=c.tenant_id
      WHERE m.user_id=? AND m.status='active' AND c.status='active' AND t.status='active' ORDER BY c.legal_name`, [req.authUser.id]);
    return res.json({ companies, activeCompanyId: req.company.id });
  } catch (error) { return next(error); }
});

router.post('/company', requireAuth, verifyCsrf, async (req, res, next) => {
  try {
    const companyId = Number(req.body.companyId);
    if (!Number.isSafeInteger(companyId) || companyId < 1) return res.status(422).json({ error: 'Empresa inválida.' });
    const [rows] = await pool.execute(`SELECT c.id,c.tenant_id AS tenantId,c.legal_name AS companyName,m.role
      FROM company_memberships m JOIN companies c ON c.id=m.company_id
      JOIN tenants t ON t.id=c.tenant_id
      WHERE m.user_id=? AND m.company_id=? AND m.status='active' AND c.status='active' AND t.status='active' LIMIT 1`, [req.authUser.id, companyId]);
    const membership = rows[0];
    if (!membership) return res.status(403).json({ error: 'No tienes acceso a esa empresa.' });
    Object.assign(req.session.user, { companyId: Number(membership.id), tenantId: Number(membership.tenantId), companyName: membership.companyName, role: membership.role });
    req.company = { id: Number(membership.id), tenantId: Number(membership.tenantId), name: membership.companyName };
    req.session.mfaVerified = membership.role !== 'administrator';
    delete req.session.mfaVerifiedAt;
    await audit(req, 'company.switched', 'company', membership.id);
    return res.json({ message: 'Empresa activa actualizada.', user: req.session.user });
  } catch (error) { return next(error); }
});

router.post('/mfa/setup', requireAuth, verifyCsrf, async (req, res, next) => {
  try {
    if (req.authUser.role !== 'administrator') return res.status(403).json({ error: 'La verificación reforzada no aplica a este rol.' });
    const [rows] = await pool.execute('SELECT email,mfa_enabled,mfa_secret_encrypted FROM users WHERE id=? LIMIT 1', [req.authUser.id]);
    const user = rows[0];
    if (user.mfa_enabled) return res.json({ setupRequired: false });
    let secret;
    if (user.mfa_secret_encrypted) secret = mfa.decrypt(user.mfa_secret_encrypted);
    else { secret = mfa.generateSecret(); await pool.execute('UPDATE users SET mfa_secret_encrypted=? WHERE id=?', [mfa.encrypt(secret), req.authUser.id]); }
    const label = encodeURIComponent(`Factura Electronica:${user.email}`);
    const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=Factura%20Electronica&digits=6&period=30`;
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl, { errorCorrectionLevel: 'M', margin: 2, width: 260, color: { dark: '#3b0764', light: '#ffffff' } });
    return res.json({ setupRequired: true, secret, qrDataUrl });
  } catch (error) { return next(error); }
});

router.post(['/mfa/verify', '/mfa/step-up'], requireAuth, verifyCsrf, async (req, res, next) => {
  try {
    const genericError = 'Demasiados intentos. Inicia sesión nuevamente o espera diez minutos.';
    if (req.authUser.role !== 'administrator') return res.status(403).json({ error: 'La verificación reforzada no aplica a este rol.' });
    if (!mfaChallengeAvailable(req.session, req.authUser.id)) return res.status(429).json({ error: genericError });
    const [rows] = await pool.execute('SELECT mfa_secret_encrypted FROM users WHERE id=? LIMIT 1', [req.authUser.id]);
    if (!rows[0]?.mfa_secret_encrypted || !mfa.verify(mfa.decrypt(rows[0].mfa_secret_encrypted), req.body.code)) {
      const attempt = recordMfaFailure(req.session, req.authUser.id);
      await audit(req, attempt.limited ? 'mfa_challenge_limited' : 'mfa_failed', 'user', req.authUser.id);
      return res.status(attempt.limited ? 429 : 401).json({ error: attempt.limited ? genericError : 'Código de verificación incorrecto.' });
    }
    resetMfaAttempts(req.session);
    await pool.execute('UPDATE users SET mfa_enabled=TRUE WHERE id=?', [req.authUser.id]);
    req.session.mfaVerified = true;
    req.session.mfaVerifiedAt = Date.now();
    await audit(req, 'mfa_verified', 'user', req.authUser.id);
    return res.json({ message: 'Verificación completada.', redirect: '/dashboard.html' });
  } catch (error) { return next(error); }
});
router.post('/logout', requireAuth, verifyCsrf, async (req, res, next) => {
  try {
    await audit(req, 'logout', 'user', req.session.user.id);
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie('factura.sid');
      return res.json({ message: 'Sesión cerrada.' });
    });
  } catch (error) { return next(error); }
});

module.exports = router;
