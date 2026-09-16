const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('el catálogo oficial de ubicaciones alimenta el autocompletado de clientes', () => {
  const locations = JSON.parse(fs.readFileSync(path.join(root, 'public/data/panama-locations.json'), 'utf8'));
  const clients = fs.readFileSync(path.join(root, 'public/js/modules/clients.js'), 'utf8');
  const html = fs.readFileSync(path.join(root, 'public/dashboard.html'), 'utf8');

  assert.equal(locations.length, 628);
  assert.ok(locations.every((location) => location.code && location.province && location.district && location.township));
  assert.ok(locations.some((location) => location.code === '8-8-1' && location.province === 'PANAMA' && location.district === 'PANAMA'));
  assert.match(html, /id="client-location-suggestions"/);
  assert.match(clients, /form\.elements\.locationCode\.value=location\.code/);
  assert.match(clients, /form\.elements\.township\.value=location\.township/);
});
