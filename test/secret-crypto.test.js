const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
process.env.SESSION_SECRET ||= 'test-session-secret-with-at-least-sixty-four-characters-1234567890';
process.env.CONFIG_MASTER_KEY ||= '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.DB_HOST ||= '127.0.0.1'; process.env.DB_NAME ||= 'test'; process.env.DB_USER ||= 'test'; process.env.DB_PASSWORD ||= 'test';
const { encryptSecret, decryptSecret } = require('../src/services/secret-crypto');
test('cifra secretos de configuración con contexto autenticado', () => { const encrypted = encryptSecret('credencial', 'hka.password:v1'); assert.notEqual(encrypted, 'credencial'); assert.equal(decryptSecret(encrypted, 'hka.password:v1'), 'credencial'); assert.throws(() => decryptSecret(encrypted, 'hka.username:v1')); });
test('identifica explícitamente la ausencia de la clave maestra', () => { const result = spawnSync(process.execPath, ['-e', "const service=require('./src/services/secret-crypto'); try { service.encryptSecret('x','test:v1'); } catch (error) { process.stdout.write(error.code || ''); }"], { cwd: require('node:path').join(__dirname, '..'), env: { ...process.env, CONFIG_MASTER_KEY: '' }, encoding: 'utf8' }); assert.equal(result.status, 0); assert.match(result.stdout, /CONFIG_MASTER_KEY_MISSING$/); });
