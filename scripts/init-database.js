const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');
const env = require('../src/config/env');
const { migrateMultitenancy } = require('./migrate-multitenancy');

(async () => {
  const connection = await mysql.createConnection({ ...env.db, multipleStatements: true });
  try {
    const schema = await fs.readFile(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
    await connection.query(schema);
    const scope = await migrateMultitenancy(connection);
    const [columns] = await connection.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='users' AND COLUMN_NAME IN ('mfa_enabled','mfa_secret_encrypted')", [env.db.database]);
    const existing = new Set(columns.map((column) => column.COLUMN_NAME));
    if (!existing.has('mfa_enabled')) await connection.query('ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE AFTER last_login_at');
    if (!existing.has('mfa_secret_encrypted')) await connection.query('ALTER TABLE users ADD COLUMN mfa_secret_encrypted TEXT NULL AFTER mfa_enabled');
    const [invoiceColumns] = await connection.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='electronic_invoices' AND COLUMN_NAME='customer_id'", [env.db.database]);
    if (!invoiceColumns.length) await connection.query('ALTER TABLE electronic_invoices ADD COLUMN customer_id BIGINT UNSIGNED NULL AFTER created_by, ADD KEY idx_invoice_customer (customer_id), ADD CONSTRAINT fk_invoice_customer FOREIGN KEY (customer_id) REFERENCES clients(id) ON DELETE SET NULL');
    const [idempotencyColumns] = await connection.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='electronic_invoices' AND COLUMN_NAME IN ('idempotency_key','request_hash')", [env.db.database]);
    const existingIdempotencyColumns = new Set(idempotencyColumns.map((column) => column.COLUMN_NAME));
    if (!existingIdempotencyColumns.has('idempotency_key')) await connection.query('ALTER TABLE electronic_invoices ADD COLUMN idempotency_key VARCHAR(128) COLLATE utf8mb4_bin NULL AFTER created_by');
    if (!existingIdempotencyColumns.has('request_hash')) await connection.query('ALTER TABLE electronic_invoices ADD COLUMN request_hash CHAR(64) COLLATE ascii_bin NULL AFTER idempotency_key');
    const [idempotencyIndexes] = await connection.query("SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME='electronic_invoices' AND INDEX_NAME='uq_invoice_company_idempotency'", [env.db.database]);
    if (!idempotencyIndexes.length) await connection.query('ALTER TABLE electronic_invoices ADD UNIQUE KEY uq_invoice_company_idempotency (company_id,idempotency_key)');
    const [articleColumns] = await connection.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='articles' AND COLUMN_NAME='available_in_pos'", [env.db.database]);
    if (!articleColumns.length) await connection.query('ALTER TABLE articles ADD COLUMN available_in_pos BOOLEAN NOT NULL DEFAULT FALSE AFTER status, ADD KEY idx_articles_pos (available_in_pos,status)');
    console.log(`Base de datos inicializada. Tenant ${scope.tenantId}, empresa ${scope.companyId}.`);
  } finally { await connection.end(); }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
