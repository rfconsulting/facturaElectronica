const express = require('express');
const pool = require('../config/database');
const { requireAuth, requireMfa, requireAdministrator, requireRecentMfa, verifyCsrf } = require('../middleware/security');
const { validateHkaConfiguration } = require('../validation/configuration');
const { getHkaStatus, getHkaConfiguration, saveHkaConfiguration } = require('../services/configuration');
const hka = require('../services/hka-client');
const safeAudit = require('../services/safe-audit');

const router = express.Router();
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('Pragma', 'no-cache'); next(); });
router.use(requireAuth, requireMfa, requireAdministrator);

router.get('/fiscal-api', async (req, res, next) => {
  try { return res.json(await getHkaStatus(req.company.id)); } catch (error) { return next(error); }
});

router.put('/fiscal-api', requireRecentMfa, verifyCsrf, async (req, res, next) => {
  try {
    const validation = validateHkaConfiguration(req.body);
    if (validation.errors) return res.status(422).json({ error: 'Revisa la configuración fiscal.', details: validation.errors });
    await saveHkaConfiguration(req.company.id, req.authUser.id, validation.value);
    hka.clearCache(req.company.id);
    await safeAudit(req, 'fiscal_api_config_replaced', 'configuration', null);
    const status = await getHkaStatus(req.company.id);
    return res.json({ success: true, configured: status.configured, environment: status.environment, updatedAt: status.updatedAt });
  } catch (error) {
    if (error.code === 'CONFIG_MASTER_KEY_MISSING') return res.status(503).json({ error: 'El servidor no tiene configurada la clave maestra necesaria para cifrar credenciales.', code: error.code });
    return next(error);
  }
});

router.post('/fiscal-api/test', requireRecentMfa, verifyCsrf, async (req, res, next) => {
  try {
    const config = await getHkaConfiguration(req.company.id);
    if (!config.configured) return res.status(409).json({ error: 'Las credenciales HKA aún no están configuradas.' });
    const result = await hka.testCredentials(config);
    await safeAudit(req, 'fiscal_api_connection_tested', 'configuration', null);
    return res.json(result);
  } catch (error) {
    await safeAudit(req, 'fiscal_api_connection_test_failed', 'configuration', null);
    return res.status(422).json({ error: error.message });
  }
});

router.get('/correlatives',async(req,res,next)=>{try{const [sequences]=await pool.execute(`SELECT branch_code AS branchCode,billing_point AS billingPoint,document_type AS documentType,next_number AS nextNumber,updated_at AS updatedAt FROM invoice_sequences WHERE company_id=? ORDER BY branch_code,billing_point,document_type`,[req.company.id]);const [assignments]=await pool.execute(`SELECT a.user_id AS userId,u.full_name AS fullName,u.email,a.branch_code AS branchCode,a.billing_point AS billingPoint,a.updated_at AS updatedAt FROM user_billing_assignments a JOIN users u ON u.id=a.user_id WHERE a.company_id=? ORDER BY u.full_name`,[req.company.id]);const [users]=await pool.execute(`SELECT u.id,u.full_name AS fullName,u.email FROM company_memberships m JOIN users u ON u.id=m.user_id WHERE m.company_id=? AND m.status='active' AND u.status='active' ORDER BY u.full_name`,[req.company.id]);return res.json({sequences,assignments,users});}catch(error){return next(error);}});

router.put('/correlatives/sequence',requireRecentMfa,verifyCsrf,async(req,res,next)=>{const branchCode=String(req.body.branchCode||'').trim(),billingPoint=String(req.body.billingPoint||'').trim(),documentType=String(req.body.documentType||'').trim(),nextNumber=Number(req.body.nextNumber);if(!/^[A-Za-z0-9]{4}$/.test(branchCode)||!/^[0-9]{3}$/.test(billingPoint)||billingPoint==='000'||!/^[0-9]{2}$/.test(documentType)||!Number.isSafeInteger(nextNumber)||nextNumber<1||nextNumber>9999999999)return res.status(422).json({error:'Revisa sucursal, punto, tipo de documento y próximo correlativo.'});try{const [[used]]=await pool.execute(`SELECT MAX(CAST(fiscal_number AS UNSIGNED)) AS maximum FROM electronic_invoices WHERE company_id=? AND branch_code=? AND billing_point=? AND document_type=?`,[req.company.id,branchCode,billingPoint,documentType]);if(used.maximum!==null&&nextNumber<=Number(used.maximum))return res.status(409).json({error:`El próximo correlativo debe ser mayor que ${used.maximum}, ya reservado localmente.`});await pool.execute(`INSERT INTO invoice_sequences (company_id,branch_code,billing_point,document_type,next_number) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE next_number=VALUES(next_number)`,[req.company.id,branchCode,billingPoint,documentType,nextNumber]);await safeAudit(req,'invoice_sequence_configured','invoice_sequence',null);return res.json({success:true});}catch(error){return next(error);}});

router.put('/correlatives/assignment',requireRecentMfa,verifyCsrf,async(req,res,next)=>{const userId=Number(req.body.userId),branchCode=String(req.body.branchCode||'').trim(),billingPoint=String(req.body.billingPoint||'').trim();if(!Number.isSafeInteger(userId)||userId<1||!/^[A-Za-z0-9]{4}$/.test(branchCode)||!/^[0-9]{3}$/.test(billingPoint)||billingPoint==='000')return res.status(422).json({error:'Revisa usuario, sucursal y punto de facturación.'});try{const [membership]=await pool.execute(`SELECT 1 FROM company_memberships WHERE company_id=? AND user_id=? AND status='active' LIMIT 1`,[req.company.id,userId]);if(!membership[0])return res.status(404).json({error:'El usuario no pertenece a la empresa activa.'});await pool.execute(`INSERT INTO user_billing_assignments (company_id,user_id,branch_code,billing_point,updated_by) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE branch_code=VALUES(branch_code),billing_point=VALUES(billing_point),updated_by=VALUES(updated_by)`,[req.company.id,userId,branchCode,billingPoint,req.authUser.id]);await safeAudit(req,'billing_point_assigned','user',userId);return res.json({success:true});}catch(error){return next(error);}});

module.exports = router;
