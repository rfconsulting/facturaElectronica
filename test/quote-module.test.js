const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {validateQuote}=require('../src/modules/quotes/application/quote-validation');

test('cotización recalcula múltiples renglones e ITBMS en servidor',()=>{const result=validateQuote({clientId:8,title:'Implementación',currency:'usd',items:[{description:'Servicio',quantity:2,unitPrice:100,taxCode:'01'},{description:'Producto',quantity:1,unitPrice:50,taxCode:'00'}]});assert.equal(result.errors,undefined);assert.equal(result.value.currency,'USD');assert.equal(result.value.subtotal,250);assert.equal(result.value.taxTotal,14);assert.equal(result.value.total,264);});

test('cotización rechaza cliente, renglones e importes inválidos',()=>{const result=validateQuote({title:'X',items:[{description:'',quantity:0,unitPrice:-1,taxCode:'99'}]});assert.ok(result.errors.length>=5);});

test('cotizaciones tienen módulo vertical, historial y transiciones controladas',()=>{const root=path.join(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8'),routes=read('src/modules/quotes/quotes.routes.js'),repository=read('src/modules/quotes/infrastructure/quote.repository.js'),schema=read('database/schema.sql');assert.match(routes,/controller\.transition/);assert.match(routes,/controller\.duplicate/);assert.match(repository,/Solo las cotizaciones en borrador pueden editarse/);assert.match(repository,/allowed=\{draft:/);assert.match(schema,/CREATE TABLE IF NOT EXISTS crm_quote_status_history/);});
