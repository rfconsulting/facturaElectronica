const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { routeManifest, composeCrmRouter, DuplicateRouteError, replacements } = require('../src/routes/crm-router');

test('CRM expone una sola implementación por método y ruta', () => {
  const signatures = routeManifest.map((route) => route.signature);
  assert.equal(new Set(signatures).size, signatures.length);
});

test('CRM conserva las capacidades canónicas y los adaptadores aún necesarios', () => {
  const routes = new Map(routeManifest.map((route) => [route.signature, route.source]));
  assert.equal(routes.get('POST /quotes'), 'quotations');
  assert.equal(routes.get('PUT /quotes/:id'), 'quotations');
  assert.equal(routes.get('POST /leads'), 'evolution');
  assert.equal(routes.get('GET /reports/sales'), 'advanced');
  assert.equal(routes.get('GET /dashboard'), 'legacy');
  assert.equal(routes.get('PUT /opportunities/:id'), 'advanced');
  assert.equal(routes.get('DELETE /opportunities/:id'), 'advanced');
});

test('una ruta duplicada no declarada bloquea la composición y muestra sus fuentes', () => {
  const first=express.Router(),second=express.Router();
  first.post('/quotes',(_req,_res)=>{});
  second.post('/quotes',(_req,_res)=>{});
  assert.throws(
    ()=>composeCrmRouter([{name:'first',prefix:'',router:first},{name:'second',prefix:'',router:second}],{}),
    error=>error instanceof DuplicateRouteError&&error.code==='DUPLICATE_ROUTE'&&error.message.includes('POST /quotes')&&error.message.includes('- first')&&error.message.includes('- second')
  );
});

test('una sustitución explícita conserva únicamente el handler canónico', () => {
  const canonical=express.Router(),legacy=express.Router();
  canonical.get('/resource',(_req,_res)=>{});
  legacy.get('/resource',(_req,_res)=>{});
  const result=composeCrmRouter(
    [{name:'canonical',prefix:'',router:canonical},{name:'legacy',prefix:'',router:legacy}],
    {'GET /resource':{canonical:'canonical',replaces:['legacy']}}
  );
  assert.deepEqual(result.routeManifest,[{signature:'GET /resource',source:'canonical'}]);
  assert.ok(replacements['POST /quotes'].replaces.includes('advanced'));
});
