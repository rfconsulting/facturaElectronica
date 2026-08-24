const pool = require('../config/database');
const env = require('../config/env');
const { encryptSecret, decryptSecret } = require('./secret-crypto');

const operationalKeys = Object.freeze({
  environment: 'hka.environment', branchCode: 'hka.branch_code', branchType: 'hka.branch_type',
  billingPoint: 'hka.billing_point', timeoutMs: 'hka.timeout_ms'
});
const secretKeys = Object.freeze({ username: 'hka.username', password: 'hka.password' });

function fallbackHka() { return { ...env.hka, source: 'environment', configured: Boolean(env.hka.username && env.hka.password) }; }
function baseUrl(environment) { return environment === 'production' ? 'https://integracion.thefactoryhka.com.pa/api' : 'https://demointegracion.thefactoryhka.com.pa/api'; }

async function getHkaConfiguration(companyId) {
  if (!Number.isSafeInteger(Number(companyId))) throw new Error('El contexto empresarial es obligatorio para consultar HKA.');
  const [operationalRows] = await pool.query("SELECT config_key,config_value,updated_at FROM config_operational WHERE company_id=? AND config_key LIKE 'hka.%'", [companyId]);
  const [secretRows] = await pool.query("SELECT secret_key,encrypted_value,version,updated_at FROM config_secrets WHERE company_id=? AND secret_key IN ('hka.username','hka.password')", [companyId]);
  const operational = Object.fromEntries(operationalRows.map((row) => [row.config_key, row.config_value]));
  const secrets = Object.fromEntries(secretRows.map((row) => [row.secret_key, decryptSecret(row.encrypted_value, `${row.secret_key}:v${row.version}`)]));
  if (!secrets[secretKeys.username] || !secrets[secretKeys.password]) return { ...fallbackHka(), configured: false, source: 'company' };
  const environment = operational[operationalKeys.environment] || 'demo';
  return {
    environment, baseUrl: baseUrl(environment), username: secrets[secretKeys.username], password: secrets[secretKeys.password],
    branchCode: operational[operationalKeys.branchCode] || '0000', branchType: operational[operationalKeys.branchType] || '1',
    billingPoint: operational[operationalKeys.billingPoint] || '001', timeoutMs: Number(operational[operationalKeys.timeoutMs] || 30000),
    source: 'database', configured: true,
    updatedAt: [...operationalRows, ...secretRows].map((row) => row.updated_at).filter(Boolean).sort().at(-1) || null
  };
}

async function saveHkaConfiguration(companyId, userId, value) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const operational = [
      [operationalKeys.environment, value.environment, 'string'], [operationalKeys.branchCode, value.branchCode, 'string'],
      [operationalKeys.branchType, value.branchType, 'string'], [operationalKeys.billingPoint, value.billingPoint, 'string'],
      [operationalKeys.timeoutMs, String(value.timeoutMs), 'integer']
    ];
    for (const [key, configValue, type] of operational) {
      await connection.execute('INSERT INTO config_operational (company_id,config_key,config_value,value_type,updated_by) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE config_value=VALUES(config_value),value_type=VALUES(value_type),updated_by=VALUES(updated_by)', [companyId, key, configValue, type, userId]);
    }
    for (const [key, secret] of [[secretKeys.username, value.username], [secretKeys.password, value.password]]) {
      const [rows] = await connection.execute('SELECT version FROM config_secrets WHERE company_id=? AND secret_key=? FOR UPDATE', [companyId, key]);
      const version = Number(rows[0]?.version || 0) + 1;
      const encrypted = encryptSecret(secret, `${key}:v${version}`);
      await connection.execute('INSERT INTO config_secrets (company_id,secret_key,encrypted_value,version,updated_by) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE encrypted_value=VALUES(encrypted_value),version=VALUES(version),updated_by=VALUES(updated_by)', [companyId, key, encrypted, version, userId]);
    }
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

async function getHkaStatus(companyId) {
  if (!Number.isSafeInteger(Number(companyId))) throw new Error('El contexto empresarial es obligatorio para consultar HKA.');
  const [operationalRows] = await pool.query("SELECT config_key,config_value,updated_at FROM config_operational WHERE company_id=? AND config_key LIKE 'hka.%'", [companyId]);
  const [secretRows] = await pool.query("SELECT secret_key,updated_at FROM config_secrets WHERE company_id=? AND secret_key IN ('hka.username','hka.password')", [companyId]);
  if (secretRows.length < 2) { const fallback = fallbackHka(); return { configured: false, source: 'company', environment: fallback.environment, branchCode: fallback.branchCode, branchType: fallback.branchType, billingPoint: fallback.billingPoint, timeoutMs: fallback.timeoutMs, updatedAt: null }; }
  const operational = Object.fromEntries(operationalRows.map((row) => [row.config_key, row.config_value]));
  const updatedAt = [...operationalRows, ...secretRows].map((row) => row.updated_at).filter(Boolean).sort().at(-1) || null;
  return { configured: true, source: 'database', environment: operational[operationalKeys.environment] || 'demo', branchCode: operational[operationalKeys.branchCode] || '0000', branchType: operational[operationalKeys.branchType] || '1', billingPoint: operational[operationalKeys.billingPoint] || '001', timeoutMs: Number(operational[operationalKeys.timeoutMs] || 30000), updatedAt };
}

module.exports = { getHkaConfiguration, saveHkaConfiguration, getHkaStatus, baseUrl };
