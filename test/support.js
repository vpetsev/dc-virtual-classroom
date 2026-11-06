const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
process.env.NODE_ENV = 'test';
assert(process.env.TEST_DATABASE_URL, 'Set TEST_DATABASE_URL to an empty disposable PostgreSQL database.');
const models = require('../models');

exports.models = models;
exports.prepare = async () => {
  await models.sequelize.authenticate();
  const tables = await models.sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'", { type: models.Sequelize.QueryTypes.SELECT });
  assert.equal(tables.length, 0, 'Integration tests require an EMPTY database; existing data will not be deleted.');
  const directory = path.join(__dirname, '../migrations');
  for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.js')).sort()) {
    await require(path.join(directory, file)).up(models.sequelize.getQueryInterface(), models.Sequelize);
  }
};
exports.start = async app => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  const base = 'http://127.0.0.1:' + server.address().port;
  const request = async (route, { method = 'GET', body, token, cookie, form = false } = {}) => {
    const headers = {};
    if (token) headers.Authorization = 'Bearer ' + token;
    if (cookie) headers.Cookie = cookie;
    let data;
    if (body !== undefined) {
      headers['Content-Type'] = form ? 'application/x-www-form-urlencoded' : 'application/json';
      if (form) {
        const values = new URLSearchParams();
        for (const [key, value] of Object.entries(body)) {
          for (const item of Array.isArray(value) ? value : [value]) values.append(key, item);
        }
        data = values.toString();
      } else data = JSON.stringify(body);
    }
    const response = await fetch(base + route, { method, body: data, headers, redirect: 'manual', signal: AbortSignal.timeout(5000) });
    const text = await response.text();
    let json; try { json = JSON.parse(text); } catch (_) {}
    return { status: response.status, location: response.headers.get('location'), cookie: (response.headers.get('set-cookie') || '').split(';')[0], text, json };
  };
  return { request, close: () => new Promise(resolve => server.close(resolve)) };
};

