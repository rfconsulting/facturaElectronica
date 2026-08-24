const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeEmail, cleanName, validEmail, validPassword } = require('../src/validation/auth');
test('normaliza correo y nombre', () => { assert.equal(normalizeEmail(' Persona@Ejemplo.COM '), 'persona@ejemplo.com'); assert.equal(cleanName(' Ana   Pérez '), 'Ana Pérez'); });
test('valida correo', () => { assert.equal(validEmail('persona@example.com'), true); assert.equal(validEmail('sin-arroba'), false); });
test('aplica la política de contraseña', () => { assert.equal(validPassword('Segura-2026!Ab'), true); assert.equal(validPassword('corta1!A'), false); assert.equal(validPassword('SinSimbolo2026Ab'), false); });
