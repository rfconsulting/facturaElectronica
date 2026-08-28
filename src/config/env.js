const crypto = require('node:crypto');
require('dotenv').config();

const required = ['SESSION_SECRET', 'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
if (process.env.SESSION_SECRET.length < 64) throw new Error('SESSION_SECRET debe tener al menos 64 caracteres.');

function integer(name, fallback, min, max) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${name} debe ser un entero entre ${min} y ${max}.`);
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
if (!['development', 'test', 'production'].includes(nodeEnv)) throw new Error('NODE_ENV no es válido.');
const appPublicUrl = String(process.env.APP_PUBLIC_URL || 'http://localhost:3000').replace(/\/$/, '');
if (nodeEnv === 'production' && !appPublicUrl.startsWith('https://')) throw new Error('APP_PUBLIC_URL debe usar HTTPS en producción.');
const mfaEncryptionKey = String(process.env.MFA_ENCRYPTION_KEY || '');
if (mfaEncryptionKey && !/^[a-f0-9]{64}$/i.test(mfaEncryptionKey)) throw new Error('MFA_ENCRYPTION_KEY debe tener exactamente 64 caracteres hexadecimales.');
if (nodeEnv === 'production' && !mfaEncryptionKey) throw new Error('MFA_ENCRYPTION_KEY es obligatorio en producción.');
const configMasterKey = String(process.env.CONFIG_MASTER_KEY || '');
if (configMasterKey && !/^[a-f0-9]{64}$/i.test(configMasterKey)) throw new Error('CONFIG_MASTER_KEY debe tener exactamente 64 caracteres hexadecimales.');
if (nodeEnv === 'production' && !configMasterKey) throw new Error('CONFIG_MASTER_KEY es obligatorio en producción.');
if (configMasterKey && mfaEncryptionKey && configMasterKey === mfaEncryptionKey) throw new Error('CONFIG_MASTER_KEY y MFA_ENCRYPTION_KEY deben ser diferentes.');
const observabilityToken = String(process.env.OBSERVABILITY_TOKEN || '');
const resendApiKey = String(process.env.RESEND_API_KEY || '');
const passwordResetEmailFrom = String(process.env.PASSWORD_RESET_EMAIL_FROM || '');
if (observabilityToken && observabilityToken.length < 32) throw new Error('OBSERVABILITY_TOKEN debe tener al menos 32 caracteres.');
if (nodeEnv === 'production' && !observabilityToken) throw new Error('OBSERVABILITY_TOKEN es obligatorio en producción.');

module.exports = Object.freeze({
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: integer('PORT', 3000, 1, 65535),
  trustProxy: integer('TRUST_PROXY', 0, 0, 10),
  sessionSecret: process.env.SESSION_SECRET,
  mfaEncryptionKey,
  configMasterKey,
  observabilityToken,
  resendApiKey,
  passwordResetEmailFrom,
  appPublicUrl,
  db: {
    host: process.env.DB_HOST,
    port: integer('DB_PORT', 3306, 1, 65535),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionLimit: integer('DB_CONNECTION_LIMIT', 10, 1, 100),
    charset: 'utf8mb4'
  },
  randomToken: () => crypto.randomBytes(32).toString('hex')
  ,hka: {
    environment: String(process.env.HKA_ENVIRONMENT || 'demo').toLowerCase(),
    baseUrl: String(process.env.HKA_ENVIRONMENT || 'demo').toLowerCase() === 'production'
      ? 'https://integracion.thefactoryhka.com.pa/api'
      : 'https://demointegracion.thefactoryhka.com.pa/api',
    username: String(process.env.HKA_USERNAME || ''),
    password: String(process.env.HKA_PASSWORD || ''),
    branchCode: String(process.env.HKA_BRANCH_CODE || '0000'),
    branchType: String(process.env.HKA_BRANCH_TYPE || '1'),
    billingPoint: String(process.env.HKA_BILLING_POINT || '001'),
    timeoutMs: integer('HKA_REQUEST_TIMEOUT_MS', 30000, 1000, 120000)
  }
});
