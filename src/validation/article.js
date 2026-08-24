function clean(value, max) { return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, max); }
function validateArticle(input) {
  const errors = []; const price = Number(input.salePrice); const profit = input.profit === '' || input.profit == null ? null : Number(input.profit);
  const value = { zohoItemId: clean(input.zohoItemId, 30) || null, sku: clean(input.sku, 50) || null, name: clean(input.name, 200), description: clean(input.description, 500) || null, itemType: input.itemType === 'service' ? 'service' : (input.itemType === 'product' ? 'product' : ''), status: input.status === 'inactive' ? 'inactive' : 'active', availableInPos: input.availableInPos === true || ['true','1','on'].includes(String(input.availableInPos).toLowerCase()), unit: clean(input.unit || 'und', 20), salePrice: Number.isFinite(price) ? Math.round(price * 100) / 100 : NaN, currency: clean(input.currency || 'USD', 3).toUpperCase(), taxCode: clean(input.taxCode || '00', 2), taxName: clean(input.taxName, 50) || null, cpbsCode: clean(input.cpbsCode, 20) || null, profit: Number.isFinite(profit) ? Math.round(profit * 100) / 100 : null, customFields: input.customFields && typeof input.customFields === 'object' ? input.customFields : {} };
  if (value.name.length < 2) errors.push('El nombre del artículo es obligatorio.');
  if (!value.itemType) errors.push('Clasifica el artículo como producto o servicio.');
  if (!(value.salePrice >= 0)) errors.push('El precio de venta no es válido.');
  if (!/^[A-Z]{3}$/.test(value.currency)) errors.push('La moneda debe tener tres letras.');
  if (!['00','01','02','03'].includes(value.taxCode)) errors.push('La tasa de ITBMS no es válida.');
  return errors.length ? { errors } : { value };
}
module.exports = { validateArticle };
