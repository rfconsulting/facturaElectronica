const pool = require('../config/database');
const env = require('../config/env');
const { encryptSecret, decryptSecret } = require('./secret-crypto');
const { EBI_DEMO_URL } = require('../validation/configuration');

const definitions = Object.freeze({
  hka: { operational: { environment: 'hka.environment', branchCode: 'hka.branch_code', branchType: 'hka.branch_type', billingPoint: 'hka.billing_point', timeoutMs: 'hka.timeout_ms' }, secrets: { username: 'hka.username', password: 'hka.password' } },
  ebi: { operational: { environment: 'ebi.environment', serviceUrl: 'ebi.service_url', branchCode: 'ebi.branch_code', branchType: 'ebi.branch_type', billingPoint: 'ebi.billing_point', timeoutMs: 'ebi.timeout_ms' }, secrets: { username: 'ebi.token_empresa', password: 'ebi.token_password' } }
});

function assertCompany(companyId) { if (!Number.isSafeInteger(Number(companyId))) throw new Error('El contexto empresarial es obligatorio para consultar la configuración fiscal.'); }
function baseUrl(environment) { return environment === 'production' ? 'https://integracion.thefactoryhka.com.pa/api' : 'https://demointegracion.thefactoryhka.com.pa/api'; }
function defaults(provider) {
  if (provider === 'ebi') return { provider, environment: 'demo', serviceUrl: EBI_DEMO_URL, branchCode: '0000', branchType: '1', billingPoint: '001', timeoutMs: 30000 };
  return { provider: 'hka', ...env.hka, environment: env.hka.environment || 'demo', branchCode: env.hka.branchCode || '0000', branchType: env.hka.branchType || '1', billingPoint: env.hka.billingPoint || '001', timeoutMs: Number(env.hka.timeoutMs || 30000) };
}

async function selectedProvider(companyId) {
  const [rows] = await pool.query("SELECT config_value FROM config_operational WHERE company_id=? AND config_key='fiscal.provider' LIMIT 1", [companyId]);
  return ['hka', 'ebi'].includes(rows[0]?.config_value) ? rows[0].config_value : 'hka';
}

async function readProvider(companyId, provider, includeSecrets) {
  const definition = definitions[provider];
  const [operationalRows] = await pool.query('SELECT config_key,config_value,updated_at FROM config_operational WHERE company_id=? AND config_key LIKE ?', [companyId, `${provider}.%`]);
  const secretNames = Object.values(definition.secrets);
  const [secretRows] = await pool.query('SELECT secret_key,encrypted_value,version,updated_at FROM config_secrets WHERE company_id=? AND secret_key IN (?,?)', [companyId, ...secretNames]);
  const operational = Object.fromEntries(operationalRows.map(row => [row.config_key, row.config_value]));
  const fallback = defaults(provider);
  const value = { provider, configured: secretRows.length === secretNames.length, source: secretRows.length === secretNames.length ? 'database' : 'company' };
  for (const [name, key] of Object.entries(definition.operational)) value[name] = name === 'timeoutMs' ? Number(operational[key] || fallback[name]) : (operational[key] || fallback[name]);
  value.updatedAt = [...operationalRows, ...secretRows].map(row => row.updated_at).filter(Boolean).sort().at(-1) || null;
  if (provider === 'hka') value.baseUrl = baseUrl(value.environment);
  if (includeSecrets && value.configured) for (const [name, key] of Object.entries(definition.secrets)) { const row = secretRows.find(item => item.secret_key === key); value[name] = decryptSecret(row.encrypted_value, `${key}:v${row.version}`); }
  if (includeSecrets && !value.configured && provider === 'hka' && fallback.username && fallback.password) return { ...value, username: fallback.username, password: fallback.password, configured: true, source: 'environment' };
  return value;
}

async function getFiscalConfiguration(companyId, providerOverride) { assertCompany(companyId); return readProvider(companyId, providerOverride || await selectedProvider(companyId), true); }
async function getFiscalStatus(companyId) { assertCompany(companyId); return readProvider(companyId, await selectedProvider(companyId), false); }

async function saveFiscalConfiguration(companyId, userId, value) {
  assertCompany(companyId);
  const definition = definitions[value.provider];
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const operational = [['fiscal.provider', value.provider, 'string'], ...Object.entries(definition.operational).map(([name, key]) => [key, String(value[name]), name === 'timeoutMs' ? 'integer' : 'string'])];
    for (const [key, configValue, type] of operational) await connection.execute('INSERT INTO config_operational (company_id,config_key,config_value,value_type,updated_by) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE config_value=VALUES(config_value),value_type=VALUES(value_type),updated_by=VALUES(updated_by)', [companyId, key, configValue, type, userId]);
    for (const [name, key] of Object.entries(definition.secrets)) {
      const [rows] = await connection.execute('SELECT version FROM config_secrets WHERE company_id=? AND secret_key=? FOR UPDATE', [companyId, key]);
      const version = Number(rows[0]?.version || 0) + 1;
      await connection.execute('INSERT INTO config_secrets (company_id,secret_key,encrypted_value,version,updated_by) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE encrypted_value=VALUES(encrypted_value),version=VALUES(version),updated_by=VALUES(updated_by)', [companyId, key, encryptSecret(value[name], `${key}:v${version}`), version, userId]);
    }
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

const getHkaConfiguration = companyId => getFiscalConfiguration(companyId, 'hka');
async function getHkaStatus(companyId) { assertCompany(companyId); return readProvider(companyId, 'hka', false); }
const saveHkaConfiguration = (companyId, userId, value) => saveFiscalConfiguration(companyId, userId, { ...value, provider: 'hka' });
module.exports = { getFiscalConfiguration, saveFiscalConfiguration, getFiscalStatus, getHkaConfiguration, saveHkaConfiguration, getHkaStatus, baseUrl };
