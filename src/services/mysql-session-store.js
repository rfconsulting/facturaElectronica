const session = require('express-session');

function expiresAt(sessionData) {
  const expires = sessionData.cookie?.expires;
  const timestamp = expires ? new Date(expires).getTime() : Date.now() + (sessionData.cookie?.maxAge || 8 * 60 * 60 * 1000);
  return Math.floor(timestamp / 1000);
}

class MySqlSessionStore extends session.Store {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  get(sessionId, callback) {
    this.pool.execute('SELECT data FROM user_sessions WHERE session_id=? AND expires>? LIMIT 1', [sessionId, Math.floor(Date.now() / 1000)])
      .then(([rows]) => callback(null, rows[0] ? JSON.parse(rows[0].data) : null))
      .catch(callback);
  }

  set(sessionId, sessionData, callback = () => {}) {
    this.pool.execute(
      'INSERT INTO user_sessions (session_id,expires,data) VALUES (?,?,?) ON DUPLICATE KEY UPDATE expires=VALUES(expires),data=VALUES(data)',
      [sessionId, expiresAt(sessionData), JSON.stringify(sessionData)]
    ).then(() => callback()).catch(callback);
  }

  destroy(sessionId, callback = () => {}) {
    this.pool.execute('DELETE FROM user_sessions WHERE session_id=?', [sessionId])
      .then(() => callback()).catch(callback);
  }

  touch(sessionId, sessionData, callback = () => {}) {
    this.pool.execute('UPDATE user_sessions SET expires=? WHERE session_id=?', [expiresAt(sessionData), sessionId])
      .then(() => callback()).catch(callback);
  }
}

module.exports = MySqlSessionStore;
