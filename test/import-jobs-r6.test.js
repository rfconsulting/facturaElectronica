const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
test('R6 persiste jobs acotados por empresa, actor, hash y expiración',()=>{const schema=read('database/schema.sql');for(const token of ['CREATE TABLE IF NOT EXISTS import_jobs','company_id BIGINT UNSIGNED NOT NULL','created_by BIGINT UNSIGNED NOT NULL','file_hash CHAR(64)','rules_version VARCHAR(40)','mapping_version VARCHAR(40)','expires_at DATETIME NOT NULL','UNIQUE KEY uq_import_job_company_key'])assert.match(schema,new RegExp(token.replace(/[()]/g,'\\$&')));});
test('clientes y artículos exigen el job y comparan SHA-256 antes de confirmar',()=>{const clients=read('src/modules/clients/application/client-import.js')+read('src/modules/clients/infrastructure/client.repository.js'),articles=read('src/routes/articles.js');for(const source of [clients,articles]){assert.match(source,/sha256/);assert.match(source,/IMPORT_JOB_REQUIRED/);assert.match(source,/IMPORT_PREVIEW_CHANGED/);assert.match(source,/status='completed'/);}});
test('la interfaz conserva el importJobId devuelto por cada preview',()=>{const clients=read('public/js/modules/clients.js'),articles=read('public/js/modules/articles.js');assert.match(clients,/clientImportJobId=data\.importJobId/);assert.match(articles,/articleImportJobId=data\.importJobId/);});
