const express = require('express');
const quotationRoutes = require('../modules/quotations/quotations.routes');
const evolutionRoutes = require('./crm-evolution');
const advancedRoutes = require('./crm-advanced');
const legacyRoutes = require('./crm');

const sources = [
  { name: 'quotations', prefix: '/quotes', router: quotationRoutes },
  { name: 'evolution', prefix: '', router: evolutionRoutes },
  { name: 'advanced', prefix: '', router: advancedRoutes },
  { name: 'legacy', prefix: '', router: legacyRoutes }
];

function normalizedPath(prefix, path) {
  const normalized = `${prefix}/${String(path).replace(/^\//, '')}`.replace(/\/+/g, '/').replace(/\/$/, '');
  return normalized || '/';
}

function composeCrmRouter() {
  const router = express.Router();
  const seen = new Set();
  const routeManifest = [];

  for (const source of sources) {
    const retainedLayers = [];
    for (const layer of source.router.stack) {
      if (!layer.route) {
        retainedLayers.push(layer);
        continue;
      }

      const path = normalizedPath(source.prefix, layer.route.path);
      const methods = Object.keys(layer.route.methods).filter((method) => layer.route.methods[method]);
      const signatures = methods.map((method) => `${method.toUpperCase()} ${path}`);
      if (signatures.some((signature) => seen.has(signature))) continue;
      signatures.forEach((signature) => seen.add(signature));
      routeManifest.push(...signatures.map((signature) => ({ signature, source: source.name })));
      retainedLayers.push(layer);
    }
    source.router.stack = retainedLayers;
    router.use(source.prefix || '/', source.router);
  }

  return { router, routeManifest };
}

module.exports = composeCrmRouter();
