const crypto = require('node:crypto');

const KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/;

function validateIdempotencyKey(value) {
  const key = String(value || '').trim();
  return KEY_PATTERN.test(key) ? key : null;
}

function fingerprintInvoice(invoice) {
  function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
    return value;
  }
  return crypto.createHash('sha256').update(JSON.stringify(canonical(invoice))).digest('hex');
}

function idempotentResponse(res, invoice) {
  const fiscalNumber = invoice.fiscalNumber || invoice.fiscal_number;
  const providerMessage = invoice.providerMessage || invoice.provider_message;
  const providerCode = invoice.providerCode || invoice.provider_code;
  const qr = invoice.qr || invoice.qr_url;
  const protocol = invoice.protocol || invoice.authorization_protocol;

  if (invoice.status === 'authorized') {
    return res.status(200).json({
      message: 'Factura electrónica autorizada previamente.',
      replayed: true,
      invoice: { id: invoice.id, fiscalNumber, cufe: invoice.cufe, qr, protocol }
    });
  }
  if (invoice.status === 'rejected') {
    return res.status(422).json({ error: providerMessage || 'HKA rechazó previamente el documento.', replayed: true, invoiceId: invoice.id, fiscalNumber, providerCode, status: 'rejected' });
  }
  return res.status(409).json({
    error: invoice.status === 'uncertain'
      ? 'Esta operación tiene un resultado incierto. Consulta su estado antes de continuar.'
      : 'Esta operación fiscal ya está en proceso.',
    replayed: true,
    invoiceId: invoice.id,
    fiscalNumber,
    status: invoice.status
  });
}

module.exports = { validateIdempotencyKey, fingerprintInvoice, idempotentResponse };
