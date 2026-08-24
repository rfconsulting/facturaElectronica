const test = require('node:test');
const assert = require('node:assert/strict');
const safeAudit = require('../src/services/safe-audit');

test('un fallo de auditoría no se propaga a la operación fiscal', async () => {
  const messages = [];
  const result = await safeAudit(
    { requestId: 'request-1' },
    'invoice.authorized',
    'invoice',
    42,
    {
      writeAudit: async () => { throw new Error('base de auditoría no disponible'); },
      logError: (message) => messages.push(JSON.parse(message))
    }
  );

  assert.equal(result, false);
  assert.deepEqual(messages, [{
    event: 'audit_write_failed',
    requestId: 'request-1',
    action: 'invoice.authorized',
    targetType: 'invoice',
    targetId: 42,
    error: 'base de auditoría no disponible'
  }]);
});

test('confirma una escritura de auditoría exitosa', async () => {
  const result = await safeAudit(
    { requestId: 'request-2' },
    'invoice.rejected',
    'invoice',
    43,
    { writeAudit: async () => {} }
  );

  assert.equal(result, true);
});
