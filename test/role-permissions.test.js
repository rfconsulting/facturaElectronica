const test=require('node:test');
const assert=require('node:assert/strict');
const {requireRoles}=require('../src/middleware/security');

function evaluate(role,allowed,isSuperuser=false){let passed=false,response;const req={authUser:{role,is_superuser:isSuperuser}},res={status(code){response={code};return this;},json(body){response.body=body;return this;}};requireRoles(...allowed)(req,res,()=>{passed=true;});return{passed,response};}

test('contador puede ejecutar una acción financiera permitida',()=>{assert.equal(evaluate('accountant',['administrator','accountant']).passed,true);});
test('operador no puede aprobar ni registrar cobros',()=>{const result=evaluate('operator',['administrator','accountant']);assert.equal(result.passed,false);assert.equal(result.response.code,403);assert.equal(result.response.body.code,'INSUFFICIENT_ROLE');});
test('administrador y superusuario conservan acceso',()=>{assert.equal(evaluate('administrator',['administrator','accountant']).passed,true);assert.equal(evaluate('operator',[],true).passed,true);});
