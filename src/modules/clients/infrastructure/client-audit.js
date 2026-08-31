const pool=require('../../../config/database');
async function write(context){await pool.execute('INSERT INTO audit_log (actor_user_id,company_id,action,target_type,target_id,ip_address) VALUES (?,?,?,?,?,?)',[context.actorUserId||null,context.companyId||null,context.action,context.targetType||null,context.targetId||null,context.ipAddress||null]);}
module.exports={write};
