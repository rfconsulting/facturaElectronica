const pool = require('../config/database');

module.exports = async function audit(req, action, targetType, targetId) {
  await pool.execute(
    'INSERT INTO audit_log (actor_user_id,company_id,action,target_type,target_id,ip_address) VALUES (?,?,?,?,?,?)',
    [req.session?.user?.id || null, req.company?.id || req.session?.user?.companyId || null, action, targetType || null, targetId || null, req.ip || null]
  );
};
