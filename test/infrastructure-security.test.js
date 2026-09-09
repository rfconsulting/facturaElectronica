const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { singleMemoryFile } = require('../src/middleware/multipart');
const MySqlSessionStore = require('../src/services/mysql-session-store');

test('procesa un único archivo multipart en memoria con campos asociados', async () => {
  const app = express();
  app.post('/upload', singleMemoryFile('file', { fileSize: 1024 }), (req, res) => {
    res.json({ name: req.file.originalname, contents: req.file.buffer.toString(), confirm: req.body.confirm });
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  try {
    const form = new FormData();
    form.set('confirm', 'true');
    form.set('file', new Blob(['contenido']), 'clientes.csv');
    const response = await fetch(`http://127.0.0.1:${server.address().port}/upload`, { method: 'POST', body: form });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { name: 'clientes.csv', contents: 'contenido', confirm: 'true' });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('el almacén MySQL serializa, recupera, renueva y elimina sesiones', async () => {
  const calls = [];
  const pool = { execute: async (sql, params) => {
    calls.push({ sql, params });
    if (sql.startsWith('SELECT')) return [[{ data: '{"userId":7}' }]];
    return [{ affectedRows: 1 }];
  } };
  const store = new MySqlSessionStore(pool);
  const invoke = (method, ...args) => new Promise((resolve, reject) => store[method](...args, (error, value) => error ? reject(error) : resolve(value)));
  await invoke('set', 'session-1', { userId: 7, cookie: { maxAge: 60000 } });
  assert.deepEqual(await invoke('get', 'session-1'), { userId: 7 });
  await invoke('touch', 'session-1', { cookie: { maxAge: 60000 } });
  await invoke('destroy', 'session-1');
  assert.deepEqual(calls.map(({ sql }) => sql.split(' ')[0]), ['INSERT', 'SELECT', 'UPDATE', 'DELETE']);
});
