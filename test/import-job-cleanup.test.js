const test=require('node:test');
const assert=require('node:assert/strict');
const {cleanupImportJobs}=require('../scripts/cleanup-import-jobs');
test('purga jobs en lotes acotados sin tocar previews vigentes ni completados recientes',async()=>{const queries=[],connection={query:async sql=>{queries.push(sql);return[{affectedRows:queries.length}]}};const result=await cleanupImportJobs(connection,{batchSize:200,completedRetentionDays:45});assert.deepEqual(result,{expired:1,removed:2,batchSize:200,retentionDays:45});assert.match(queries[0],/status='previewed'.*expires_at<UTC_TIMESTAMP\(\).*LIMIT 200/);assert.match(queries[1],/status IN \('expired','failed'\).*INTERVAL 45 DAY.*LIMIT 200/);});
