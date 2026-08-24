const test = require('node:test');
const assert = require('node:assert/strict');
const { MAX_MFA_FAILURES, MFA_BLOCK_MS, resetMfaAttempts, mfaChallengeAvailable, recordMfaFailure } = require('../src/services/mfa-attempts');
test('limita MFA durante diez minutos después de cinco fallos', () => { const session = {}; for (let attempt = 0; attempt < MAX_MFA_FAILURES; attempt += 1) recordMfaFailure(session, 7, 1000); assert.equal(mfaChallengeAvailable(session, 7, 1001), false); assert.equal(mfaChallengeAvailable(session, 7, 1000 + MFA_BLOCK_MS), true); });
test('reinicia intentos tras una verificación correcta', () => { const session = {}; recordMfaFailure(session, 7); resetMfaAttempts(session); assert.equal(mfaChallengeAvailable(session, 7), true); assert.equal(session.mfaAttemptCount, undefined); });
