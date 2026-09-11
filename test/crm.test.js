const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('el CRM incluye cotizaciones, automatizaciones y bandeja de integración',()=>{const schema=read('database/schema.sql');for(const table of ['crm_quotes','crm_quote_items','crm_quote_sequences','crm_automation_rules','integration_outbox'])assert.match(schema,new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));});

test('los correlativos de cotización se reservan con bloqueo por empresa',()=>{const route=read('src/routes/crm-advanced.js');assert.match(route,/crm_quote_sequences/);assert.match(route,/FOR UPDATE/);assert.match(route,/company_id=\?/);});

test('el borrado de oportunidades protege el historial comercial',()=>{const route=read('src/routes/crm-advanced.js');assert.match(route,/router\.delete\('\/opportunities\/:id'/);assert.match(route,/OPPORTUNITY_HAS_HISTORY/);for(const table of ['crm_activities','crm_tasks','crm_quotes','sales_orders','electronic_invoices','accounts_receivable'])assert.match(route,new RegExp(table));});

test('la edición de oportunidades usa las etapas vigentes y valida pertenencia empresarial',()=>{const route=read('src/routes/crm-advanced.js');for(const stage of ['diagnosis','solution_defined','quote_sent','follow_up','negotiation'])assert.match(route,new RegExp(stage));assert.match(route,/crm\.opportunity_updated/);assert.match(route,/client_contacts/);});

test('las escrituras avanzadas requieren CSRF y contexto empresarial',()=>{const route=read('src/routes/crm-advanced.js');assert.match(route,/verifyCsrf/);assert.match(route,/req\.company\.id/);assert.match(route,/requireMfa/);});

test('la evolución comercial separa contactos y cuentas por cobrar',()=>{const schema=read('database/schema.sql');for(const table of ['client_contacts','accounts_receivable','receivable_payments'])assert.match(schema,new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));assert.match(schema,/source_quote_id/);});

test('converted solo se alcanza mediante conversión guiada',()=>{const route=read('src/routes/crm-evolution.js');assert.match(route,/status==='converted'/);assert.match(route,/solo puede establecerse mediante la conversión guiada/);assert.match(route,/client_contacts/);assert.match(route,/crm\.lead\.converted/);});

test('el pipeline comercial queda separado de factura y cobro',()=>{const route=read('src/routes/crm-evolution.js');for(const stage of ['diagnosis','solution_defined','quote_sent','follow_up','negotiation','won','lost'])assert.match(route,new RegExp(stage));assert.doesNotMatch(route,/payment_pending/);assert.match(route,/invoice-draft/);assert.match(route,/receivables\/:id\/payments/);assert.match(route,/El pago no puede superar el saldo pendiente/);assert.doesNotMatch(route,/balance===0&&row\.opportunity_id/);});

test('la interfaz expone contactos, conversión, cobros y mantenimiento de oportunidades',()=>{const ui=read('public/crm-ui.js');assert.match(ui,/Contactos de clientes/);assert.match(ui,/Convertir con trazabilidad/);assert.match(ui,/Cuentas por cobrar/);assert.match(ui,/data-quote-invoice/);assert.match(ui,/data-opportunity-edit/);assert.match(ui,/data-opportunity-delete/);assert.match(ui,/opportunity-edit/);});

test('prospectos, contactos y actividades manuales son editables',()=>{const route=read('src/routes/crm-evolution.js'),ui=read('public/crm-ui.js');assert.match(route,/router\.get\('\/activities\/:id'/);assert.match(route,/router\.put\('\/activities\/:id'/);assert.match(route,/Las actividades automáticas no pueden editarse/);for(const control of ['data-lead-edit','data-contact-edit','data-activity-edit','lead-edit','contact-edit','activity-edit'])assert.match(ui,new RegExp(control));});

test('los recibos de pago reciben correlativo transaccional por empresa',()=>{const schema=read('database/schema.sql'),route=read('src/routes/crm-evolution.js');assert.match(schema,/CREATE TABLE IF NOT EXISTS payment_receipt_sequences/);assert.match(schema,/UNIQUE KEY uq_payment_receipt_number \(company_id,receipt_number\)/);assert.match(route,/payment_receipt_sequences/);assert.match(route,/REC-\$\{String\(Number\(sequence\.nextNumber\)\)\.padStart\(10,'0'\)\}/);assert.match(route,/PAYMENT_RECEIPT_SEQUENCE_EXHAUSTED/);});

test('cotizaciones y pedidos usan diez dígitos y límites de secuencia',()=>{const schema=read('database/schema.sql'),repository=read('src/modules/quotations/infrastructure/legacy-crm-quotes.repository.js');assert.equal((repository.match(/padStart\(10,'0'\)/g)||[]).length,2);assert.match(schema,/chk_crm_quote_next_number/);assert.match(schema,/chk_sales_order_next_number/);});

test('el CRM comparte la jerarquía visual legible del ERP',()=>{const html=read('public/dashboard.html'),theme=read('public/crm-erp-theme.css');assert.match(html,/crm-erp-theme\.css/);assert.match(theme,/\.crm-tabs \{ order:1/);assert.match(theme,/\.crm-hero \{ order:2/);assert.match(theme,/\.crm-command-grid>.crm-card:nth-child\(2\) \.crm-record-row/);assert.match(theme,/#dff5ff/);});
