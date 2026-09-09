const test = require('node:test');
const assert = require('node:assert/strict');
const { routeManifest } = require('../src/routes/crm-router');

test('CRM expone una sola implementación por método y ruta', () => {
  const signatures = routeManifest.map((route) => route.signature);
  assert.equal(new Set(signatures).size, signatures.length);
});

test('CRM conserva las capacidades canónicas y los adaptadores aún necesarios', () => {
  const routes = new Map(routeManifest.map((route) => [route.signature, route.source]));
  assert.equal(routes.get('POST /quotes'), 'quotations');
  assert.equal(routes.get('PUT /quotes/:id'), 'quotations');
  assert.equal(routes.get('POST /leads'), 'evolution');
  assert.equal(routes.get('GET /reports/sales'), 'advanced');
  assert.equal(routes.get('GET /dashboard'), 'legacy');
});
