const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getHkaConfiguration, getHkaStatus } = require('../src/services/configuration');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('el esquema define tenant, empresa y membresías', () => {
  const schema = read('database/schema.sql');
  assert.match(schema, /CREATE TABLE IF NOT EXISTS tenants/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS companies/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS company_memberships/);
  for (const table of ['clients', 'articles', 'electronic_invoices', 'config_operational', 'config_secrets', 'invoice_sequences']) {
    const block = schema.match(new RegExp(`CREATE TABLE IF NOT EXISTS ${table} \\(([\\s\\S]*?)\\) ENGINE=InnoDB`));
    assert.ok(block, `No se encontró la tabla ${table}`);
    assert.match(block[1], /company_id BIGINT UNSIGNED NOT NULL/, `${table} debe pertenecer a una empresa`);
  }
});

test('las consultas operativas incluyen el contexto empresarial', () => {
  const clients = read('src/modules/clients/infrastructure/client.repository.js');
  const articles = read('src/routes/articles.js');
  const invoices = read('src/modules/invoicing/infrastructure/invoice.repository.js');
  assert.doesNotMatch(clients, /FROM clients WHERE status=/);
  assert.doesNotMatch(clients, /FROM clients WHERE id=\? LIMIT/);
  assert.doesNotMatch(articles, /FROM articles WHERE status=/);
  assert.doesNotMatch(articles, /WHERE id=\? LIMIT 1/);
  assert.match(invoices, /FROM electronic_invoices WHERE company_id=\?/);
  assert.match(invoices, /WHERE id=\? AND company_id=\?/);
});

test('la configuración fiscal rechaza consultas sin empresa', async () => {
  await assert.rejects(() => getHkaConfiguration(), /contexto empresarial es obligatorio/);
  await assert.rejects(() => getHkaStatus(), /contexto empresarial es obligatorio/);
});
