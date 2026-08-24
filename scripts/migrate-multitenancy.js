const env = require('../src/config/env');

async function columnExists(connection, table, column) {
  const [rows] = await connection.query('SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?', [env.db.database, table, column]);
  return rows.length > 0;
}

async function indexExists(connection, table, index) {
  const [rows] = await connection.query('SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND INDEX_NAME=?', [env.db.database, table, index]);
  return rows.length > 0;
}

async function constraintExists(connection, table, constraint) {
  const [rows] = await connection.query('SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=? AND TABLE_NAME=? AND CONSTRAINT_NAME=?', [env.db.database, table, constraint]);
  return rows.length > 0;
}

async function addCompanyColumn(connection, table, companyId, nullable = false) {
  if (!await columnExists(connection, table, 'company_id')) await connection.query(`ALTER TABLE ${table} ADD COLUMN company_id BIGINT UNSIGNED NULL AFTER id`);
  await connection.query(`UPDATE ${table} SET company_id=? WHERE company_id IS NULL`, [companyId]);
  if (!nullable) await connection.query(`ALTER TABLE ${table} MODIFY company_id BIGINT UNSIGNED NOT NULL`);
}

async function addIndex(connection, table, name, columns, unique = false) {
  if (!await indexExists(connection, table, name)) await connection.query(`ALTER TABLE ${table} ADD ${unique ? 'UNIQUE ' : ''}KEY ${name} (${columns})`);
}

async function dropIndex(connection, table, name) {
  if (await indexExists(connection, table, name)) await connection.query(`ALTER TABLE ${table} DROP INDEX ${name}`);
}

async function addCompanyForeignKey(connection, table, name, onDelete = 'RESTRICT') {
  if (!await constraintExists(connection, table, name)) await connection.query(`ALTER TABLE ${table} ADD CONSTRAINT ${name} FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE ${onDelete}`);
}

