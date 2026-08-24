const express = require('express');
const { requireAuth, requireMfa, requireAdministrator, requireRecentMfa, verifyCsrf } = require('../middleware/security');
const { validateHkaConfiguration } = require('../validation/configuration');
const { getHkaStatus, getHkaConfiguration, saveHkaConfiguration } = require('../services/configuration');
const hka = require('../services/hka-client');
const audit = require('../services/audit');

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
    await audit(req, 'fiscal_api_config_replaced', 'configuration', null);
    const status = await getHkaStatus(req.company.id);
    return res.json({ success: true, configured: status.configured, environment: status.environment, updatedAt: status.updatedAt });
  } catch (error) { return next(error); }
});

router.post('/fiscal-api/test', requireRecentMfa, verifyCsrf, async (req, res, next) => {
  try {
    const config = await getHkaConfiguration(req.company.id);
    if (!config.configured) return res.status(409).json({ error: 'Las credenciales HKA aún no están configuradas.' });
    const result = await hka.testCredentials(config);
    await audit(req, 'fiscal_api_connection_tested', 'configuration', null);
    return res.json(result);
  } catch (error) {
    await audit(req, 'fiscal_api_connection_test_failed', 'configuration', null).catch(() => {});
    return res.status(422).json({ error: error.message });
  }
});

module.exports = router;
