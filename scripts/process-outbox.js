const pool=require('../src/config/database');
const dispatcher=require('../src/modules/integration/integration.composition');

(async()=>{try{const batchSize=Math.max(1,Math.min(100,Number(process.argv[2])||25)),summary=await dispatcher.runOnce({batchSize});console.log(JSON.stringify({event:'outbox_batch_completed',...summary}));if(summary.deadLettered)process.exitCode=2;}catch(error){console.error(JSON.stringify({event:'outbox_batch_failed',error:String(error.message||error).slice(0,1000)}));process.exitCode=1;}finally{await pool.end();}})();
