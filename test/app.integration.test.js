const test=require('node:test');
const assert=require('node:assert/strict');
const session=require('express-session');
const {createApp}=require('../src/app');

class MemoryTestStore extends session.Store{get(_sid,callback){callback(null,null);}set(_sid,_value,callback){callback?.();}destroy(_sid,callback){callback?.();}}
test('createApp atiende HTTP sin ejecutar server.js',async()=>{const app=createApp({sessionStore:new MemoryTestStore(),pool:{query:async()=>[[]]}}),server=app.listen(0,'127.0.0.1');await new Promise((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject);});try{const response=await fetch(`http://127.0.0.1:${server.address().port}/api/health/live`);assert.equal(response.status,200);assert.deepEqual(await response.json(),{status:'ok'});}finally{await new Promise(resolve=>server.close(resolve));}});
