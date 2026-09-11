const pool=require('../src/config/database');

async function cleanupImportJobs(connection=pool,{batchSize=500,completedRetentionDays=30}={}){
  const limit=Math.max(1,Math.min(5000,Number(batchSize)||500));
  const days=Math.max(1,Math.min(365,Number(completedRetentionDays)||30));
  const [expired]=await connection.query(`UPDATE import_jobs SET status='expired' WHERE status='previewed' AND expires_at<UTC_TIMESTAMP() LIMIT ${limit}`);
  const [removed]=await connection.query(`DELETE FROM import_jobs WHERE status IN ('expired','failed') AND updated_at<DATE_SUB(UTC_TIMESTAMP(),INTERVAL ${days} DAY) LIMIT ${limit}`);
  return{expired:Number(expired.affectedRows),removed:Number(removed.affectedRows),batchSize:limit,retentionDays:days};
}

if(require.main===module)cleanupImportJobs().then(result=>console.log(JSON.stringify({event:'import_jobs_cleanup',...result}))).catch(error=>{console.error(JSON.stringify({event:'import_jobs_cleanup_failed',error:error.message}));process.exitCode=1;}).finally(()=>pool.end());
module.exports={cleanupImportJobs};
