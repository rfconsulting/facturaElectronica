const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('el dashboard declara App Shell, manifiesto y estado de conexión', () => {
  const html = read('public/dashboard.html');
  assert.match(html, /rel="manifest" href="manifest\.webmanifest"/);
  assert.match(html, /id="connection-status"/);
  assert.match(html, /type="module" src="js\/app-shell\.js"/);
});

test('el App Shell usa módulos ES y registra el Service Worker', () => {
  const shell = read('public/js/app-shell.js');
  assert.match(shell, /import \{ installConnectivityStatus \}/);
  assert.match(shell, /import \{ installFormClosures \}/);
  assert.match(shell, /navigator\.serviceWorker\.register\('\/sw\.js'/);
});

test('el Service Worker nunca cachea navegación, APIs ni endpoints internos', () => {
  const worker = read('public/sw.js');
  assert.match(worker, /request\.mode === 'navigate'/);
  assert.match(worker, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(worker, /url\.pathname\.startsWith\('\/internal\/'\)/);
  assert.doesNotMatch(worker, /dashboard\.html/);
  assert.doesNotMatch(worker, /login\.html/);
});

test('el núcleo ofrece contratos separados de HTTP y navegación', () => {
  assert.match(read('public/js/core/http.js'), /export function createApiClient/);
  assert.match(read('public/js/core/router.js'), /export class HashRouter/);
});

test('bootstrap delega administración y usuarios al módulo correspondiente', () => {
  const html = read('public/dashboard.html');
  const bootstrap = read('public/js/bootstrap.js');
  const administration = read('public/js/modules/administration.js');
  assert.match(bootstrap, /from '\.\/modules\/administration\.js'/);
  assert.match(administration, /from '\.\.\/core\/runtime\.js'/);
  assert.doesNotMatch(html, /src="js\/modules\/administration\.js"/);
  for (const name of ['loadAdministration', 'setupAdministration', 'runUserAdminAction', 'loadUsers', 'setupUsers']) {
    assert.match(administration, new RegExp(`function ${name}`));
    assert.doesNotMatch(bootstrap, new RegExp(`function ${name}`));
  }
});

test('bootstrap importa clientes y artículos como módulos ES', () => {
  const html = read('public/dashboard.html');
  const bootstrap = read('public/js/bootstrap.js');
  const clients = read('public/js/modules/clients.js');
  const articles = read('public/js/modules/articles.js');
  assert.match(bootstrap, /from '\.\/modules\/clients\.js'/);
  assert.match(bootstrap, /from '\.\/modules\/articles\.js'/);
  assert.doesNotMatch(html, /src="js\/modules\/(clients|articles)\.js"/);
  assert.match(clients, /from '\.\.\/core\/runtime\.js'/);
  assert.match(articles, /from '\.\.\/core\/runtime\.js'/);
  for (const name of ['loadClients', 'setupClients', 'setupLocationAutocomplete', 'setupZohoImport']) {
    assert.match(clients, new RegExp(`function ${name}`));
    assert.doesNotMatch(bootstrap, new RegExp(`function ${name}`));
  }
  for (const name of ['loadArticles', 'setupArticles', 'setupQuickArticle', 'loadInvoiceArticleCatalog']) {
    assert.match(articles, new RegExp(`function ${name}`));
    assert.doesNotMatch(bootstrap, new RegExp(`function ${name}`));
  }
});

test('bootstrap importa facturación y POS como módulos ES', () => {
  const html = read('public/dashboard.html');
  const bootstrap = read('public/js/bootstrap.js');
  const invoicing = read('public/js/modules/invoicing.js');
  const pos = read('public/js/modules/pos.js');
  assert.match(bootstrap, /from '\.\/modules\/invoicing\.js'/);
  assert.match(bootstrap, /from '\.\/modules\/pos\.js'/);
  assert.doesNotMatch(html, /src="js\/modules\/(invoicing|pos)\.js"/);
  assert.match(invoicing, /from '\.\/articles\.js'/);
  assert.match(pos, /from '\.\/invoicing\.js'/);
  for (const name of ['addItem', 'taxBreakdown', 'calculate', 'loadInvoices']) {
    assert.match(invoicing, new RegExp(`function ${name}`));
    assert.doesNotMatch(bootstrap, new RegExp(`function ${name}`));
  }
  for (const name of ['loadPosProducts', 'renderPosCart', 'setupPos', 'preservePosCartLines']) {
    assert.match(pos, new RegExp(`function ${name}`));
    assert.doesNotMatch(bootstrap, new RegExp(`function ${name}`));
  }
});

test('runtime, configuración fiscal y bootstrap tienen responsabilidades separadas', () => {
  const html = read('public/dashboard.html');
  const runtime = read('public/js/core/runtime.js');
  const configuration = read('public/js/modules/fiscal-configuration.js');
  const correlatives = read('public/correlatives.js');
  const bootstrap = read('public/js/bootstrap.js');
  assert.match(runtime, /export const request = createApiClient/);
  assert.match(runtime, /let csrfToken/);
  assert.match(configuration, /function mountConfiguration/);
  assert.match(configuration, /function secureConfigAction/);
  assert.match(bootstrap, /async function loadSession/);
  assert.match(bootstrap, /from '\.\/core\/runtime\.js'/);
  assert.match(bootstrap, /from '\.\/modules\/fiscal-configuration\.js'/);
  assert.match(bootstrap, /import '\.\.\/correlatives\.js'/);
  assert.match(configuration, /from '\.\.\/core\/runtime\.js'/);
  assert.match(correlatives, /from '\.\/js\/modules\/fiscal-configuration\.js'/);
  assert.doesNotMatch(runtime, /window\.(request|escapeHtml)|Object\.defineProperty\(window/);
  assert.doesNotMatch(html, /src="(?:js\/modules\/fiscal-configuration|correlatives)\.js"/);
  assert.match(html, /type="module" src="js\/bootstrap\.js"/);
  assert.doesNotMatch(html, /src="dashboard\.js"/);
});

test('bootstrap importa CRM y ERP y registra sus cargadores de sección', () => {
  const html = read('public/dashboard.html');
  const bootstrap = read('public/js/bootstrap.js');
  const crm = read('public/crm-ui.js');
  const erp = read('public/erp-ui.js');
  assert.match(bootstrap, /from '\.\.\/crm-ui\.js'/);
  assert.match(bootstrap, /from '\.\.\/erp-ui\.js'/);
  assert.match(bootstrap, /registerSectionLoader\('crm', loadCrm\)/);
  assert.match(crm, /export async function loadCrm/);
  assert.match(erp, /export async function loadErpSection/);
  assert.doesNotMatch(html, /src="(crm|erp)-ui\.js"/);
  assert.doesNotMatch(read('public/js/modules/clients.js'), /Object\.assign\(window/);
  assert.doesNotMatch(read('public/js/modules/articles.js'), /Object\.assign\(window|window\.(addItem|calculate)/);
  assert.doesNotMatch(read('public/js/modules/invoicing.js'), /Object\.assign\(window|invoiceCommercialSource',/);
});
