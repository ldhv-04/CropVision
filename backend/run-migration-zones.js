/**
 * Migration: Add management zone fields to sub_zones table.
 * 
 * Adds: code, name, area, published_at, created_by_station_id
 * These support the Station/Admin Management Zone Editor workflow.
 */

const pool = require('./src/config/db');

const migrations = [
  // Add code field to fields table (e.g., A, B, C)
  `ALTER TABLE fields ADD COLUMN IF NOT EXISTS code VARCHAR(20)`,

  // Add zone code (e.g., A1, A2, B1)
  `ALTER TABLE sub_zones ADD COLUMN IF NOT EXISTS code VARCHAR(20)`,

  // Add optional zone name
  `ALTER TABLE sub_zones ADD COLUMN IF NOT EXISTS name VARCHAR(255)`,

  // Add area in hectares (auto-calculated)
  `ALTER TABLE sub_zones ADD COLUMN IF NOT EXISTS area NUMERIC(10, 4)`,

  // Add published timestamp (null = draft)
  `ALTER TABLE sub_zones ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ`,

  // Add station user who created the zone
  `ALTER TABLE sub_zones ADD COLUMN IF NOT EXISTS created_by_station_id UUID`,

  // Add updated_at timestamp
  `ALTER TABLE sub_zones ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP`,

  // Index for zone code uniqueness per field
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_zones_field_code 
   ON sub_zones(field_id, code) WHERE code IS NOT NULL`,

  // Add zone_status field (draft/published) separate from health status
  `ALTER TABLE sub_zones ADD COLUMN IF NOT EXISTS zone_status VARCHAR(20) DEFAULT 'draft'
   CHECK (zone_status IN ('draft', 'published', 'unpublished'))`,

  // Add published flag on fields table
  `ALTER TABLE fields ADD COLUMN IF NOT EXISTS zones_published_at TIMESTAMPTZ`,
];

async function runMigration() {
  console.log('Running zone editor migration...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const sql of migrations) {
      console.log(`  Executing: ${sql.substring(0, 80)}...`);
      await client.query(sql);
    }

    await client.query('COMMIT');
    console.log('✅ Zone editor migration completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});