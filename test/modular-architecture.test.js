const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('separa la construcción de Express del proceso que abre el puerto',()=>{const app=read('src/app.js'),server=read('src/server.js');assert.match(app,/function createApp/);assert.doesNotMatch(app,/\.listen\(/);assert.match(server,/createApp\(\)/);assert.match(server,/\.listen\(/);});

test('la ruta de facturación solo declara HTTP y middleware',()=>{const route=read('src/modules/invoicing/invoices.routes.js');assert.match(route,/controller\.create/);assert.match(route,/controller\.list/);assert.match(route,/controller\.refresh/);assert.doesNotMatch(route,/pool\.(execute|query)/);assert.doesNotMatch(route,/hka\.(send|status)/);});

test('facturación tiene casos de uso y repositorio independientes de Express',()=>{const issue=read('src/modules/invoicing/application/issue-invoice.js'),refresh=read('src/modules/invoicing/application/refresh-invoice-status.js'),repository=read('src/modules/invoicing/infrastructure/invoice.repository.js');assert.doesNotMatch(issue,/require\(['"]express/);assert.doesNotMatch(refresh,/require\(['"]express/);assert.match(repository,/invoice_sequences/);assert.match(repository,/electronic_invoices/);});

test('los casos de uso permiten inyección explícita y el listado no vive en el controlador',()=>{const issue=read('src/modules/invoicing/application/issue-invoice.js'),list=read('src/modules/invoicing/application/list-invoices.js'),controller=read('src/modules/invoicing/invoices.controller.js');assert.match(issue,/createIssueInvoice/);assert.match(list,/createListInvoices/);assert.match(controller,/listInvoices\.execute/);assert.doesNotMatch(controller,/repository\.list/);});

test('Facturación centraliza implementaciones en un punto de composición',()=>{const issue=read('src/modules/invoicing/application/issue-invoice.js'),composition=read('src/modules/invoicing/invoicing.composition.js');assert.doesNotMatch(issue,/hka-client|invoice\.repository|config\/database/);assert.match(composition,/createIssueInvoice/);assert.match(composition,/createInvoicesController/);});

test('Clientes inicia la migración vertical sin SQL en rutas o controlador',()=>{const route=read('src/modules/clients/clients.routes.js'),controller=read('src/modules/clients/clients.controller.js'),repository=read('src/modules/clients/infrastructure/client.repository.js');assert.doesNotMatch(route,/pool\.(query|execute)/);assert.doesNotMatch(controller,/pool\.(query|execute)/);assert.match(repository,/FROM clients WHERE company_id=\?/);});

test('Clientes está completamente migrado y no recupera el adaptador legado',()=>{assert.equal(fs.existsSync(path.join(root,'src/routes/clients-legacy.js')),false);const route=read('src/modules/clients/clients.routes.js'),application=read('src/modules/clients/application/client-import.js');assert.match(route,/\/custom-fields/);assert.match(route,/\/import\/zoho/);assert.doesNotMatch(application,/\breq\b|\bres\b|config\/database/);});
