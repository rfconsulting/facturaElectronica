const test=require('node:test');
const assert=require('node:assert/strict');
const {createClientUseCases}=require('../src/modules/clients/application/clients');

test('lista clientes normalizando filtros sin depender de Express',async()=>{let received;const clients=createClientUseCases({repository:{list:async(companyId,filters)=>{received={companyId,filters};return[{id:1}];}}}),result=await clients.list({companyId:4,search:'  Acme  ',status:'desconocido'});assert.deepEqual(result,{clients:[{id:1}]});assert.deepEqual(received,{companyId:4,filters:{search:'Acme',status:'active'}});});

test('valida y crea un cliente mediante repositorio y auditoría inyectados',async()=>{let saved,audited;const clients=createClientUseCases({repository:{save:async input=>{saved=input;return 12;}},audit:async context=>{audited=context;}}),result=await clients.save({companyId:2,userId:7,input:{customerType:'02',legalName:'Cliente Demo'},auditContext:{requestId:'req-1'}});assert.deepEqual(result,{id:12,created:true});assert.equal(saved.companyId,2);assert.equal(saved.client.legalName,'Cliente Demo');assert.equal(audited.actorUserId,7);assert.equal(audited.requestId,'req-1');});
