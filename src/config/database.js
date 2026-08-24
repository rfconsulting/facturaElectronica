const mysql = require('mysql2/promise');
const env = require('./env');

module.exports = mysql.createPool({
  ...env.db,
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true,
  timezone: 'Z'
});
