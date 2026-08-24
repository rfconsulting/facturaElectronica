const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { observeRequest, renderMetrics, resetMetrics } = require('../src/services/metrics');

test('expone contadores Prometheus sin etiquetas de alta cardinalidad', () => {
  resetMetrics();
  const response = new EventEmitter();
  response.statusCode = 201;
  observeRequest({ requestId: 'req-1', method: 'POST', path: '/api/invoices/123' }, response, () => {});
  response.emit('finish');
  const output = renderMetrics();
  assert.match(output, /factura_http_requests_total\{method="POST",status="201"\} 1/);
  assert.doesNotMatch(output, /invoices\/123/);
});
