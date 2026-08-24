const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { validateIdempotencyKey, fingerprintInvoice, idempotentResponse } = require('../src/services/invoice-idempotency');

async function withIdempotentInvoiceApi(run) {
  const invoices = new Map();
  let providerCalls = 0;
  const app = express();
  app.use(express.json());
  app.post('/api/invoices', (req, res) => {
    const key = validateIdempotencyKey(req.get('idempotency-key'));
    if (!key) return res.status(400).json({ error: 'Idempotency-Key inválida.' });
    const requestHash = fingerprintInvoice(req.body);
    const previous = invoices.get(key);
    if (previous) {
      if (previous.request_hash !== requestHash) return res.status(409).json({ code: 'IDEMPOTENCY_CONFLICT' });
      return idempotentResponse(res, previous);
    }
    providerCalls += 1;
    const invoice = { id: invoices.size + 1, request_hash: requestHash, fiscalNumber: String(invoices.size + 1).padStart(10, '0'), status: 'authorized', cufe: `CUFE-${invoices.size + 1}` };
    invoices.set(key, invoice);
    return res.status(201).json({ invoice });
  });

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  try {
    const { port } = server.address();
    await run({ url: `http://127.0.0.1:${port}/api/invoices`, providerCalls: () => providerCalls });
  } finally { await new Promise((resolve) => server.close(resolve)); }
}

test('un reintento HTTP devuelve la factura original sin reenviar al proveedor', async () => {
  await withIdempotentInvoiceApi(async ({ url, providerCalls }) => {
    const options = { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': 'fiscal-operation-0001' }, body: JSON.stringify({ customer: { id: 7 }, total: 10 }) };
    const first = await fetch(url, options);
    const replay = await fetch(url, options);
    assert.equal(first.status, 201);
    assert.equal(replay.status, 200);
    assert.equal((await replay.json()).replayed, true);
    assert.equal(providerCalls(), 1);
  });
});

test('rechaza reutilizar la clave HTTP con una factura diferente', async () => {
  await withIdempotentInvoiceApi(async ({ url, providerCalls }) => {
    const headers = { 'content-type': 'application/json', 'idempotency-key': 'fiscal-operation-0002' };
    await fetch(url, { method: 'POST', headers, body: JSON.stringify({ total: 10 }) });
    const conflict = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ total: 11 }) });
    assert.equal(conflict.status, 409);
    assert.equal((await conflict.json()).code, 'IDEMPOTENCY_CONFLICT');
    assert.equal(providerCalls(), 1);
  });
});

test('la clave fiscal queda aislada por empresa en el esquema', () => {
  const schema = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
  assert.match(schema, /idempotency_key VARCHAR\(128\)/);
  assert.match(schema, /request_hash CHAR\(64\)/);
  assert.match(schema, /UNIQUE KEY uq_invoice_company_idempotency \(company_id,idempotency_key\)/);
});

test('la huella es estable aunque cambie el orden de las propiedades JSON', () => {
  assert.equal(fingerprintInvoice({ total: 10, customer: { name: 'ACME', id: 7 } }), fingerprintInvoice({ customer: { id: 7, name: 'ACME' }, total: 10 }));
});
