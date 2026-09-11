const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { observeRequest, recordLegacyQuotationAlias, renderMetrics, resetMetrics } = require('../src/services/metrics');

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

test('cuenta el uso del alias heredado sin etiquetas de alta cardinalidad',()=>{
  resetMetrics();
  const headers={};
  recordLegacyQuotationAlias({method:'get'},{set:(name,value)=>{headers[name]=value;}},()=>{});
  recordLegacyQuotationAlias({method:'get'},null,()=>{});
  const output=renderMetrics();
  assert.match(output,/factura_legacy_quotation_alias_requests_total\{method="GET"\} 2/);
  assert.doesNotMatch(output,/crm\/quotes\/\d/);
  assert.equal(headers.Deprecation,'true');
  assert.match(headers.Link,/\/api\/quotations/);
});
