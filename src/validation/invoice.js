const TAX_RATES = Object.freeze({ '00': 0, '01': 0.07, '02': 0.10, '03': 0.15 });
const PAYMENT_METHODS = new Set(['01', '02', '03', '04', '05', '06', '07', '08', '09', '99']);

function text(value, max) { return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max); }
function amount(value, precision = 2) { const number = Number(value); const factor = 10 ** precision; return Number.isFinite(number) ? Math.round(number * factor) / factor : NaN; }
function money(value) { return value.toFixed(2); }
function quantity(value) {
  const fixed = Number(value).toFixed(6);
  return fixed.replace(/(\.\d{2}?)0+$/, '$1');
}

function validateInvoice(input) {
  const errors = [];
  const customerType = String(input.customerType || '02');
  if (!['01', '02', '03', '04'].includes(customerType)) errors.push('El tipo de cliente no es válido.');
  const customer = {
    id: Number.isSafeInteger(Number(input.clientId)) && Number(input.clientId) > 0 ? Number(input.clientId) : null,
    type: customerType,
    contributorType: String(input.contributorType || '2'),
    ruc: text(input.ruc, 20), dv: text(input.dv, 2), name: text(input.customerName, 200),
    address: text(input.address, 100), locationCode: text(input.locationCode, 8),
    province: text(input.province, 50), district: text(input.district, 50), township: text(input.township, 50),
    email: text(input.customerEmail, 254), phone: text(input.phone, 16),
    countryCode: text(input.countryCode || 'PA', 2).toUpperCase(), countryOther: text(input.countryOther, 50),
    foreignIdType: text(input.foreignIdType, 2), foreignIdNumber: text(input.foreignIdNumber, 50), foreignCountry: text(input.foreignCountry, 50)
  };
  if (['01', '03'].includes(customerType) && (!customer.ruc || !customer.dv || customer.name.length < 2 || customer.address.length < 5 || !customer.locationCode || !customer.province || !customer.district || !customer.township)) errors.push('Completa los datos fiscales y la ubicación del contribuyente.');
  if (customerType === '04' && (!['01', '02', '99'].includes(customer.foreignIdType) || !customer.foreignIdNumber || customer.countryCode === 'PA')) errors.push('Completa la identificación y el país del receptor extranjero.');
  const sourceItems = Array.isArray(input.items) ? input.items : [];
  if (!sourceItems.length || sourceItems.length > 100) errors.push('La factura debe tener entre 1 y 100 ítems.');
  const items = sourceItems.map((item, index) => {
    const description = text(item.description, 500); const code = text(item.code, 20);
    const quantity = amount(item.quantity, 6); const unitPrice = amount(item.unitPrice); const taxCode = String(item.taxCode || '00');
    if (description.length < 2) errors.push(`El ítem ${index + 1} necesita descripción.`);
    if (!(quantity > 0) || !(unitPrice >= 0)) errors.push(`Cantidad o precio inválido en el ítem ${index + 1}.`);
    if (!(taxCode in TAX_RATES)) errors.push(`ITBMS inválido en el ítem ${index + 1}.`);
    const net = Math.round(quantity * unitPrice * 100) / 100;
    const tax = Math.round(net * (TAX_RATES[taxCode] || 0) * 100) / 100;
    return { description, code, quantity, unitPrice, taxCode, net, tax, total: net + tax };
  });
  const paymentMethod = String(input.paymentMethod || '02');
  if (!PAYMENT_METHODS.has(paymentMethod)) errors.push('La forma de pago no es válida.');
  if (paymentMethod === '99' && text(input.paymentDescription, 100).length < 10) errors.push('Describe la forma de pago alternativa.');
  if (errors.length) return { errors };
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.net, 0) * 100) / 100;
  const tax = Math.round(items.reduce((sum, item) => sum + item.tax, 0) * 100) / 100;
  return { value: { customer, items, paymentMethod, paymentDescription: text(input.paymentDescription, 100), subtotal, tax, total: subtotal + tax } };
}

module.exports = { TAX_RATES, validateInvoice, money, quantity };
