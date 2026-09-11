const test=require('node:test');
const assert=require('node:assert/strict');
const {sqlValue}=require('../scripts/backup-database');
test('respaldo serializa JSON como un valor y conserva buffers',()=>{assert.equal(sqlValue({documento:{id:1}}),'\'{\\\"documento\\\":{\\\"id\\\":1}}\'');assert.match(sqlValue(Buffer.from([1,2])),/^X'0102'$/);assert.equal(sqlValue(null),'NULL');});
