const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('el dashboard ERP usa roles semánticos en ambos temas', () => {
  const html = read('public/dashboard.html');
  const css = read('public/erp-design-system.css');
  assert.match(html, /erp-design-system\.css/);
  for (const token of ['--bg:', '--surface:', '--surface-2:', '--text:', '--text-muted:', '--border:', '--accent:']) assert.ok(css.includes(token));
  assert.match(css, /html\[data-theme="dark"\]/);
  assert.match(css, /\.app-content/);
});

test('el resumen ERP ofrece detalle, flujo accesible y primer paso', () => {
  const ui = read('public/erp-ui.js');
  assert.match(ui, /erp-kpi-link/);
  assert.match(ui, /Ver detalle/);
  assert.match(ui, /erp-onboarding/);
  assert.match(ui, /Crear primera cotización/);
  assert.match(ui, /aria-label="Paso/);
});

test('el encabezado combina conectividad y seguridad en un indicador', () => {
  const html = read('public/dashboard.html');
  const connectivity = read('public/js/core/connectivity.js');
  assert.doesNotMatch(html, /class="environment-pill"/);
  assert.match(connectivity, /En línea · Sesión segura/);
  assert.match(connectivity, /Sin conexión · Sesión segura/);
});

test('los módulos principales comparten superficies y estados semánticos', () => {
  const css = read('public/erp-design-system.css');
  for (const selector of ['.invoice-form', '.configuration-panel', '.administration-card', '.client-directory', '.pos-catalog', '.crm-card', '.crm-drawer', '.import-dialog', '.location-suggestions', '.superuser-kpis article']) {
    assert.ok(css.includes(selector), `falta cobertura para ${selector}`);
  }
  for (const token of ['--success-surface:', '--warning-surface:', '--danger-surface:']) assert.ok(css.includes(token));
  assert.match(css, /Compatibility aliases/);
});
