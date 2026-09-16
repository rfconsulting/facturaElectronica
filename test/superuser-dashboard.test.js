const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('el panel global está reservado al superusuario y limitado al tenant', () => {
  const route = read('src/routes/administration.js');
  assert.match(route, /\/superuser-dashboard',requireSuperuser/);
  assert.match(route, /c\.tenant_id=\?/);
  assert.match(route, /i\.status='authorized'/);
});

test('el dashboard presenta las cuatro métricas globales solicitadas', () => {
  const route = read('src/routes/administration.js');
  const ui = read('public/erp-ui.js');
  for (const metric of ['activeCompanies', 'modulesInUse', 'activeUsers', 'issuedInvoices']) {
    assert.match(route, new RegExp(metric));
    assert.match(ui, new RegExp(metric));
  }
  assert.match(ui, /Panel del superusuario/);
  assert.match(read('public/dashboard.html'), /superuser-dashboard\.css/);
});

test('el uso de módulos se basa en actividad real', () => {
  const route = read('src/routes/administration.js');
  for (const table of ['electronic_invoices', 'crm_opportunities', 'crm_quotes', 'sales_orders', 'accounts_receivable', 'clients', 'articles']) {
    assert.match(route, new RegExp(table));
  }
  assert.match(route, /available_in_pos=TRUE/);
});
