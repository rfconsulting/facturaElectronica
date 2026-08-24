const crypto = require('node:crypto');
const env = require('../config/env');

const key = env.configMasterKey ? Buffer.from(env.configMasterKey, 'hex') : null;
function requireKey() {
  if (!key) {
    const error = new Error('CONFIG_MASTER_KEY no está configurada. Define una clave independiente antes de guardar secretos.');
    error.code = 'CONFIG_MASTER_KEY_MISSING';
    throw error;
  }
  return key;
}

function encryptSecret(secret, context) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', requireKey(), iv);
  cipher.setAAD(Buffer.from(String(context), 'utf8'));
  const encrypted = Buffer.concat([cipher.update(String(secret), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
}

function decryptSecret(payload, context) {
  const parts = String(payload).split('.');
  if (parts.length !== 3) throw new Error('El secreto cifrado tiene un formato inválido.');
  const [iv, tag, encrypted] = parts.map((part) => Buffer.from(part, 'base64url'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', requireKey(), iv);
  decipher.setAAD(Buffer.from(String(context), 'utf8'));
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

module.exports = { encryptSecret, decryptSecret };