async function migrateMultitenancy(connection) {
  await connection.query("INSERT INTO tenants (name,slug,status) VALUES ('Empresa inicial','empresa-inicial','active') ON DUPLICATE KEY UPDATE name=name");
  const [[tenant]] = await connection.query("SELECT id FROM tenants WHERE slug='empresa-inicial' LIMIT 1");
  await connection.query("INSERT INTO companies (tenant_id,legal_name,trade_name,status) SELECT ?,'Empresa inicial','Empresa inicial','active' WHERE NOT EXISTS (SELECT 1 FROM companies WHERE tenant_id=? LIMIT 1)", [tenant.id, tenant.id]);
  const [[company]] = await connection.query('SELECT id FROM companies WHERE tenant_id=? ORDER BY id LIMIT 1', [tenant.id]);

  await connection.query('INSERT IGNORE INTO company_memberships (company_id,user_id,role,status) SELECT ?,id,role,status FROM users', [company.id]);

  const tables = ['clients','client_custom_field_definitions','articles','article_custom_field_definitions','electronic_invoices'];
  for (const table of tables) await addCompanyColumn(connection, table, company.id);

  if (!await columnExists(connection, 'audit_log', 'company_id')) await connection.query('ALTER TABLE audit_log ADD COLUMN company_id BIGINT UNSIGNED NULL AFTER actor_user_id');
  await connection.query('UPDATE audit_log SET company_id=? WHERE company_id IS NULL', [company.id]);
  await addIndex(connection, 'audit_log', 'idx_audit_company_created', 'company_id,created_at');
  await addCompanyForeignKey(connection, 'audit_log', 'fk_audit_company');

  if (!await columnExists(connection, 'invoice_sequences', 'company_id')) await connection.query('ALTER TABLE invoice_sequences ADD COLUMN company_id BIGINT UNSIGNED NULL FIRST');
  await connection.query('UPDATE invoice_sequences SET company_id=? WHERE company_id IS NULL', [company.id]);
  await connection.query('ALTER TABLE invoice_sequences MODIFY company_id BIGINT UNSIGNED NOT NULL');
  const [sequencePk] = await connection.query("SELECT GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) columns_list FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME='invoice_sequences' AND INDEX_NAME='PRIMARY'", [env.db.database]);
  if (sequencePk[0]?.columns_list !== 'company_id,branch_code,billing_point,document_type') await connection.query('ALTER TABLE invoice_sequences DROP PRIMARY KEY, ADD PRIMARY KEY (company_id,branch_code,billing_point,document_type)');
  await addCompanyForeignKey(connection, 'invoice_sequences', 'fk_invoice_sequence_company');

  for (const table of ['config_operational','config_secrets']) {
    if (!await columnExists(connection, table, 'company_id')) await connection.query(`ALTER TABLE ${table} ADD COLUMN company_id BIGINT UNSIGNED NULL FIRST`);
    await connection.query(`UPDATE ${table} SET company_id=? WHERE company_id IS NULL`, [company.id]);
    await connection.query(`ALTER TABLE ${table} MODIFY company_id BIGINT UNSIGNED NOT NULL`);
  }
  const configPrimaryKeys = [['config_operational','config_key'],['config_secrets','secret_key']];
  for (const [table, key] of configPrimaryKeys) {
    const [pk] = await connection.query("SELECT GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) columns_list FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND INDEX_NAME='PRIMARY'", [env.db.database, table]);
    if (pk[0]?.columns_list !== `company_id,${key}`) await connection.query(`ALTER TABLE ${table} DROP PRIMARY KEY, ADD PRIMARY KEY (company_id,${key})`);
  }

  await dropIndex(connection, 'clients', 'uq_clients_code');
  await addIndex(connection, 'clients', 'uq_clients_company_code', 'company_id,code', true);
  await addIndex(connection, 'clients', 'idx_clients_company_name', 'company_id,legal_name');
  await dropIndex(connection, 'client_custom_field_definitions', 'uq_client_field_key');
  await addIndex(connection, 'client_custom_field_definitions', 'uq_client_field_company_key', 'company_id,field_key', true);
  await dropIndex(connection, 'articles', 'uq_articles_zoho');
  await dropIndex(connection, 'articles', 'uq_articles_sku');
  await addIndex(connection, 'articles', 'uq_articles_company_zoho', 'company_id,zoho_item_id', true);
  await addIndex(connection, 'articles', 'uq_articles_company_sku', 'company_id,sku', true);
  await addIndex(connection, 'articles', 'idx_articles_company_name', 'company_id,name');
  await dropIndex(connection, 'article_custom_field_definitions', 'uq_article_field_key');
  await addIndex(connection, 'article_custom_field_definitions', 'uq_article_field_company_key', 'company_id,field_key', true);
  await dropIndex(connection, 'electronic_invoices', 'uq_invoice_fiscal_number');
  await addIndex(connection, 'electronic_invoices', 'uq_invoice_company_fiscal_number', 'company_id,branch_code,billing_point,document_type,fiscal_number', true);
  await addIndex(connection, 'electronic_invoices', 'idx_invoice_company_status_created', 'company_id,status,created_at');

  const companyForeignKeys = [
    ['clients','fk_clients_company','RESTRICT'],['client_custom_field_definitions','fk_client_field_company','CASCADE'],
    ['articles','fk_articles_company','RESTRICT'],['article_custom_field_definitions','fk_article_field_company','CASCADE'],
    ['electronic_invoices','fk_invoice_company','RESTRICT'],['config_operational','fk_config_operational_company','CASCADE'],
    ['config_secrets','fk_config_secret_company','CASCADE']
  ];
  for (const [table, name, onDelete] of companyForeignKeys) await addCompanyForeignKey(connection, table, name, onDelete);
  if (!await columnExists(connection, 'electronic_invoices', 'customer_id')) await connection.query('ALTER TABLE electronic_invoices ADD COLUMN customer_id BIGINT UNSIGNED NULL AFTER created_by, ADD KEY idx_invoice_customer (customer_id)');
  if (!await constraintExists(connection, 'electronic_invoices', 'fk_invoice_customer')) await connection.query('ALTER TABLE electronic_invoices ADD CONSTRAINT fk_invoice_customer FOREIGN KEY (customer_id) REFERENCES clients(id) ON DELETE SET NULL');
  return { tenantId: tenant.id, companyId: company.id };
}

module.exports = { migrateMultitenancy };
