const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('el esquema separa pipeline comercial y cobranza',()=>{
  const schema=read('database/schema.sql');
  const opportunity=schema.match(/CREATE TABLE IF NOT EXISTS crm_opportunities[\s\S]*?\) ENGINE=InnoDB;/)?.[0]||'';
  const receivable=schema.match(/CREATE TABLE IF NOT EXISTS accounts_receivable[\s\S]*?\) ENGINE=InnoDB;/)?.[0]||'';
  assert.doesNotMatch(opportunity,/payment_pending/);
  assert.match(receivable,/partially_paid/);
  assert.match(receivable,/overdue/);
  assert.doesNotMatch(receivable,/'partial'/);
});

test('la migración convierte estados legados antes de restringir los enums',()=>{
  const migration=read('scripts/init-database.js');
  assert.match(migration,/SET stage='won',probability=100 WHERE stage='payment_pending'/);
  assert.match(migration,/SET status='partially_paid' WHERE status='partial'/);
});

test('el pago liquida la cuenta sin decidir la oportunidad',()=>{
  const route=read('src/routes/crm-evolution.js');
  const payment=route.slice(route.indexOf("router.post('/receivables/:id/payments'"));
  assert.match(payment,/balance===0\?'paid':'partially_paid'/);
  assert.doesNotMatch(payment,/UPDATE crm_opportunities/);
});

test('solo la factura directa autorizada puede cerrar una oportunidad abierta',()=>{
  const repository=read('src/modules/invoicing/infrastructure/invoice.repository.js');
  assert.match(repository,/q\.conversion_policy='direct_invoice'/);
  assert.match(repository,/o\.stage<>'lost'/);
  assert.doesNotMatch(repository,/stage='payment_pending'/);
});
