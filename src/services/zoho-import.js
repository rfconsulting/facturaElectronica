const path = require('node:path');
const AdmZip = require('adm-zip');

function decodeXml(value = '') { return value.replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(parseInt(code, 16))).replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code))).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&'); }
function columnIndex(reference) { return [...reference.replace(/\d/g, '')].reduce((value, char) => value * 26 + char.charCodeAt(0) - 64, 0) - 1; }
function xmlTexts(xml) { return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((match) => decodeXml(match[1])).join(''); }

function parseXlsx(buffer) {
  const zip = new AdmZip(buffer);
  const sharedEntry = zip.getEntry('xl/sharedStrings.xml');
  const shared = sharedEntry ? [...sharedEntry.getData().toString('utf8').matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map((match) => xmlTexts(match[1])) : [];
  const workbook = zip.readAsText('xl/workbook.xml');
  const relationships = zip.readAsText('xl/_rels/workbook.xml.rels');
  const relationMap = Object.fromEntries([...relationships.matchAll(/<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g)].map((match) => [match[1], match[2]]));
  const sheets = [...workbook.matchAll(/<sheet[^>]+name="([^"]+)"[^>]+r:id="([^"]+)"/g)];
  const selected = sheets.find((match) => /customer|cliente|contact/i.test(match[1])) || sheets[0];
  if (!selected) throw new Error('El libro no contiene hojas.');
  let target = relationMap[selected[2]];
  if (!target) throw new Error('No se pudo localizar la hoja de clientes.');
  target = target.startsWith('/') ? target.slice(1) : (target.startsWith('xl/') ? target : `xl/${target}`);
  const xml = zip.readAsText(target);
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const cell of rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const ref = /\sr="([A-Z]+\d+)"/.exec(cell[1])?.[1];
      if (!ref) continue;
      const type = /\st="([^"]+)"/.exec(cell[1])?.[1];
      const raw = /<v>([\s\S]*?)<\/v>/.exec(cell[2])?.[1] ?? '';
      row[columnIndex(ref)] = type === 's' && raw !== '' ? shared[Number(raw)] : (type === 'inlineStr' ? xmlTexts(cell[2]) : decodeXml(raw));
    }
    rows.push(row);
  }
  return rows;
}

function parseCsv(buffer) {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const rows = []; let row = []; let cell = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) { const char = text[index]; if (char === '"') { if (quoted && text[index + 1] === '"') { cell += '"'; index += 1; } else quoted = !quoted; } else if (char === ',' && !quoted) { row.push(cell); cell = ''; } else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && text[index + 1] === '\n') index += 1; row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; } else cell += char; }
  row.push(cell); if (row.some(Boolean)) rows.push(row); return rows;
}

function parseFiscal(value) { const match = /^\s*([JN])\.([\s\S]+)\.([A-Za-z0-9]{1,2})\s*$/i.exec(value || ''); return match ? { contributorType: match[1].toUpperCase() === 'N' ? '1' : '2', ruc: match[2].trim(), dv: match[3].trim() } : {}; }
function countryCode(value) { const country = String(value || '').trim().toLowerCase(); if (!country || ['panama', 'panamá'].includes(country)) return 'PA'; const known = { 'united states': 'US', 'estados unidos': 'US', usa: 'US', colombia: 'CO', venezuela: 'VE', 'costa rica': 'CR', mexico: 'MX', méxico: 'MX', spain: 'ES', españa: 'ES' }; return known[country] || 'ZZ'; }

function mapRows(rows) {
  if (rows.length < 2) throw new Error('El archivo no contiene clientes.');
  const headers = rows[0].map((header) => String(header || '').trim());
  const at = (row, name) => String(row[headers.indexOf(name)] ?? '').trim();
  return rows.slice(1).filter((row) => row.some((value) => String(value || '').trim())).map((row, index) => {
    const fiscal = parseFiscal(at(row, 'CF.FiscalDGI')); const country = countryCode(at(row, 'Billing Country'));
    const name = at(row, 'Display Name') || at(row, 'Customer Name') || at(row, 'Company Name') || [at(row, 'First Name'), at(row, 'Last Name')].filter(Boolean).join(' ');
    const address = [at(row, 'Billing Address'), at(row, 'Billing Street2')].filter(Boolean).join(', ');
    const completeFiscal = Boolean(fiscal.ruc && address && at(row, 'Billing State') && at(row, 'Billing City') && at(row, 'Billing County') && at(row, 'Billing Code'));
    const warnings = []; if (fiscal.ruc && !completeFiscal) warnings.push('Datos DGI encontrados; falta completar ubicación fiscal antes de facturar como contribuyente.');
    const zohoId = at(row, 'Customer ID');
    return { sourceRow: index + 2, warnings, client: { code: zohoId ? `ZOHO-${zohoId}`.slice(0, 30) : null, status: at(row, 'Status').toLowerCase() === 'inactive' ? 'inactive' : 'active', customerType: country !== 'PA' ? '04' : (completeFiscal ? '01' : '02'), contributorType: fiscal.contributorType || (at(row, 'Customer Sub Type') === 'individual' ? '1' : '2'), ruc: fiscal.ruc || at(row, 'ID de empresa') || null, dv: fiscal.dv || null, legalName: name, tradeName: at(row, 'Company Name') || null, email: at(row, 'EmailID') || at(row, 'CF.EmailFEL') || null, secondaryEmail: at(row, 'CF.EmailFEL') && at(row, 'EmailID') !== at(row, 'CF.EmailFEL') ? at(row, 'CF.EmailFEL') : null, phone: at(row, 'Phone') || at(row, 'Billing Phone') || null, secondaryPhone: at(row, 'MobilePhone') || null, address: address || null, locationCode: at(row, 'Billing Code') || null, province: at(row, 'Billing State') || null, district: at(row, 'Billing City') || null, township: at(row, 'Billing County') || null, countryCode: country, countryOther: country === 'ZZ' ? at(row, 'Billing Country') : null, foreignIdType: country !== 'PA' ? '02' : null, foreignIdNumber: country !== 'PA' ? (fiscal.ruc || at(row, 'ID de empresa') || zohoId) : null, foreignCountry: country !== 'PA' ? at(row, 'Billing Country') : null, notes: [at(row, 'Notes'), at(row, 'Website') ? `Sitio web: ${at(row, 'Website')}` : '', at(row, 'Payment Terms Label') ? `Condición de pago Zoho: ${at(row, 'Payment Terms Label')}` : ''].filter(Boolean).join('\n') || null, customFields: {} } };
  });
}

function parseZohoFile(file) { const extension = path.extname(file.originalname).toLowerCase(); if (!['.xlsx', '.csv'].includes(extension)) throw new Error('Usa un archivo .xlsx o .csv exportado por Zoho Invoice.'); return mapRows(extension === '.xlsx' ? parseXlsx(file.buffer) : parseCsv(file.buffer)); }

module.exports = { parseZohoFile, parseFiscal, mapRows, parseXlsx, parseCsv };
