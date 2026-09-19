const test = require('node:test');
const assert = require('node:assert/strict');
const { buildEnvelope, parseResponse } = require('../src/services/ebi-client');
const { validateFiscalConfiguration, EBI_DEMO_URL } = require('../src/validation/configuration');

test('acepta EBI con tokens y URL SOAP HTTPS', () => {
  const result = validateFiscalConfiguration({ provider: 'ebi', environment: 'demo', tokenEmpresa: 'empresa', tokenPassword: 'secreto', serviceUrl: EBI_DEMO_URL, branchCode: '0000', branchType: '1', billingPoint: '001', timeoutMs: '30000' });
  assert.equal(result.errors, undefined); assert.equal(result.value.provider, 'ebi');
});
test('EBI exige URL HTTPS y sus dos tokens', () => {
  const result = validateFiscalConfiguration({ provider: 'ebi', environment: 'production', serviceUrl: 'http://pac.example/ws', branchCode: '0000', branchType: '1', billingPoint: '001', timeoutMs: '30000' });
  assert.ok(result.errors.some(error => error.includes('tokenEmpresa'))); assert.ok(result.errors.some(error => error.includes('tokenPassword'))); assert.ok(result.errors.some(error => error.includes('HTTPS')));
});
test('EBI serializa tokens y documento en un envelope SOAP escapado', () => {
  const xml = buildEnvelope('Enviar', { username: 'ACME & Co', password: '<secreto>' }, 'documento', { numeroDocumentoFiscal: '0000000001', listaItems: { item: [{ descripcion: 'A & B' }] } });
  assert.match(xml, /<tem:Enviar>/); assert.match(xml, /ACME &amp; Co/); assert.match(xml, /&lt;secreto&gt;/); assert.match(xml, /<ser:item><ser:descripcion>A &amp; B<\/ser:descripcion><\/ser:item>/);
});
test('EBI no permite activar producción contra el servicio demo', () => {
  const result = validateFiscalConfiguration({ provider: 'ebi', environment: 'production', tokenEmpresa: 'empresa', tokenPassword: 'secreto', serviceUrl: EBI_DEMO_URL, branchCode: '0000', branchType: '1', billingPoint: '001', timeoutMs: '30000' });
  assert.ok(result.errors.some(error => error.includes('URL contractual')));
});
test('EBI normaliza la respuesta de autorización', () => {
  const response = parseResponse('<s:Envelope><s:Body><EnviarResponse><EnviarResult><codigo>200</codigo><mensaje>Autorizada</mensaje><cufe>CUFE-1</cufe><nroProtocoloAutorizacion>P-1</nroProtocoloAutorizacion></EnviarResult></EnviarResponse></s:Body></s:Envelope>');
  assert.deepEqual(response, { codigo: '200', mensaje: 'Autorizada', cufe: 'CUFE-1', numeroProtocoloAutorizacion: 'P-1' });
});
