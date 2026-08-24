const path = require('node:path');
const { parseXlsx, parseCsv } = require('./zoho-import');

function taxCode(value) { const rate = Number(value); return ({ 0: '00', 7: '01', 10: '02', 15: '03' })[rate] || '00'; }
function money(value) { const match = String(value || '').replace(/,/g, '').match(/(?:[A-Z]{3}\s*)?(-?\d+(?:\.\d+)?)/); return match ? Number(match[1]) : NaN; }
function mapArticleRows(rows) {
  if (rows.length < 2) throw new Error('El archivo no contiene artículos.');
  const headers = rows[0].map((header) => String(header || '').trim()); const at = (row, name) => String(row[headers.indexOf(name)] ?? '').trim();
  if (!headers.includes('Product Type') || !headers.includes('Item Name')) throw new Error('El archivo no corresponde a una exportación de artículos de Zoho Inventory.');
  return rows.slice(1).filter((row) => row.some((value) => String(value || '').trim())).map((row, index) => ({ sourceRow: index + 2, article: { zohoItemId: at(row, 'Item ID') || null, sku: at(row, 'SKU') || null, name: at(row, 'Item Name'), description: at(row, 'Description') || null, salePrice: money(at(row, 'Rate')), itemType: at(row, 'Product Type').toLowerCase() === 'service' ? 'service' : 'product', status: at(row, 'Status').toLowerCase() === 'inactive' ? 'inactive' : 'active', unit: at(row, 'Usage unit') || 'und', currency: (at(row, 'Rate').match(/[A-Z]{3}/)?.[0] || 'USD'), taxCode: taxCode(at(row, 'Tax1 Percentage')), taxName: at(row, 'Tax1 Name') || null, profit: at(row, 'CF.Profit') || null, cpbsCode: at(row, 'CF.CPBS') || null, customFields: {} } }));
}
function parseZohoArticleFile(file) { const extension = path.extname(file.originalname).toLowerCase(); if (!['.xlsx','.csv'].includes(extension)) throw new Error('Usa un archivo .xlsx o .csv exportado por Zoho Inventory.'); return mapArticleRows(extension === '.xlsx' ? parseXlsx(file.buffer) : parseCsv(file.buffer)); }
module.exports = { parseZohoArticleFile, mapArticleRows, money, taxCode };
