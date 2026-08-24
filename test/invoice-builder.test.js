const test = require('node:test');
const assert = require('node:assert/strict');

process.env.SESSION_SECRET ||= 'test-session-secret-with-at-least-sixty-four-characters-1234567890';
process.env.DB_HOST ||= '127.0.0.1';
process.env.DB_NAME ||= 'test';
process.env.DB_USER ||= 'test';
process.env.DB_PASSWORD ||= 'test';

const { buildInvoice } = require('../src/services/invoice-builder');

test('omite totalISC cuando la factura no contiene ISC', () => {
  const document = buildInvoice({
    customer: { type: '02', email: '', phone: '' },
    items: [{ description: 'Servicio', code: '', quantity: 1, unitPrice: 10, taxCode: '00', net: 10, tax: 0, total: 10 }],
    paymentMethod: '02', paymentDescription: '', subtotal: 10, tax: 0, total: 10
  }, '0000000001');
  assert.equal(Object.hasOwn(document.totalesSubTotales, 'totalISC'), false);
});
