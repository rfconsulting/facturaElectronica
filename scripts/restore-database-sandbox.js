const fs=require('node:fs/promises');
const crypto=require('node:crypto');
const mysql=require('mysql2/promise');
const env=require('../src/config/env');
async function restoreTest(backupFile,target){
 if(!new RegExp(`^${env.db.database.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}_restore_test$`).test(target||''))throw new Error(`La base desechable debe llamarse ${env.db.database}_restore_test.`);
 const contents=await fs.readFile(backupFile,'utf8'),manifest=await fs.readFile(`${backupFile}.sha256`,'ascii'),expected=manifest.trim().split(/\s+/)[0],actual=crypto.createHash('sha256').update(contents).digest('hex');if(actual!==expected)throw new Error('El checksum SHA-256 no coincide.');
 const admin=await mysql.createConnection({host:env.db.host,port:env.db.port,user:env.db.user,password:env.db.password,multipleStatements:true});
 try{const [existing]=await admin.query('SELECT 1 FROM information_schema.SCHEMATA WHERE SCHEMA_NAME=?',[target]);if(existing.length)throw new Error('La base desechable ya existe; no se sobrescribirá.');await admin.query(`CREATE DATABASE \`${target}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);await admin.query(`USE \`${target}\`; ${contents}`);const [[tables]]=await admin.query('SELECT COUNT(*) total FROM information_schema.TABLES WHERE TABLE_SCHEMA=?',[target]);return{target,tables:Number(tables.total),sha256:actual};}catch(error){try{await admin.query(`DROP DATABASE IF EXISTS \`${target}\``);}catch{}throw error;}finally{await admin.end();}
}
if(require.main===module)restoreTest(process.argv[2],process.argv[3]).then(x=>console.log(JSON.stringify({event:'database_restore_test_completed',...x},null,2))).catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={restoreTest};
