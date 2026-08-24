const crypto = require('node:crypto');
const pool = require('../config/database');
const env = require('../config/env');

async function requireAuth(req, res, next) {
  try {
    const sessionUser = req.session?.user;
    if (sessionUser && (!Number.isSafeInteger(Number(sessionUser.companyId)) || Number(sessionUser.companyId) < 1)) {
      return req.session.destroy(() => res.status(401).json({ error: 'Selecciona nuevamente tu empresa iniciando sesión.' }));
    }
    if (!sessionUser) return res.status(401).json({ error: 'Debes iniciar sesión.' });
    const [rows] = await pool.execute(`SELECT u.id,u.full_name,u.email,m.role,u.status,u.auth_version,
      m.company_id AS companyId,c.tenant_id AS tenantId,c.legal_name AS companyName
      FROM users u JOIN company_memberships m ON m.user_id=u.id AND m.company_id=? AND m.status='active'
      JOIN companies c ON c.id=m.company_id AND c.status='active'
      JOIN tenants t ON t.id=c.tenant_id AND t.status='active'
      WHERE u.id=? LIMIT 1`, [sessionUser.companyId, sessionUser.id]);
    const user = rows[0];
    if (!user || user.status !== 'active' || user.auth_version !== sessionUser.authVersion) {
      return req.session.destroy(() => res.status(401).json({ error: 'La sesión ya no es válida.' }));
    }
    req.authUser = user;
    req.company = { id: Number(user.companyId), tenantId: Number(user.tenantId), name: user.companyName };
    Object.assign(req.session.user, { role: user.role, companyId: req.company.id, tenantId: req.company.tenantId, companyName: req.company.name });
    return next();
  } catch (error) { return next(error); }
}

function requireMfa(req, res, next) {
  if (req.authUser?.role === 'administrator' && req.session?.mfaVerified !== true) {
    if (!req.originalUrl.startsWith('/api/') && req.accepts('html')) return res.redirect(302, '/mfa.html');
    return res.status(403).json({ error: 'Completa la verificación en dos pasos.', code: 'MFA_REQUIRED', redirect: '/mfa.html' });
  }
  return next();
}

function requireAdministrator(req, res, next) {
  if (req.authUser?.role !== 'administrator') return res.status(403).json({ error: 'Esta acción requiere una cuenta administradora.' });
  return next();
}

const RECENT_MFA_MS = 5 * 60 * 1000;
function requireRecentMfa(req, res, next) {
  const verifiedAt = Number(req.session?.mfaVerifiedAt || 0);
  if (req.session?.mfaVerified !== true || !verifiedAt || Date.now() - verifiedAt > RECENT_MFA_MS) {
    return res.status(403).json({ error: 'Confirma nuevamente tu código MFA para continuar.', code: 'MFA_RECENT_REQUIRED' });
  }
  return next();
}

function issueCsrfToken(req, res) {
  if (!req.session.csrfToken) req.session.csrfToken = env.randomToken();
  res.json({ csrfToken: req.session.csrfToken });
}

function verifyCsrf(req, res, next) {
  const expected = req.session?.csrfToken;
  const received = req.get('x-csrf-token');
  if (!expected || !received || expected.length !== received.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received))) {
    return res.status(403).json({ error: 'Token de seguridad inválido. Recarga la página.' });
  }
  return next();
}

module.exports = { requireAuth, requireMfa, requireAdministrator, requireRecentMfa, issueCsrfToken, verifyCsrf, RECENT_MFA_MS };
