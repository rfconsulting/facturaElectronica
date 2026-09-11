const express = require('express');
const quotationRoutes = require('../modules/quotations/quotations.routes');
const evolutionRoutes = require('./crm-evolution');
const advancedRoutes = require('./crm-advanced');
const legacyRoutes = require('./crm');
const {recordLegacyQuotationAlias}=require('../services/metrics');

const sources = [
  { name: 'quotations', prefix: '/quotes', router: quotationRoutes },
  { name: 'evolution', prefix: '', router: evolutionRoutes },
  { name: 'advanced', prefix: '', router: advancedRoutes },
  { name: 'legacy', prefix: '', router: legacyRoutes }
];

// Every intentional compatibility replacement is declared here. Any new
// collision is a startup error instead of an order-dependent selection.
const replacements = Object.freeze({
  'GET /quotes': { canonical: 'quotations', replaces: ['advanced'] },
  'POST /quotes': { canonical: 'quotations', replaces: ['advanced'] },
  'GET /quotes/:id/invoice-draft': { canonical: 'quotations', replaces: ['evolution'] },
  'PUT /quotes/:id': { canonical: 'quotations', replaces: ['evolution', 'advanced'] },
  'GET /leads': { canonical: 'evolution', replaces: ['legacy'] },
  'POST /leads': { canonical: 'evolution', replaces: ['advanced', 'legacy'] },
  'PUT /leads/:id': { canonical: 'evolution', replaces: ['advanced', 'legacy'] },
  'POST /leads/:id/convert': { canonical: 'evolution', replaces: ['advanced'] },
  'GET /opportunities': { canonical: 'evolution', replaces: ['legacy'] },
  'POST /opportunities': { canonical: 'evolution', replaces: ['advanced', 'legacy'] },
  'PUT /opportunities/:id/stage': { canonical: 'evolution', replaces: ['advanced', 'legacy'] },
  'POST /activities': { canonical: 'evolution', replaces: ['legacy'] },
  'POST /tasks': { canonical: 'evolution', replaces: ['legacy'] }
});

class DuplicateRouteError extends Error {
  constructor(signature, routeSources) {
    super(`Ruta duplicada detectada:\n${signature}\n${routeSources.map((source) => `- ${source}`).join('\n')}`);
    this.name = 'DuplicateRouteError';
    this.code = 'DUPLICATE_ROUTE';
    this.signature = signature;
    this.sources = routeSources;
  }
}

function normalizedPath(prefix, path) {
  const normalized = `${prefix}/${String(path).replace(/^\//, '')}`.replace(/\/+/g, '/').replace(/\/$/, '');
  return normalized || '/';
}

function inspectRoutes(routeSources) {
  const occurrences = new Map();
  for (const source of routeSources) {
    for (const layer of source.router.stack) {
      if (!layer.route) continue;
      const path = normalizedPath(source.prefix, layer.route.path);
      const methods = Object.keys(layer.route.methods).filter((method) => layer.route.methods[method]);
      for (const method of methods) {
        const signature = `${method.toUpperCase()} ${path}`;
        occurrences.set(signature, [...(occurrences.get(signature) || []), source.name]);
      }
    }
  }
  return occurrences;
}

function validateCollisions(occurrences, declaredReplacements) {
  for (const [signature, routeSources] of occurrences) {
    if (routeSources.length < 2) continue;
    const declaration = declaredReplacements[signature];
    const actual = new Set(routeSources);
    const declared = new Set(declaration ? [declaration.canonical, ...declaration.replaces] : []);
    const matches = declaration && actual.has(declaration.canonical) && actual.size === declared.size && [...actual].every((source) => declared.has(source));
    if (!matches) throw new DuplicateRouteError(signature, routeSources);
  }
}

function composeCrmRouter(routeSources = sources, declaredReplacements = replacements) {
  const occurrences = inspectRoutes(routeSources);
  validateCollisions(occurrences, declaredReplacements);
  const router = express.Router();
  const routeManifest = [];

  for (const source of routeSources) {
    const retainedLayers = [];
    for (const layer of source.router.stack) {
      if (!layer.route) {
        retainedLayers.push(layer);
        continue;
      }
      const path = normalizedPath(source.prefix, layer.route.path);
      const methods = Object.keys(layer.route.methods).filter((method) => layer.route.methods[method]);
      const signatures = methods.map((method) => `${method.toUpperCase()} ${path}`);
      const keep = signatures.every((signature) => !declaredReplacements[signature] || declaredReplacements[signature].canonical === source.name);
      if (!keep) continue;
      routeManifest.push(...signatures.map((signature) => ({ signature, source: source.name })));
      retainedLayers.push(layer);
    }
    source.router.stack = retainedLayers;
    if(source.name==='quotations'&&source.prefix==='/quotes')router.use(source.prefix,recordLegacyQuotationAlias,source.router);
    else router.use(source.prefix || '/', source.router);
  }

  return { router, routeManifest };
}

module.exports = { ...composeCrmRouter(), composeCrmRouter, DuplicateRouteError, replacements };
