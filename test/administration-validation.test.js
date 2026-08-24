const test=require('node:test');
const assert=require('node:assert/strict');
const {validateCompany,validateMembership}=require('../src/validation/administration');

test('normaliza una empresa válida',()=>{const result=validateCompany({legalName:'  CORE   Demo, S.A. ',tradeName:' CORE Demo ',ruc:'155-123',dv:'8'});assert.equal(result.value.legalName,'CORE Demo, S.A.');assert.equal(result.value.tradeName,'CORE Demo');assert.equal(result.value.ruc,'155-123');});
test('rechaza empresa sin razón social y DV inválido',()=>{const result=validateCompany({legalName:'A',dv:'ABC'});assert.ok(result.errors.length>=2);});
test('valida roles y estados de membresía',()=>{assert.equal(validateMembership({email:'USER@EXAMPLE.COM',role:'accountant',status:'active'}).value.email,'user@example.com');assert.ok(validateMembership({email:'bad',role:'owner',status:'deleted'}).errors.length>=3);});
