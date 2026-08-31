const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..'),targets=['src','scripts','public'];
function files(directory){return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{const full=path.join(directory,entry.name);return entry.isDirectory()?files(full):(entry.isFile()&&entry.name.endsWith('.js')?[full]:[]);});}
for(const file of targets.flatMap(target=>files(path.join(root,target)))){const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
console.log('Sintaxis válida.');
