const test = require('node:test');
const assert = require('node:assert/strict');
const { parseFiscal, mapRows, mapLegacyRows, parseCsv } = require('../src/services/zoho-import');

test('clasifica tipo de cliente, RUC y DV de CF.FiscalDGI', () => {
  assert.deepEqual(parseFiscal('J.2641953-1-839591.74'), { fiscalType:'J',customerType:'01',contributorType:'2',ruc:'2641953-1-839591',dv:'74' });
  assert.deepEqual(parseFiscal('N.13-NT-2-729809.49'), { fiscalType:'N',customerType:'01',contributorType:'1',ruc:'13-NT-2-729809',dv:'49' });
  assert.deepEqual(parseFiscal('F.00000000000.00'), { fiscalType:'F',customerType:'02',contributorType:null,ruc:null,dv:null });
  assert.deepEqual(parseFiscal('G.155-1-1.10'), { fiscalType:'G',customerType:'03',contributorType:'2',ruc:'155-1-1',dv:'10' });
  assert.deepEqual(parseFiscal('E.PASSPORT-123.09'), { fiscalType:'E',customerType:'04',contributorType:null,ruc:null,dv:null,foreignIdNumber:'PASSPORT-123' });
  assert.deepEqual(parseFiscal('2356'), {});
});

test('reconoce el CSV legado separado por punto y coma sin encabezados',()=>{
  const rows=parseCsv(Buffer.from('1;2;1;VIA RICARDO J ALFARO;cliente@example.com;;;217-2233;;PA;2;42928-69-0289713;22;SOCIEDAD DE ALIMENTOS;\n'));
  const [result]=mapLegacyRows(rows);
  assert.equal(result.client.ruc,'42928-69-0289713');
  assert.equal(result.client.dv,'22');
  assert.equal(result.client.legalName,'SOCIEDAD DE ALIMENTOS');
  assert.equal(result.client.customerType,'02');
});

test('mapea las columnas relevantes de una exportación Zoho', () => {
  const rows = [['Display Name','Company Name','Phone','Status','Customer Sub Type','Billing Address','Billing City','Billing State','Billing Country','EmailID','Customer ID','CF.FiscalDGI'], ['Cliente Demo','Cliente Demo, S.A.','6000-0000','Active','business','Calle 1','Panamá','Panamá','Panamá','demo@example.com','123','J.155-1-1.10']];
  const [result] = mapRows(rows);
  assert.equal(result.client.code, 'ZOHO-123');
  assert.equal(result.client.ruc, '155-1-1');
  assert.equal(result.client.email, 'demo@example.com');
  assert.equal(result.client.customerType, '01');
  assert.equal(result.client.address, 'Calle 1');
  assert.equal(result.client.locationCode, '8-8-7');
  assert.equal(result.client.province, 'Panamá');
  assert.equal(result.client.district, 'Panamá');
  assert.equal(result.client.township, 'BELLA VISTA');
  assert.equal(result.warnings.length, 0);
});

test('completa la dirección local ausente con Bella Vista', () => {
  const rows = [['Display Name','Status','Billing Country','CF.FiscalDGI'], ['Cliente sin dirección','Active','Panamá','N.13-NT-2-729809.49']];
  const result = mapRows(rows)[0].client;
  assert.equal(result.address, 'Bella Vista, Panama');
  assert.equal(result.locationCode, '8-8-7');
  assert.equal(result.province, 'PANAMA');
  assert.equal(result.district, 'PANAMA');
  assert.equal(result.township, 'BELLA VISTA');
});
