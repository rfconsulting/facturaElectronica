const hka = require('./hka-client');
const ebi = require('./ebi-client');
const { getFiscalConfiguration } = require('./configuration');

const providers = Object.freeze({ hka, ebi });
function resolve(code) { const provider = providers[code]; if (!provider) throw new Error(`Proveedor fiscal no soportado: ${code}.`); return provider; }
async function selected(companyId, explicit) { return explicit || (await getFiscalConfiguration(companyId)).provider; }

module.exports = {
  send: async (companyId, document, providerCode) => resolve(await selected(companyId, providerCode)).send(companyId, document),
  status: async (companyId, query, providerCode) => resolve(await selected(companyId, providerCode)).status(companyId, query),
  testCredentials: config => resolve(config.provider).testCredentials(config),
  clearCache: companyId => Object.values(providers).forEach(provider => provider.clearCache?.(companyId))
};
