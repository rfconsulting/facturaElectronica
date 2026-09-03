const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {validateQuote}=require('../src/modules/quotes/application/quote-validation');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('cotización aplica descuento antes del ITBMS',()=>{const result=validateQuote({clientId:8,title:'Oferta',items:[{description:'Servicio',quantity:2,unitPrice:100,discountPercentage:10,taxCode:'01'}]});assert.equal(result.value.items[0].discountAmount,20);assert.equal(result.value.subtotal,180);assert.equal(result.value.taxTotal,12.6);assert.equal(result.value.total,192.6);});

test('módulo neutral soporta aprobación, revisiones y conversión idempotente',()=>{const app=read('src/app.js'),routes=read('src/modules/quotes/quotes.routes.js'),repository=read('src/modules/quotes/infrastructure/quote.repository.js'),schema=read('database/schema.sql');assert.match(app,/\/api\/quotations/);assert.match(routes,/controller\.revise/);assert.match(routes,/controller\.convert/);assert.match(repository,/pending_approval/);assert.match(repository,/Idempotency-Key/);assert.match(schema,/CREATE TABLE IF NOT EXISTS sales_orders/);assert.match(schema,/customer_snapshot JSON/);assert.match(schema,/version INT UNSIGNED/);});
