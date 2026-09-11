const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const { RELATIONS, inspectTenantIntegrity, assertTenantIntegrity } = require('../scripts/preflight-tenant-integrity');

test('R5 protege relaciones comerciales con claves foráneas compuestas',()=>{
  const schema=read('database/schema.sql');
  assert.match(schema,/FOREIGN KEY \(company_id,customer_id\) REFERENCES clients\(company_id,id\)/);
  assert.match(schema,/FOREIGN KEY \(company_id,source_quote_id\) REFERENCES crm_quotes\(company_id,id\)/);
  assert.match(schema,/FOREIGN KEY \(company_id,invoice_id\) REFERENCES electronic_invoices\(company_id,id\)/);
  assert.match(schema,/FOREIGN KEY \(company_id,receivable_id\) REFERENCES accounts_receivable\(company_id,id\)/);
  assert.equal(RELATIONS.length,31);
});

test('preflight informa referencias cruzadas y bloquea la migración',async()=>{
  let calls=0;
  const connection={query:async()=>[[{total:++calls===3?2:0}]]};
  const violations=await inspectTenantIntegrity(connection);
  assert.equal(violations.length,1);
  assert.equal(violations[0].total,2);
  await assert.rejects(()=>assertTenantIntegrity({query:async()=>[[{total:1}]]}),error=>error.code==='TENANT_INTEGRITY_VIOLATIONS');
});

test('sesiones y cambio de empresa conservan el tenant original',()=>{
  const security=read('src/middleware/security.js');
  const auth=read('src/routes/auth.js');
  assert.match(security,/TENANT_SCOPE_MISMATCH/);
  assert.match(auth,/c\.tenant_id=\?/);
  assert.match(auth,/req\.company\.tenantId/);
});

test('lecturas de hijos sin company_id se anclan al padre de la empresa',()=>{
  assert.match(read('src/modules/clients/infrastructure/client.repository.js'),/definition\.company_id=client\.company_id/);
  assert.match(read('src/modules/quotations/infrastructure/legacy-crm-quotes.repository.js'),/q\.company_id=\?/);
});
