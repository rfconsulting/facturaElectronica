const test = require('node:test');
const assert = require('node:assert/strict');
const { validateHkaConfiguration } = require('../src/validation/configuration');
test('acepta una configuración HKA completa', () => { const result = validateHkaConfiguration({ environment: 'demo', username: 'empresa', password: 'secreto', branchCode: '0000', branchType: '1', billingPoint: '001', timeoutMs: '30000' }); assert.equal(result.errors, undefined); assert.equal(result.value.timeoutMs, 30000); });
test('rechaza ambiente, sucursal y punto fiscal inválidos', () => { const result = validateHkaConfiguration({ environment: 'otro', username: '', password: '', branchCode: '1', branchType: '9', billingPoint: '000', timeoutMs: 1 }); assert.ok(result.errors.length >= 6); });
