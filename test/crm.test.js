const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('el CRM incluye cotizaciones, automatizaciones y bandeja de integración',()=>{const schema=read('database/schema.sql');for(const table of ['crm_quotes','crm_quote_items','crm_quote_sequences','crm_automation_rules','integration_outbox'])assert.match(schema,new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));});

test('los correlativos de cotización se reservan con bloqueo por empresa',()=>{const route=read('src/routes/crm-advanced.js');assert.match(route,/crm_quote_sequences/);assert.match(route,/FOR UPDATE/);assert.match(route,/company_id=\?/);});

test('el CRUD comercial conserva historial mediante estados no destructivos',()=>{const route=read('src/routes/crm-advanced.js');for(const state of ['discarded','lost','cancelled'])assert.match(route,new RegExp(state));assert.doesNotMatch(route,/router\.delete\(/i);});

test('las escrituras avanzadas requieren CSRF y contexto empresarial',()=>{const route=read('src/routes/crm-advanced.js');assert.match(route,/verifyCsrf/);assert.match(route,/req\.company\.id/);assert.match(route,/requireMfa/);});

test('la evolución comercial separa contactos y cuentas por cobrar',()=>{const schema=read('database/schema.sql');for(const table of ['client_contacts','accounts_receivable','receivable_payments'])assert.match(schema,new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));assert.match(schema,/source_quote_id/);});

test('converted solo se alcanza mediante conversión guiada',()=>{const route=read('src/routes/crm-evolution.js');assert.match(route,/status==='converted'/);assert.match(route,/solo puede establecerse mediante la conversión guiada/);assert.match(route,/client_contacts/);assert.match(route,/crm\.lead\.converted/);});

test('el nuevo pipeline exige integridad y enlaza cotización, factura y cobro',()=>{const route=read('src/routes/crm-evolution.js');for(const stage of ['diagnosis','solution_defined','quote_sent','follow_up','payment_pending'])assert.match(route,new RegExp(stage));assert.match(route,/invoice-draft/);assert.match(route,/receivables\/:id\/payments/);assert.match(route,/El pago no puede superar el saldo pendiente/);});

test('la interfaz expone contactos, conversión guiada y cobros',()=>{const ui=read('public/crm-ui.js');assert.match(ui,/Contactos de clientes/);assert.match(ui,/Convertir con trazabilidad/);assert.match(ui,/Cuentas por cobrar/);assert.match(ui,/data-quote-invoice/);});
