// Recovery script — drops only cultivation tables added by Phase 01 migration.
// Run this ONLY if the migration failed partway and you need to retry cleanly.
const pool = require('./src/config/db');

async function recover() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DROP TABLE IF EXISTS zone_cultivation_logs');
    await client.query('DROP TABLE IF EXISTS zone_cultivation_profiles');
    await client.query('COMMIT');
    console.log('Recovery complete. Tables dropped.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Recovery failed:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}
recover();
