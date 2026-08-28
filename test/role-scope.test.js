const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');

test('el superusuario es una capacidad global creada solo por consola',()=>{
  assert.match(read('database/schema.sql'),/is_superuser BOOLEAN NOT NULL DEFAULT FALSE/);
  assert.match(read('scripts/create-admin.js'),/is_superuser,status[\s\S]*TRUE,'active'/);
  assert.doesNotMatch(read('src/routes/users.js'),/UPDATE users SET is_superuser/);
});

test('las membresías soportan administradores en varias empresas',()=>{
  assert.match(read('database/schema.sql'),/PRIMARY KEY \(company_id,user_id\)/);
  assert.match(read('src/routes/administration.js'),/Solo el superusuario puede asignar administradores de empresa/);
  assert.match(read('src/routes/administration.js'),/Solo el superusuario puede modificar administradores de empresa/);
});
