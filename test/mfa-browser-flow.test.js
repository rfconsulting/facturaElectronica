const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('un código MFA incorrecto no se interpreta como sesión vencida', () => {
  const client = read('public/mfa.js');
  const route = read('src/routes/auth.js');
  assert.match(route, /code: attempt\.limited \? 'MFA_RATE_LIMITED' : 'MFA_INVALID'/);
  assert.match(client, /response\.status === 401 && data\.code === 'AUTH_REQUIRED'/);
  assert.doesNotMatch(client, /if \(response\.status === 401\) \{/);
});

test('requireAuth identifica explícitamente las sesiones vencidas', () => {
  const middleware = read('src/middleware/security.js');
  assert.ok((middleware.match(/code: 'AUTH_REQUIRED'/g) || []).length >= 3);
});

test('el formulario conserva sus referencias después de esperar la respuesta', () => {
  const client = read('public/mfa.js');
  assert.match(client, /const form = event\.currentTarget/);
  assert.match(client, /const code = form\.elements\.code/);
  assert.doesNotMatch(client, /event\.currentTarget\.elements\.code\.select\(\)/);
});

test('un secreto cifrado con otra clave solicita enrolamiento en vez de responder 500', () => {
  const route = read('src/routes/auth.js');
  assert.match(route, /mfa_secret_decryption_failed/);
  assert.match(route, /status\(409\).*MFA_REENROLL_REQUIRED/);
});
