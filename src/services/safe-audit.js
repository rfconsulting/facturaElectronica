const audit = require('./audit');

async function safeAudit(req, action, targetType, targetId, dependencies = {}) {
  const writeAudit = dependencies.writeAudit || audit;
  const logError = dependencies.logError || console.error;

  try {
    await writeAudit(req, action, targetType, targetId);
    return true;
  } catch (error) {
    logError(JSON.stringify({
      event: 'audit_write_failed',
      requestId: req.requestId,
      action,
      targetType,
      targetId,
      error: error.message
    }));
    return false;
  }
}

module.exports = safeAudit;
