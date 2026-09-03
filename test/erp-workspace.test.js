const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('ERP expone tablero, cotizaciones, pedidos y cobros',()=>{const app=read('src/app.js'),routes=read('src/routes/erp.js'),ui=read('public/erp-ui.js'),dashboard=read('public/dashboard.js'),html=read('public/dashboard.html');assert.match(app,/\/api\/erp/);assert.match(routes,/router\.get\('\/dashboard'/);assert.match(routes,/router\.get\('\/orders'/);assert.match(ui,/Resumen ERP/);assert.match(ui,/Cotizaciones/);assert.match(ui,/Pedidos/);assert.match(ui,/Cuentas por cobrar/);assert.match(dashboard,/erpDashboard/);assert.doesNotMatch(html,/<header class="area-hero crm-hero" data-area-navigation="erp">/);});

test('pedido conserva origen y puede preparar factura',()=>{const routes=read('src/routes/erp.js'),invoiceRepository=read('src/modules/invoicing/infrastructure/invoice.repository.js');assert.match(routes,/source_quote_id AS sourceQuoteId/);assert.match(routes,/invoice-draft/);assert.match(invoiceRepository,/UPDATE sales_orders SET status='invoiced'/);});
test('ERP permite crear, emitir, revisar y convertir cotizaciones',()=>{const ui=read('public/erp-ui.js');assert.match(ui,/data-erp-quote-form/);assert.match(ui,/Solicitar aprobación/);assert.match(ui,/Emitir cotización/);assert.match(ui,/data-erp-quote-revise/);assert.match(ui,/data-erp-quote-convert/);assert.match(ui,/\/api\/quotations/);assert.match(ui,/Idempotency-Key/);});
