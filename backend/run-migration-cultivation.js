/**
 * Migration: Mobile Cultivation — Zone Cultivation Profiles & Logs
 *
 * PHASE 01: Mobile Zone Cultivation Manager
 *
 * Adds lifecycle-ready persistence for mobile-owned cultivation data.
 * Cultivation records are kept SEPARATE from:
 *   - sub_zones (station geometry — may be hard-deleted)
 *   - field_zone_maps (published snapshots)
 *   - field_activities (legacy field-level table — untouched)
 *
 * Design decisions (from Phase 00 runtime evidence):
 *   - users.id             → UUID
 *   - fields.id            → UUID
 *   - sub_zones.id         → INTEGER (SERIAL)
 *   - field_zone_maps.id   → INTEGER (SERIAL)
 *   - stable_zone_id       → INTEGER scalar (copy of sub_zones.id at publish time)
 *     Historical rows retain this scalar even after sub_zones hard deletion.
 *     No FK from cultivation tables to sub_zones (prevents cascading history loss).
 *
 * Tables created:
 *   - zone_cultivation_profiles  — at most one 'current' profile per (user_id, field_id, stable_zone_id)
 *   - zone_cultivation_logs      — mobile-owned activity logs; may exist before a profile
 *
 * Recovery: see bottom of this file for DROP statements (safe additive rollback).
 */

const pool = require('./src/config/db');

const tableMigrations = [
  // ── 1. zone_cultivation_profiles ─────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS zone_cultivation_profiles (
    id                 SERIAL PRIMARY KEY,
    user_id            UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    field_id           UUID        NOT NULL REFERENCES fields(id)  ON DELETE CASCADE,
    stable_zone_id     INTEGER     NOT NULL,
    field_zone_map_id  INTEGER     NOT NULL REFERENCES field_zone_maps(id) ON DELETE RESTRICT,
    zone_map_version   INTEGER     NOT NULL,
    lifecycle_state    VARCHAR(20) NOT NULL DEFAULT 'current'
                         CHECK (lifecycle_state IN ('current', 'historical', 'orphaned')),
    crop_type          VARCHAR(100),
    season_label       VARCHAR(100),
    notes              TEXT,
    started_at         DATE,
    expected_harvest_date DATE,
    closed_at          DATE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // ── 2. zone_cultivation_logs ──────────────────────────────────────────────
  // Phase 01R: reconcile existing installations before log table setup.
  `ALTER TABLE zone_cultivation_profiles
   ADD COLUMN IF NOT EXISTS expected_harvest_date DATE`,

  `CREATE TABLE IF NOT EXISTS zone_cultivation_logs (
    id                 SERIAL PRIMARY KEY,
    source             VARCHAR(20) NOT NULL DEFAULT 'mobile'
                         CHECK (source = 'mobile'),
    user_id            UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    field_id           UUID        NOT NULL REFERENCES fields(id)  ON DELETE CASCADE,
    stable_zone_id     INTEGER     NOT NULL,
    field_zone_map_id  INTEGER     NOT NULL REFERENCES field_zone_maps(id) ON DELETE RESTRICT,
    zone_map_version   INTEGER     NOT NULL,
    profile_id         INTEGER     REFERENCES zone_cultivation_profiles(id) ON DELETE SET NULL,
    activity_kind      VARCHAR(30) NOT NULL
                         CHECK (activity_kind IN (
                           'watering', 'fertilizing', 'pesticide',
                           'harvesting', 'planting', 'observation', 'other'
                         )),
    activity_date      DATE        NOT NULL,
    amount             NUMERIC(10, 3),
    unit               VARCHAR(30),
    product            VARCHAR(150),
    title              VARCHAR(200),
    note               TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at         TIMESTAMPTZ
  )`,
];

