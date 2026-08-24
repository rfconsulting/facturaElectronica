const test = require('node:test');
const assert = require('node:assert/strict');
const { validateArticle } = require('../src/validation/article');

test('normaliza la disponibilidad del artículo en POS', () => {
  const base = { name: 'Servicio técnico', itemType: 'service', salePrice: 25, currency: 'USD', taxCode: '01' };
  assert.equal(validateArticle({ ...base, availableInPos: 'on' }).value.availableInPos, true);
  assert.equal(validateArticle(base).value.availableInPos, false);
  assert.equal(validateArticle({ ...base, availableInPos: 'false' }).value.availableInPos, false);
});
