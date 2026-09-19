const { getFiscalConfiguration } = require('./configuration');

const SOAP_NS = 'http://schemas.xmlsoap.org/soap/envelope/';
const CONTRACT_NS = 'http://tempuri.org/';
const DATA_NS = 'http://schemas.datacontract.org/2004/07/Services';

function escapeXml(value) { return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character]); }
function unescapeXml(value) { return String(value).replace(/&(lt|gt|quot|apos|amp);/g, (_match, entity) => ({ lt: '<', gt: '>', quot: '"', apos: "'", amp: '&' })[entity]); }
function xmlValue(name, value, prefix = 'ser') {
  if (value === null || value === undefined || value === '') return '';
  if (Array.isArray(value)) return value.map(item => xmlValue(name, item, prefix)).join('');
  if (typeof value === 'object') return `<${prefix}:${name}>${Object.entries(value).map(([key, item]) => xmlValue(key, item, prefix)).join('')}</${prefix}:${name}>`;
  return `<${prefix}:${name}>${escapeXml(value)}</${prefix}:${name}>`;
}
function buildEnvelope(operation, config, payloadName, payload) {
  const body = payloadName ? `<tem:${payloadName}>${Object.entries(payload || {}).map(([key, value]) => xmlValue(key, value)).join('')}</tem:${payloadName}>` : '';
  return `<?xml version="1.0" encoding="utf-8"?><soapenv:Envelope xmlns:soapenv="${SOAP_NS}" xmlns:tem="${CONTRACT_NS}" xmlns:ser="${DATA_NS}"><soapenv:Header/><soapenv:Body><tem:${operation}><tem:tokenEmpresa>${escapeXml(config.username)}</tem:tokenEmpresa><tem:tokenPassword>${escapeXml(config.password)}</tem:tokenPassword>${body}</tem:${operation}></soapenv:Body></soapenv:Envelope>`;
}
function tag(xml, name) { const match = xml.match(new RegExp(`<(?:[\\w-]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${name}>`, 'i')); return match ? unescapeXml(match[1].replace(/<[^>]+>/g, '').trim()) : null; }
function parseResponse(xml) {
  const fault = tag(xml, 'faultstring') || tag(xml, 'Reason');
  const response = {
    codigo: tag(xml, 'codigo') || tag(xml, 'Codigo'), resultado: tag(xml, 'resultado'), mensaje: tag(xml, 'mensaje') || tag(xml, 'Mensaje'),
    cufe: tag(xml, 'cufe') || tag(xml, 'CUFE'), qr: tag(xml, 'qr') || tag(xml, 'QR'), fechaRecepcionDGI: tag(xml, 'fechaRecepcionDGI'),
    numeroProtocoloAutorizacion: tag(xml, 'nroProtocoloAutorizacion') || tag(xml, 'numeroProtocoloAutorizacion'), estatusDocumento: tag(xml, 'estatusDocumento'),
    mensajeDocumento: tag(xml, 'mensajeDocumento'), fechaEmisionDocumento: tag(xml, 'fechaEmisionDocumento'), fechaRecepcionDocumento: tag(xml, 'fechaRecepcionDocumento')
  };
  if (fault) { const error = new Error(fault); error.providerResponse = response; throw error; }
  return Object.fromEntries(Object.entries(response).filter(([, value]) => value !== null));
}

async function call(config, operation, payloadName, payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(config.serviceUrl, { method: 'POST', signal: controller.signal, headers: { 'content-type': 'text/xml; charset=utf-8', SOAPAction: `"${CONTRACT_NS}IService/${operation}"`, accept: 'text/xml' }, body: buildEnvelope(operation, config, payloadName, payload) });
    const raw = await response.text();
    let data;
    try { data = parseResponse(raw); } catch (error) { error.status = response.status; throw error; }
    if (!response.ok) { const error = new Error(data.mensaje || `EBI respondió HTTP ${response.status}.`); error.status = response.status; error.providerResponse = data; throw error; }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') { const timeoutError = new Error('EBI no respondió dentro del tiempo esperado.'); timeoutError.uncertain = true; throw timeoutError; }
    throw error;
  } finally { clearTimeout(timeout); }
}

async function send(companyId, document) { const config = await getFiscalConfiguration(companyId, 'ebi'); return call(config, 'Enviar', 'documento', document); }
async function status(companyId, query) { const config = await getFiscalConfiguration(companyId, 'ebi'); return call(config, 'EstadoDocumento', 'datosDocumento', query); }
async function testCredentials(config) {
  const response = await call(config, 'EstadoDocumento', 'datosDocumento', { codigoSucursalEmisor: config.branchCode, numeroDocumentoFiscal: '0000000001', puntoFacturacionFiscal: config.billingPoint, tipoDocumento: '01', tipoEmision: '01' });
  if (String(response.codigo) === '101') throw new Error(response.mensaje || 'EBI rechazó tokenEmpresa o tokenPassword.');
  return { success: true, message: 'Conexión autenticada correctamente con EBI.', providerCode: response.codigo || null };
}

module.exports = { send, status, testCredentials, clearCache: () => {}, buildEnvelope, parseResponse };
