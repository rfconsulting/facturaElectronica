const test = require('node:test');
const assert = require('node:assert/strict');
const { validateClient } = require('../src/validation/client');

test('acepta un contribuyente con los datos fiscales exigidos', () => {
  const result = validateClient({ customerType: '01', contributorType: '2', legalName: 'Empresa Demo, S.A.', ruc: '155612345-2-2025', dv: '10', address: 'Ciudad de Panamá', locationCode: '8-8-1', province: 'Panamá', district: 'Panamá', township: 'San Francisco', countryCode: 'PA' });
  assert.equal(result.errors, undefined);
  assert.equal(result.value.countryCode, 'PA');
});

test('exige identificación y país a un receptor extranjero', () => {
  const invalid = validateClient({ customerType: '04', legalName: 'Foreign Corp', countryCode: 'PA' });
  assert.ok(invalid.errors.length >= 2);
  const valid = validateClient({ customerType: '04', legalName: 'Foreign Corp', countryCode: 'US', foreignIdType: '02', foreignIdNumber: 'US-12345' });
  assert.equal(valid.errors, undefined);
  assert.equal(valid.value.ruc, null);
});

test('no obliga datos fiscales a un consumidor final', () => {
  const result = validateClient({ customerType: '02', legalName: 'Ana Pérez', email: 'ana@example.com' });
  assert.equal(result.errors, undefined);
});
