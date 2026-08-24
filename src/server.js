const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const MySQLStoreFactory = require('express-mysql-session');
const { rateLimit } = require('express-rate-limit');
const env = require('./config/env');
const pool = require('./config/database');
const { issueCsrfToken, requireAuth, requireMfa } = require('./middleware/security');
const { observeRequest, renderMetrics } = require('./services/metrics');

const app = express();
if (env.trustProxy) app.set('trust proxy', env.trustProxy);
app.disable('x-powered-by');
app.use((req, res, next) => { req.requestId = crypto.randomUUID(); res.setHeader('x-request-id', req.requestId); next(); });
app.use(observeRequest);
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", 'https://fonts.googleapis.com'], fontSrc: ["'self'", 'https://fonts.gstatic.com'], imgSrc: ["'self'", 'data:'], objectSrc: ["'none'"], frameAncestors: ["'none'"] } } }));
app.use(compression());
app.use(express.json({ limit: '32kb', strict: true }));

const MySQLStore = MySQLStoreFactory(session);
const sessionStore = new MySQLStore({ ...env.db, createDatabaseTable: true, schema: { tableName: 'user_sessions', columnNames: { session_id: 'session_id', expires: 'expires', data: 'data' } } });
app.use(session({ name: 'factura.sid', secret: env.sessionSecret, store: sessionStore, resave: false, saveUninitialized: false, rolling: true, cookie: { httpOnly: true, secure: env.isProduction, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 } }));

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Demasiados intentos. Espera unos minutos.' } });
const configLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Demasiados cambios de configuración. Espera unos minutos.' } });
app.get('/api/csrf-token', issueCsrfToken);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/config', configLimiter, require('./routes/configuration'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/administration', require('./routes/administration'));
app.get('/api/health/live', (_req, res) => res.json({ status: 'ok' }));
app.get(['/api/health', '/api/health/ready'], async (_req, res) => { try { await pool.query('SELECT 1'); res.json({ status: 'ok', checks: { database: 'ok' } }); } catch { res.status(503).json({ status: 'degraded', checks: { database: 'failed' } }); } });
app.get('/internal/metrics', (req, res) => {
  const expected = Buffer.from(env.observabilityToken);
  const received = Buffer.from(String(req.get('authorization') || '').replace(/^Bearer\s+/i, ''));
  if (!expected.length || expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return res.status(401).type('text').send('Unauthorized\n');
  return res.type('text/plain; version=0.0.4').send(renderMetrics());
});
app.get(['/dashboard', '/dashboard.html'], requireAuth, requireMfa, (_req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'dashboard.html')));
app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'], maxAge: env.isProduction ? '1h' : 0 }));
app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((error, req, res, _next) => { console.error(JSON.stringify({ event: 'request_failed', requestId: req.requestId, error: error.message })); if (!res.headersSent) res.status(500).json({ error: 'Ocurrió un error interno.' }); });

const server = app.listen(env.port, () => console.log(`Factura Electrónica disponible en ${env.appPublicUrl}`));
async function shutdown() { server.close(async () => { await pool.end(); process.exit(0); }); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
