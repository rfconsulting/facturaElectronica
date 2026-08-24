const test = require('node:test');
const assert = require('node:assert/strict');
process.env.SESSION_SECRET ||= 'test-session-secret-with-at-least-sixty-four-characters-1234567890';
process.env.CONFIG_MASTER_KEY ||= '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.DB_HOST ||= '127.0.0.1'; process.env.DB_NAME ||= 'test'; process.env.DB_USER ||= 'test'; process.env.DB_PASSWORD ||= 'test';
const { encryptSecret, decryptSecret } = require('../src/services/secret-crypto');
test('cifra secretos de configuración con contexto autenticado', () => { const encrypted = encryptSecret('credencial', 'hka.password:v1'); assert.notEqual(encrypted, 'credencial'); assert.equal(decryptSecret(encrypted, 'hka.password:v1'), 'credencial'); assert.throws(() => decryptSecret(encrypted, 'hka.username:v1')); });
