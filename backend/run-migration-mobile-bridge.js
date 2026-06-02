/**
 * Migration: Mobile Bridge — Field Owner Assignment & Published Zone Map Versioning
 *
 * TASK 1: Station-to-Mobile data pipeline.
 *
 * Changes:
 * 1. Add owner_user_id to fields (the mobile user who owns this field)
 * 2. Add owner_email_snapshot to fields (for display/debug, not a FK)
 * 3. Create field_zone_maps table for versioned published zone snapshots
 * 4. Add zone_map_version to fields for quick reference to latest published version
 *
 * IMPORTANT: This migration does NOT modify the existing sub_zones table structure.
 * The station zone editor continues working with sub_zones as before.
 * Published maps are snapshotted into field_zone_maps for mobile consumption.
 *
 * DEPENDENCY NOTE:
 * - Mobile APIs read ONLY from field_zone_maps (status = 'published')
 * - Draft sub_zones are NEVER exposed through mobile APIs
 * - Publishing creates a new versioned snapshot in field_zone_maps
 */

const pool = require('./src/config/db');

const migrations = [
  // ── 1. Add owner_user_id to fields ──────────────────────────────
  // This is the registered mobile user who owns the field.
  // Station/Admin assigns this via email lookup.
  // The actual relationship key is owner_user_id (UUID), not email.
  // NOTE: users.id is UUID in this database (not INTEGER as in init SQL).
  `ALTER TABLE fields ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL`,

  // ── 2. Add owner_email_snapshot for display/debug ────────────────
  // Stored at assignment time. NOT used for lookups or joins.
  // Only for display in station UI and debugging.
  `ALTER TABLE fields ADD COLUMN IF NOT EXISTS owner_email_snapshot VARCHAR(255)`,

  // ── 3. Add zone_map_version quick reference on fields ────────────
  // Points to the latest published field_zone_maps version number.
  // Updated atomically when a new version is published.
  `ALTER TABLE fields ADD COLUMN IF NOT EXISTS zone_map_version INTEGER DEFAULT 0`,

  // ── 4. Create field_zone_maps table (versioned published snapshots) ──
  // Each publish creates a new row. Mobile reads the latest 'published' row.
  // zones_data is a JSONB array of zone polygons — lightweight, no satellite tiles.
  `CREATE TABLE IF NOT EXISTS field_zone_maps (
    id SERIAL PRIMARY KEY,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES users(id) ON DELETE SET NULL,
    zones_data JSONB NOT NULL DEFAULT '[]',
    boundary_data JSONB,
    zones_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // ── 5. Indexes for field_zone_maps ───────────────────────────────
  // Fast lookup: latest published map for a field
  `CREATE INDEX IF NOT EXISTS idx_field_zone_maps_field_status
   ON field_zone_maps(field_id, status, version DESC)`,

  // Unique constraint: only one published version per field at a time
  // (enforced at application level by archiving previous published versions)

  // ── 6. Index for owner lookup ────────────────────────────────────
  // Mobile API: "get all fields where owner_user_id = me"
  `CREATE INDEX IF NOT EXISTS idx_fields_owner_user_id
   ON fields(owner_user_id) WHERE owner_user_id IS NOT NULL`,
];

async function runMigration() {
  console.log('Running mobile bridge migration (Task 1)...');
  console.log('  Purpose: Field owner assignment + Published zone map versioning');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const sql of migrations) {
      const preview = sql.trim().substring(0, 80).replace(/\n/g, ' ');
      console.log(`  Executing: ${preview}...`);
      await client.query(sql);
    }

    await client.query('COMMIT');
    console.log('✅ Mobile bridge migration completed successfully.');
    console.log('');
    console.log('Schema changes:');
    console.log('  - fields.owner_user_id (UUID, FK → users.id)');
    console.log('  - fields.owner_email_snapshot (VARCHAR)');
    console.log('  - fields.zone_map_version (INTEGER)');
    console.log('  - field_zone_maps (new table)');
    console.log('  - idx_field_zone_maps_field_status (index)');
    console.log('  - idx_fields_owner_user_id (index)');
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