// Indexes run in a second transaction after tables are committed.
// PostgreSQL partial index WHERE clauses referencing a column of a table
// created in the same transaction can fail with "column does not exist"
// due to catalog visibility timing.
const indexMigrations = [
  // ── Profiles: partial unique index — at most one 'current' per zone ───────
  `CREATE UNIQUE INDEX IF NOT EXISTS uidx_zcp_one_current_per_zone
   ON zone_cultivation_profiles (user_id, field_id, stable_zone_id)
   WHERE lifecycle_state = 'current'`,

  // ── Profiles: lookup indexes ──────────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_zcp_owner_field
   ON zone_cultivation_profiles (user_id, field_id)`,

  `CREATE INDEX IF NOT EXISTS idx_zcp_stable_zone
   ON zone_cultivation_profiles (user_id, field_id, stable_zone_id)`,

  `CREATE INDEX IF NOT EXISTS idx_zcp_map_version
   ON zone_cultivation_profiles (field_zone_map_id, zone_map_version)`,

  `CREATE INDEX IF NOT EXISTS idx_zcp_lifecycle
   ON zone_cultivation_profiles (user_id, field_id, lifecycle_state)`,

  // ── Logs: active timeline (partial — excludes soft-deleted) ──────────────
  `CREATE INDEX IF NOT EXISTS idx_zcl_active_timeline
   ON zone_cultivation_logs (user_id, field_id, stable_zone_id, activity_date DESC)
   WHERE deleted_at IS NULL`,

  // ── Logs: soft-delete filter (partial) ───────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_zcl_soft_delete
   ON zone_cultivation_logs (user_id, deleted_at)
   WHERE deleted_at IS NULL`,

  // ── Logs: profile association ─────────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_zcl_profile
   ON zone_cultivation_logs (profile_id)
   WHERE profile_id IS NOT NULL`,

  // ── Logs: publication traceability ───────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_zcl_map_version
   ON zone_cultivation_logs (field_zone_map_id, zone_map_version)`,

  // ── Logs: owner + field reads ─────────────────────────────────────────────
  `CREATE INDEX IF NOT EXISTS idx_zcl_owner_field
   ON zone_cultivation_logs (user_id, field_id)`,
];

async function runMigration() {
  console.log('');
  console.log('='.repeat(60));
  console.log('Running cultivation migration (Phase 01)...');
  console.log('  Purpose: Zone cultivation profiles + mobile activity logs');
  console.log('='.repeat(60));

  // ── Pass 1: Create tables ─────────────────────────────────────────────────
  // Use first connection. Commit before releasing so catalog is fully visible.
  console.log('');
  console.log('Pass 1: Creating tables...');
  const client1 = await pool.connect();
  try {
    await client1.query('BEGIN');
    for (const sql of tableMigrations) {
      const preview = sql.trim().substring(0, 90).replace(/\n/g, ' ');
      console.log(`  Executing: ${preview}...`);
      await client1.query(sql);
    }
    await client1.query('COMMIT');
    console.log('  Tables committed.');
  } catch (error) {
    try { await client1.query('ROLLBACK'); } catch (_) {}
    console.error('');
    console.error('❌ Cultivation migration failed (table pass):', error.message);
    console.error('   Transaction rolled back. No changes applied.');
    client1.release();
    await pool.end();
    throw error;
  }
  client1.release();

  // ── Pass 2: Create indexes ────────────────────────────────────────────────
  // Use a fresh connection so PostgreSQL catalog snapshot is fully refreshed.
  // Partial index WHERE clauses need the column to be visible in catalog.
  console.log('');
  console.log('Pass 2: Creating indexes...');
  const client2 = await pool.connect();
  try {
    await client2.query('BEGIN');
    for (const sql of indexMigrations) {
      const preview = sql.trim().substring(0, 90).replace(/\n/g, ' ');
      console.log(`  Executing: ${preview}...`);
      await client2.query(sql);
    }
    await client2.query('COMMIT');
    console.log('  Indexes committed.');
  } catch (error) {
    try { await client2.query('ROLLBACK'); } catch (_) {}
    console.error('');
    console.error('❌ Cultivation migration failed (index pass):', error.message);
    console.error('   Tables were already committed. Run recovery if needed:');
    console.error('     DROP TABLE IF EXISTS zone_cultivation_logs;');
    console.error('     DROP TABLE IF EXISTS zone_cultivation_profiles;');
    client2.release();
    await pool.end();
    throw error;
  }
  client2.release();
  await pool.end();

  console.log('');
  console.log('✅ Cultivation migration (Phase 01) completed successfully.');
  console.log('');
  console.log('Schema additions:');
  console.log('  Tables:');
  console.log('    - zone_cultivation_profiles');
  console.log('    - zone_cultivation_logs');
  console.log('  Profile reconciliation:');
  console.log('    - expected_harvest_date DATE');
  console.log('  Indexes:');
  console.log('    - uidx_zcp_one_current_per_zone  (partial unique — one current profile per zone)');
  console.log('    - idx_zcp_owner_field');
  console.log('    - idx_zcp_stable_zone');
  console.log('    - idx_zcp_map_version');
  console.log('    - idx_zcp_lifecycle');
  console.log('    - idx_zcl_active_timeline        (partial — excludes soft-deleted)');
  console.log('    - idx_zcl_soft_delete            (partial — excludes soft-deleted)');
  console.log('    - idx_zcl_profile');
  console.log('    - idx_zcl_map_version');
  console.log('    - idx_zcl_owner_field');
  console.log('');
  console.log('Recovery (additive rollback — drops only the new objects):');
  console.log('  DROP TABLE IF EXISTS zone_cultivation_logs;');
  console.log('  DROP TABLE IF EXISTS zone_cultivation_profiles;');
  console.log('  (Indexes are dropped automatically with their table.)');
}

runMigration().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
