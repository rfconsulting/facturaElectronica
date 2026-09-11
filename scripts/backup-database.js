const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const mysql=require('mysql2');
const mysqlPromise=require('mysql2/promise');
const env=require('../src/config/env');
const sqlValue=value=>mysql.escape(value&&typeof value==='object'&&!Buffer.isBuffer(value)?JSON.stringify(value):value);

async function backupDatabase(destination){
  const directory=path.resolve(destination||'.artifacts/backups');await fs.mkdir(directory,{recursive:true});
  const connection=await mysqlPromise.createConnection({...env.db,dateStrings:true});
  try{
    const [tables]=await connection.query('SELECT TABLE_NAME name FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE="BASE TABLE" ORDER BY TABLE_NAME',[env.db.database]);
    const chunks=['SET FOREIGN_KEY_CHECKS=0;','SET NAMES utf8mb4;'];
    for(const {name} of tables){const [[definition]]=await connection.query(`SHOW CREATE TABLE \`${name}\``);chunks.push(`DROP TABLE IF EXISTS \`${name}\`;`,`${definition['Create Table']};`);let offset=0;while(true){const [rows]=await connection.query(`SELECT * FROM \`${name}\` LIMIT 500 OFFSET ${offset}`);if(!rows.length)break;const columns=Object.keys(rows[0]).map(x=>`\`${x}\``).join(',');for(const row of rows)chunks.push(`INSERT INTO \`${name}\` (${columns}) VALUES (${Object.values(row).map(sqlValue).join(',')});`);offset+=rows.length;}}
    chunks.push('SET FOREIGN_KEY_CHECKS=1;');const contents=`${chunks.join('\n')}\n`,stamp=new Date().toISOString().replace(/[:.]/g,'-'),file=path.join(directory,`${env.db.database}-${stamp}.sql`);await fs.writeFile(file,contents,{encoding:'utf8',flag:'wx'});const hash=crypto.createHash('sha256').update(contents).digest('hex');await fs.writeFile(`${file}.sha256`,`${hash}  ${path.basename(file)}\n`,{encoding:'ascii',flag:'wx'});return{file,sha256:hash,tables:tables.length,bytes:Buffer.byteLength(contents)};
  }finally{await connection.end();}
}
if(require.main===module)backupDatabase(process.argv[2]).then(x=>console.log(JSON.stringify({event:'database_backup_completed',...x},null,2))).catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={backupDatabase,sqlValue};
