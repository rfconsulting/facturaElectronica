const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {eventEnvelope,enqueueEvent}=require('../src/services/integration-outbox');
const {createOutboxDispatcher}=require('../src/modules/integration/application/outbox-dispatcher');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('crea un envelope versionado con empresa e identidad estable',()=>{
  const event=eventEnvelope({eventType:'OrderConfirmed',companyId:7,aggregateType:'sales_order',aggregateId:12,payload:{quotationId:2}});
  assert.match(event.eventId,/^[0-9a-f-]{36}$/i);
  assert.equal(event.eventVersion,1);
  assert.equal(event.companyId,7);
  assert.deepEqual(event.payload,{quotationId:2});
});

test('rechaza envelopes sin empresa o agregado válidos',()=>{
  assert.throws(()=>eventEnvelope({eventType:'Bad',companyId:0,aggregateType:'x',aggregateId:1}),/contrato requerido/);
  assert.throws(()=>eventEnvelope({eventType:'Bad',companyId:1,aggregateType:'x',aggregateId:0}),/contrato requerido/);
});

test('encola el envelope usando la transacción recibida',async()=>{
  let statement,parameters;
  const connection={execute:async(sql,args)=>{statement=sql;parameters=args;}};
  const event=await enqueueEvent(connection,{eventId:'11111111-1111-4111-8111-111111111111',eventType:'PaymentRegistered',companyId:4,aggregateType:'receivable_payment',aggregateId:9,payload:{amount:5}});
  assert.match(statement,/INSERT INTO integration_outbox/);
  assert.equal(parameters[0],event.eventId);
  assert.equal(parameters[1],4);
  assert.equal(JSON.parse(parameters[8]).amount,5);
});

test('dispatcher entrega con consumidor comodín y marca el evento',async()=>{
  const calls=[],event={id:1,eventId:'e-1',eventType:'OrderConfirmed',companyId:2,attempts:1};
  const repository={claim:async()=>[event],consumeOnce:async input=>{calls.push(input.consumerName);await input.handler({},event);},markDelivered:async()=>calls.push('delivered'),markRetry:async()=>{},markDeadLetter:async()=>{}};
  const dispatcher=createOutboxDispatcher({repository,workerId:'worker-test',consumers:{'*':[{name:'journal',handle:async()=>calls.push('handled')}]}});
  assert.deepEqual(await dispatcher.runOnce(),{claimed:1,delivered:1,retried:0,deadLettered:0});
  assert.deepEqual(calls,['journal','handled','delivered']);
});

test('dispatcher reintenta y envía a dead letter al alcanzar el límite',async()=>{
  const outcomes=[];
  const repository={claim:async()=>[{id:1,eventId:'e-1',eventType:'X',companyId:2,attempts:2},{id:2,eventId:'e-2',eventType:'X',companyId:2,attempts:3}],consumeOnce:async()=>{throw new Error('fallo controlado');},markDelivered:async()=>{},markRetry:async input=>outcomes.push(['retry',input.id,input.delaySeconds]),markDeadLetter:async input=>outcomes.push(['dead',input.id])};
  const dispatcher=createOutboxDispatcher({repository,maxAttempts:3,consumers:{'*':[{name:'failing',handle:async()=>{}}]}});
  assert.deepEqual(await dispatcher.runOnce(),{claimed:2,delivered:0,retried:1,deadLettered:1});
  assert.deepEqual(outcomes,[['retry',1,10],['dead',2]]);
});

test('schema y productores incluyen deduplicación, locks y eventos de dominio',()=>{
  const schema=read('database/schema.sql'),repository=read('src/modules/integration/infrastructure/outbox.repository.js'),quotes=read('src/modules/quotations/infrastructure/legacy-crm-quotes.repository.js'),invoices=read('src/modules/invoicing/infrastructure/invoice.repository.js'),crm=read('src/routes/crm-evolution.js');
  assert.match(schema,/CREATE TABLE IF NOT EXISTS integration_event_receipts/);
  for(const field of ['event_id','event_version','correlation_id','causation_id','locked_at','locked_by','dead_letter'])assert.match(schema,new RegExp(field));
  assert.match(repository,/FOR UPDATE SKIP LOCKED/);
  assert.match(repository,/ER_DUP_ENTRY/);
  for(const event of ['QuotationAccepted','OrderConfirmed'])assert.match(quotes,new RegExp(event));
  for(const event of ['InvoiceAuthorized','ReceivableCreated'])assert.match(invoices,new RegExp(event));
  for(const event of ['PaymentRegistered','ReceivableSettled'])assert.match(crm,new RegExp(event));
});
