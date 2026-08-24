const express = require('express');
const pool = require('../config/database');
const env = require('../config/env');
const { requireAuth, requireMfa, verifyCsrf } = require('../middleware/security');
const { validateInvoice } = require('../validation/invoice');
const { buildInvoice } = require('../services/invoice-builder');
const hka = require('../services/hka-client');
const { getHkaConfiguration } = require('../services/configuration');
const safeAudit = require('../services/safe-audit');
const { validateIdempotencyKey, fingerprintInvoice, idempotentResponse } = require('../services/invoice-idempotency');

const router = express.Router();
router.use(requireAuth, requireMfa);

async function findByIdempotencyKey(companyId, idempotencyKey) {
  const [rows] = await pool.execute(`SELECT id,idempotency_key,request_hash,fiscal_number AS fiscalNumber,status,provider_code AS providerCode,
    provider_message AS providerMessage,cufe,qr_url AS qr,authorization_protocol AS protocol
    FROM electronic_invoices WHERE company_id=? AND idempotency_key=? LIMIT 1`, [companyId, idempotencyKey]);
  return rows[0] || null;
}

async function reserveInvoice(companyId, userId, normalized, provider, idempotencyKey, requestHash) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('INSERT IGNORE INTO invoice_sequences (company_id,branch_code,billing_point,document_type,next_number) VALUES (?,?,?,?,1)', [companyId, provider.branchCode, provider.billingPoint, '01']);
    const [rows] = await connection.execute('SELECT next_number FROM invoice_sequences WHERE company_id=? AND branch_code=? AND billing_point=? AND document_type=? FOR UPDATE', [companyId, provider.branchCode, provider.billingPoint, '01']);
    const next = Number(rows[0].next_number);
    if (next > 9999999999) throw new Error('La secuencia fiscal alcanzó su límite.');
    const fiscalNumber = String(next).padStart(10, '0');
    const document = buildInvoice(normalized, fiscalNumber, provider);
    const [result] = await connection.execute(`INSERT INTO electronic_invoices (company_id,created_by,idempotency_key,request_hash,customer_id,branch_code,billing_point,document_type,fiscal_number,customer_name,customer_email,subtotal,tax_total,total,request_payload) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [companyId, userId, idempotencyKey, requestHash, normalized.customer.id, provider.branchCode, provider.billingPoint, '01', fiscalNumber, normalized.customer.name || null, normalized.customer.email || null, normalized.subtotal, normalized.tax, normalized.total, JSON.stringify({ documento: document })]);
    await connection.execute('UPDATE invoice_sequences SET next_number=next_number+1 WHERE company_id=? AND branch_code=? AND billing_point=? AND document_type=?', [companyId, provider.branchCode, provider.billingPoint, '01']);
    await connection.commit();
    return { id: result.insertId, fiscalNumber, document };
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      const existing = await findByIdempotencyKey(companyId, idempotencyKey);
      if (existing) return { replayed: true, invoice: existing };
    }
    throw error;
  }
  finally { connection.release(); }
}

router.post('/', verifyCsrf, async (req, res, next) => {
  const idempotencyKey = validateIdempotencyKey(req.get('idempotency-key'));
  if (!idempotencyKey) return res.status(400).json({ error: 'Envía una cabecera Idempotency-Key válida de 16 a 128 caracteres.' });
  const requestHash = fingerprintInvoice(req.body);
  try {
    const previous = await findByIdempotencyKey(req.company.id, idempotencyKey);
    if (previous) {
      if (previous.request_hash !== requestHash) return res.status(409).json({ error: 'La clave de idempotencia ya fue utilizada con una factura diferente.', code: 'IDEMPOTENCY_CONFLICT' });
      return idempotentResponse(res, previous);
    }
  } catch (error) { return next(error); }
  let input = req.body;
  const posIds = [...new Set((Array.isArray(input.items) ? input.items : []).map((item) => Number(item.articleId)).filter((id) => Number.isSafeInteger(id) && id > 0))];
  if (posIds.length) {
    const [articles] = await pool.query("SELECT id,sku,name,description,sale_price AS salePrice,tax_code AS taxCode FROM articles WHERE company_id=? AND id IN (?) AND status='active' AND available_in_pos=TRUE", [req.company.id, posIds]);
    const byId = new Map(articles.map((article) => [Number(article.id), article]));
    if (byId.size !== posIds.length) return res.status(422).json({ error: 'Uno o más artículos ya no están disponibles en POS.' });
    input = { ...input, items: input.items.map((item) => { const article = byId.get(Number(item.articleId)); return article ? { description: article.description || article.name, code: article.sku || '', quantity: item.quantity, unitPrice: article.salePrice, taxCode: article.taxCode } : item; }) };
  }
  const validation = validateInvoice(input);
  if (validation.errors) return res.status(422).json({ error: 'Revisa los datos de la factura.', details: validation.errors });
  if (validation.value.customer.id) {
    const [clientRows] = await pool.execute('SELECT id FROM clients WHERE id=? AND company_id=? LIMIT 1', [validation.value.customer.id, req.company.id]);
    if (!clientRows[0]) return res.status(422).json({ error: 'El cliente no pertenece a la empresa activa.' });
  }
  let reserved;
  try {
    const provider = await getHkaConfiguration(req.company.id);
    if (!provider.configured) return res.status(503).json({ error: 'Configura las credenciales de The Factory HKA antes de emitir.' });
    reserved = await reserveInvoice(req.company.id, req.authUser.id, validation.value, provider, idempotencyKey, requestHash);
    if (reserved.replayed) {
      if (reserved.invoice.request_hash !== requestHash) return res.status(409).json({ error: 'La clave de idempotencia ya fue utilizada con una factura diferente.', code: 'IDEMPOTENCY_CONFLICT' });
      return idempotentResponse(res, reserved.invoice);
    }
    const response = await hka.send(req.company.id, reserved.document);
    const code = String(response.codigo ?? response.Codigo ?? '');
    const authorized = code === '200' || code === '0';
    await pool.execute(`UPDATE electronic_invoices SET status=?,provider_code=?,provider_message=?,cufe=?,qr_url=?,authorization_protocol=?,response_payload=?,issued_at=IF(?,UTC_TIMESTAMP(),NULL) WHERE id=? AND company_id=?`, [authorized ? 'authorized' : 'rejected', code || null, response.mensaje || response.Mensaje || null, response.cufe || response.Cufe || null, response.qr || response.Qr || null, response.numeroProtocoloAutorizacion || null, JSON.stringify(response), authorized, reserved.id, req.company.id]);
    await safeAudit(req, authorized ? 'invoice.authorized' : 'invoice.rejected', 'invoice', reserved.id);
    if (!authorized) return res.status(422).json({ error: response.mensaje || response.Mensaje || 'The Factory HKA rechazó el documento.', invoiceId: reserved.id, fiscalNumber: reserved.fiscalNumber, providerCode: code });
    return res.status(201).json({ message: 'Factura electrónica autorizada.', invoice: { id: reserved.id, fiscalNumber: reserved.fiscalNumber, cufe: response.cufe || response.Cufe, qr: response.qr || response.Qr, protocol: response.numeroProtocoloAutorizacion || null } });
  } catch (error) {
    if (!reserved) return next(error);
    const status = error.uncertain || !error.providerResponse ? 'uncertain' : 'rejected';
    await pool.execute('UPDATE electronic_invoices SET status=?,provider_message=?,response_payload=? WHERE id=? AND company_id=?', [status, error.message.slice(0, 1000), error.providerResponse ? JSON.stringify(error.providerResponse) : null, reserved.id, req.company.id]);
    await safeAudit(req, status === 'uncertain' ? 'invoice.uncertain' : 'invoice.rejected', 'invoice', reserved.id);
    return res.status(status === 'uncertain' ? 502 : 422).json({ error: status === 'uncertain' ? 'No se pudo confirmar el resultado con HKA. Consulta el estado antes de reintentar.' : error.message, invoiceId: reserved.id, fiscalNumber: reserved.fiscalNumber, status });
  }
});

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id,fiscal_number AS fiscalNumber,customer_name AS customerName,subtotal,tax_total AS taxTotal,total,status,provider_message AS providerMessage,cufe,qr_url AS qr,created_at AS createdAt FROM electronic_invoices WHERE company_id=? ORDER BY id DESC LIMIT 50', [req.company.id]);
    return res.json({ invoices: rows });
  } catch (error) { return next(error); }
});

router.post('/:id/refresh', verifyCsrf, async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT id,branch_code,billing_point,document_type,fiscal_number FROM electronic_invoices WHERE id=? AND company_id=? LIMIT 1', [req.params.id, req.company.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Factura no encontrada.' });
    const invoice = rows[0];
    const response = await hka.status(req.company.id, { codigoSucursalEmisor: invoice.branch_code, numeroDocumentoFiscal: invoice.fiscal_number, puntoFacturacionFiscal: invoice.billing_point, tipoDocumento: invoice.document_type, tipoEmision: '01' });
    const documentStatus = String(response.estatusDocumento || '').toLowerCase();
    const status = documentStatus.includes('autoriz') ? 'authorized' : (documentStatus.includes('rechaz') || documentStatus.includes('anulad') ? 'rejected' : 'uncertain');
    await pool.execute('UPDATE electronic_invoices SET status=?,provider_code=?,provider_message=?,cufe=COALESCE(?,cufe),qr_url=COALESCE(?,qr_url),authorization_protocol=COALESCE(?,authorization_protocol),response_payload=? WHERE id=? AND company_id=?', [status, String(response.codigo || ''), response.mensajeDocumento || response.mensaje || null, response.cufe || null, response.qr || null, response.numeroProtocoloAutorizacion || null, JSON.stringify(response), invoice.id, req.company.id]);
    await safeAudit(req, 'invoice.status_refreshed', 'invoice', invoice.id);
    return res.json({ message: 'Estado actualizado.', status, provider: response });
  } catch (error) { return next(error); }
});

module.exports = router;
