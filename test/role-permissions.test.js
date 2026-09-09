const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {requireRoles}=require('../src/middleware/security');

function evaluate(role,allowed,isSuperuser=false){let passed=false,response;const req={authUser:{role,is_superuser:isSuperuser}},res={status(code){response={code};return this;},json(body){response.body=body;return this;}};requireRoles(...allowed)(req,res,()=>{passed=true;});return{passed,response};}

test('contador puede ejecutar una acción financiera permitida',()=>{assert.equal(evaluate('accountant',['administrator','accountant']).passed,true);});
test('operador no puede aprobar ni registrar cobros',()=>{const result=evaluate('operator',['administrator','accountant']);assert.equal(result.passed,false);assert.equal(result.response.code,403);assert.equal(result.response.body.code,'INSUFFICIENT_ROLE');});
test('administrador y superusuario conservan acceso',()=>{assert.equal(evaluate('administrator',['administrator','accountant']).passed,true);assert.equal(evaluate('operator',[],true).passed,true);});
test('la interfaz muestra importaciones a administradores y superusuarios',()=>{const dashboard=fs.readFileSync(path.join(__dirname,'..','public','dashboard.js'),'utf8'),html=fs.readFileSync(path.join(__dirname,'..','public','dashboard.html'),'utf8');assert.match(dashboard,/role==='administrator'\|\|Boolean\(session\.user\.isSuperuser\)/);for(const id of ['import-hka-clients','import-clients','import-articles'])assert.match(html,new RegExp(`id="${id}"`));});
