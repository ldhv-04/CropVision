const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool({
  user: config.DB.user,
  host: config.DB.host,
  database: config.DB.database,
  password: config.DB.password,
  port: config.DB.port,
});

pool.on('error', (err, client) => {
  console.error('[PostgreSQL Pool] Idle client error:', err.message);
  // Do not call process.exit(-1) to maintain process resilience against transient network resets
});

module.exports = pool;
