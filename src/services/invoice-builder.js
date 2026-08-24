const env = require('../config/env');
const { money, quantity } = require('../validation/invoice');

function panamaTimestamp(date = new Date()) {
  const local = new Date(date.getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 19);
  return `${local}-05:00`;
}

function buildInvoice(invoice, fiscalNumber, provider = env.hka) {
  const customer = { tipoClienteFE: invoice.customer.type, pais: invoice.customer.countryCode || 'PA' };
  if (['01', '03'].includes(invoice.customer.type)) Object.assign(customer, { tipoContribuyente: invoice.customer.contributorType, numeroRUC: invoice.customer.ruc, digitoVerificadorRUC: invoice.customer.dv, razonSocial: invoice.customer.name, direccion: invoice.customer.address, codigoUbicacion: invoice.customer.locationCode, provincia: invoice.customer.province, distrito: invoice.customer.district, corregimiento: invoice.customer.township });
  if (invoice.customer.type === '04') Object.assign(customer, { razonSocial: invoice.customer.name, tipoIdentificacion: invoice.customer.foreignIdType, nroIdentificacionExtranjero: invoice.customer.foreignIdNumber, ...(invoice.customer.foreignCountry ? { paisExtranjero: invoice.customer.foreignCountry } : {}), ...(invoice.customer.address ? { direccion: invoice.customer.address } : {}) });
  if (invoice.customer.countryCode === 'ZZ' && invoice.customer.countryOther) customer.paisOtro = invoice.customer.countryOther;
  if (invoice.customer.email) customer.correoElectronico1 = invoice.customer.email;
  if (invoice.customer.phone) customer.telefono1 = invoice.customer.phone;
  const list = invoice.items.map((item) => ({ descripcion: item.description, ...(item.code ? { codigo: item.code } : {}), cantidad: quantity(item.quantity), precioUnitario: money(item.unitPrice), precioUnitarioDescuento: '0.00', precioItem: money(item.net), valorTotal: money(item.total), tasaITBMS: item.taxCode, valorITBMS: money(item.tax) }));
  return {
    codigoSucursalEmisor: provider.branchCode, tipoSucursal: provider.branchType,
    datosTransaccion: { tipoEmision: '01', tipoDocumento: '01', numeroDocumentoFiscal: fiscalNumber, puntoFacturacionFiscal: provider.billingPoint, fechaEmision: panamaTimestamp(), naturalezaOperacion: '01', tipoOperacion: '1', destinoOperacion: '1', formatoCAFE: '3', entregaCAFE: invoice.customer.email ? '3' : '2', envioContenedor: '1', procesoGeneracion: '1', tipoVenta: '1', cliente: customer },
    listaItems: list,
    totalesSubTotales: { totalPrecioNeto: money(invoice.subtotal), totalITBMS: money(invoice.tax), totalMontoGravado: money(invoice.tax), totalFactura: money(invoice.total), totalValorRecibido: money(invoice.total), tiempoPago: invoice.paymentMethod === '01' ? '2' : '1', nroItems: String(list.length), totalTodosItems: money(invoice.total), listaFormaPago: [{ formaPagoFact: invoice.paymentMethod, ...(invoice.paymentMethod === '99' ? { descFormaPago: invoice.paymentDescription } : {}), valorCuotaPagada: money(invoice.total) }] }
  };
}
module.exports = { buildInvoice, panamaTimestamp };
