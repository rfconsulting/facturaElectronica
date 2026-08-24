const test = require('node:test');
const assert = require('node:assert/strict');
const { validateInvoice, quantity } = require('../src/validation/invoice');
test('calcula una factura local con ITBMS sin confiar en totales del cliente', () => { const result = validateInvoice({ customerType: '02', paymentMethod: '02', items: [{ description: 'Servicio profesional', quantity: '2', unitPrice: '100', taxCode: '01' }] }); assert.deepEqual({ subtotal: result.value.subtotal, tax: result.value.tax, total: result.value.total }, { subtotal: 200, tax: 14, total: 214 }); });
test('exige identidad y ubicación fiscal a contribuyentes', () => { const result = validateInvoice({ customerType: '01', items: [{ description: 'Producto', quantity: 1, unitPrice: 10, taxCode: '00' }] }); assert.ok(result.errors.some((error) => error.includes('datos fiscales'))); });
test('rechaza tasas y cantidades manipuladas', () => { const result = validateInvoice({ customerType: '02', items: [{ description: 'Producto', quantity: -1, unitPrice: 10, taxCode: '99' }] }); assert.ok(result.errors.length >= 2); });
test('serializa cantidad con el formato decimal exigido por HKA', () => { assert.equal(quantity(1), '1.00'); assert.equal(quantity(1.5), '1.50'); assert.equal(quantity(1.234567), '1.234567'); });
