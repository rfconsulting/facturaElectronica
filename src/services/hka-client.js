const { getHkaConfiguration, baseUrl } = require('./configuration');

const tokenCache = new Map();

async function call(config, path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(`${config.baseUrl}/${path}`, { ...options, signal: controller.signal, headers: { accept: 'application/json', ...(options.body ? { 'content-type': 'application/json' } : {}), ...options.headers } });
    const raw = await response.text();
    let data;
    try { data = raw ? JSON.parse(raw) : {}; }
    catch { throw new Error(`The Factory HKA respondió contenido no válido (HTTP ${response.status}).`); }
    if (!response.ok) { const error = new Error(data.mensaje || `The Factory HKA respondió HTTP ${response.status}.`); error.status = response.status; error.providerResponse = data; throw error; }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') { const timeoutError = new Error('The Factory HKA no respondió dentro del tiempo esperado.'); timeoutError.uncertain = true; throw timeoutError; }
    throw error;
  } finally { clearTimeout(timeout); }
}

function clearCache(companyId) { if (companyId) tokenCache.delete(Number(companyId)); else tokenCache.clear(); }

async function authenticate(companyId, config) {
  if (!config.username || !config.password) throw new Error('La integración HKA no tiene credenciales configuradas.');
  const identity = `${config.environment}:${config.username}`;
  const cached = tokenCache.get(Number(companyId));
  if (cached?.token && cached.identity === identity && Date.now() < cached.expiresAt - 60000) return cached.token;
  const response = await call(config, 'Autenticacion', { method: 'POST', body: JSON.stringify({ usuario: config.username, clave: config.password }) });
  if (!response.token) throw new Error(response.mensaje || 'HKA no retornó un JWT.');
  const expiration = Date.parse(response.expiracion || '');
  tokenCache.set(Number(companyId), { token: response.token, identity, expiresAt: Number.isFinite(expiration) ? expiration : Date.now() + 10 * 60 * 1000 });
  return response.token;
}

async function authenticated(companyId, path, method = 'POST', body) {
  const config = await getHkaConfiguration(companyId);
  let jwt = await authenticate(companyId, config);
  try { return await call(config, path, { method, body: body ? JSON.stringify(body) : undefined, headers: { authorization: `Bearer ${jwt}` } }); }
  catch (error) {
    if (error.status !== 401) throw error;
    clearCache(companyId);
    jwt = await authenticate(companyId, config);
    return call(config, path, { method, body: body ? JSON.stringify(body) : undefined, headers: { authorization: `Bearer ${jwt}` } });
  }
}

async function testCredentials(value) {
  const config = { ...value, baseUrl: baseUrl(value.environment) };
  const response = await call(config, 'Autenticacion', { method: 'POST', body: JSON.stringify({ usuario: value.username, clave: value.password }) });
  if (!response.token) throw new Error(response.mensaje || 'HKA no retornó un JWT.');
  return { success: true, message: response.mensaje || 'Conexión autenticada correctamente.', expiration: response.expiracion || null };
}

module.exports = {
  send: (companyId, document) => authenticated(companyId, 'Enviar', 'POST', { documento: document }),
  status: (companyId, query) => authenticated(companyId, 'EstadoDocumento', 'POST', query),
  remainingFolios: (companyId) => authenticated(companyId, 'FoliosRestantes', 'GET'),
  testCredentials,
  clearCache
};
