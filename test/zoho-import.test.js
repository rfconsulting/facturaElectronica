const test = require('node:test');
const assert = require('node:assert/strict');
const { parseFiscal, mapRows } = require('../src/services/zoho-import');

test('separa tipo de persona, RUC y DV de CF.FiscalDGI', () => {
  assert.deepEqual(parseFiscal('J.2641953-1-839591.74'), { contributorType: '2', ruc: '2641953-1-839591', dv: '74' });
  assert.deepEqual(parseFiscal('N.13-NT-2-729809.49'), { contributorType: '1', ruc: '13-NT-2-729809', dv: '49' });
});

test('mapea las columnas relevantes de una exportación Zoho', () => {
  const rows = [['Display Name','Company Name','Phone','Status','Customer Sub Type','Billing Address','Billing City','Billing State','Billing Country','EmailID','Customer ID','CF.FiscalDGI'], ['Cliente Demo','Cliente Demo, S.A.','6000-0000','Active','business','Calle 1','Panamá','Panamá','Panamá','demo@example.com','123','J.155-1-1.10']];
  const [result] = mapRows(rows);
  assert.equal(result.client.code, 'ZOHO-123');
  assert.equal(result.client.ruc, '155-1-1');
  assert.equal(result.client.email, 'demo@example.com');
  assert.equal(result.client.customerType, '02');
  assert.equal(result.warnings.length, 1);
});
