const pool = require('../src/config/database');
const env = require('../src/config/env');
const { inspectTenantIntegrity } = require('./preflight-tenant-integrity');

(async () => {
  const checks = [];
  const check = (name, ok, evidence) => checks.push({ name, ok: Boolean(ok), evidence });
  check('production_environment', env.nodeEnv === 'production', `NODE_ENV=${env.nodeEnv}`);
  check('public_https', env.appPublicUrl.startsWith('https://'), env.appPublicUrl);
  check('password_reset_email', Boolean(env.resendApiKey && env.passwordResetEmailFrom), env.resendApiKey && env.passwordResetEmailFrom ? 'Resend configurado' : 'Faltan RESEND_API_KEY o PASSWORD_RESET_EMAIL_FROM');
  await pool.query('SELECT 1');
  check('database_connection', true, env.db.database);

  const [[admins]] = await pool.query("SELECT COUNT(*) AS total FROM company_memberships WHERE role='administrator' AND status='active'");
  check('active_administrator', Number(admins.total) > 0, `${admins.total} membresías administrativas activas`);

  const [idempotencyIndex] = await pool.query("SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME='electronic_invoices' AND INDEX_NAME='uq_invoice_company_idempotency'", [env.db.database]);
  check('fiscal_idempotency_index', idempotencyIndex.length > 0, 'uq_invoice_company_idempotency');

  const tenantViolations = await inspectTenantIntegrity(pool);
  check('tenant_reference_integrity', tenantViolations.length === 0, tenantViolations.length ? tenantViolations : '31 relaciones sin referencias huérfanas o cruzadas');

  const [companies] = await pool.query(`SELECT c.id,c.legal_name,
    SUM(cs.secret_key='hka.username') AS has_username,SUM(cs.secret_key='hka.password') AS has_password,
    MAX(CASE WHEN co.config_key='hka.environment' THEN co.config_value END) AS hka_environment
    FROM companies c LEFT JOIN config_secrets cs ON cs.company_id=c.id
    LEFT JOIN config_operational co ON co.company_id=c.id AND co.config_key='hka.environment'
    WHERE c.status='active' GROUP BY c.id,c.legal_name`);
  const unconfigured = companies.filter((company) => !Number(company.has_username) || !Number(company.has_password) || company.hka_environment !== 'production');
  check('active_companies_hka_production', companies.length > 0 && unconfigured.length === 0, unconfigured.length ? unconfigured.map((company) => company.legal_name) : `${companies.length} empresas configuradas`);

  const [[uncertain]] = await pool.query("SELECT COUNT(*) AS total FROM electronic_invoices WHERE status='uncertain'");
  check('no_uncertain_invoices', Number(uncertain.total) === 0, `${uncertain.total} facturas inciertas`);

  const [[outbox]] = await pool.query("SELECT SUM(status='dead_letter') AS dead_letters,SUM(status IN ('pending','processing') AND created_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 15 MINUTE)) AS stale FROM integration_outbox");
  check('outbox_no_dead_letters', Number(outbox.dead_letters||0) === 0, `${outbox.dead_letters||0} eventos en dead letter`);
  check('outbox_no_stale_events', Number(outbox.stale||0) === 0, `${outbox.stale||0} eventos pendientes por más de 15 minutos`);

  const [[imports]] = await pool.query("SELECT SUM(status='previewed' AND expires_at<UTC_TIMESTAMP()) AS stale,SUM(status IN ('expired','failed') AND updated_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL 30 DAY)) AS purgeable FROM import_jobs");
  check('import_jobs_no_stale_previews', Number(imports.stale||0) === 0, `${imports.stale||0} previews expirados sin marcar`);
  check('import_jobs_retention', Number(imports.purgeable||0) === 0, `${imports.purgeable||0} jobs fuera de retención`);

  console.log(JSON.stringify({ status: checks.every((item) => item.ok) ? 'ready' : 'blocked', checkedAt: new Date().toISOString(), checks }, null, 2));
  if (checks.some((item) => !item.ok)) process.exitCode = 1;
})().catch((error) => { console.error(JSON.stringify({ status: 'error', error: error.message })); process.exitCode = 1; }).finally(() => pool.end());
