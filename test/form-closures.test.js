const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const publicDir = path.join(__dirname, '..', 'public');
const html = fs.readFileSync(path.join(publicDir, 'dashboard.html'), 'utf8');
const source = fs.readFileSync(path.join(publicDir, 'js', 'core', 'dialogs.js'), 'utf8');

test('dashboard loads CRM and ERP through bootstrap before the App Shell', () => {
  const bootstrap = fs.readFileSync(path.join(publicDir, 'js', 'bootstrap.js'), 'utf8');
  const bootstrapPosition = html.indexOf('src="js/bootstrap.js"');
  const closurePosition = html.indexOf('src="js/app-shell.js"');

  assert.match(bootstrap, /from '\.\.\/crm-ui\.js'/);
  assert.match(bootstrap, /from '\.\.\/erp-ui\.js'/);
  assert.ok(bootstrapPosition >= 0);
  assert.ok(closurePosition > bootstrapPosition);
  assert.match(html, /type="module" src="js\/app-shell\.js"/);
});

test('close icons work independently of the delegated form handlers', () => {
  assert.match(source, /closest\('\[data-crm-close\]'\)/);
  assert.match(source, /closest\('\[data-erp-close\]'\)/);
  assert.match(source, /event\.stopPropagation\(\)/);
});

test('CRM drawer also closes from its backdrop and with Escape', () => {
  assert.match(source, /target\.id === 'crm-drawer-backdrop'/);
  assert.match(source, /event\.key === 'Escape'/);
  assert.match(source, /classList\.remove\('open'\)/);
  assert.match(source, /setAttribute\('aria-hidden', 'true'\)/);
  assert.match(source, /backdrop\.hidden = true/);
});
