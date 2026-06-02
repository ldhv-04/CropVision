/**
 * Phase 01R targeted schema verifier.
 *
 * Run directly:
 *   node tests/task2-cultivation-schema.test.js
 *
 * This script creates disposable marker fixtures inside one transaction,
 * proves cultivation scalar retention after a real sub_zones hard delete,
 * cleans the fixtures, and commits the cleanup.
 */

const pool = require('../src/config/db');

const FIELD_MARKER = '__phase01r_verify__test_field';
const EXPECTED_HARVEST_DATE = '2026-09-30';

async function getCounts(client) {
  const result = await client.query(`
    SELECT
      (SELECT COUNT(*)::int FROM zone_cultivation_profiles) AS profiles,
      (SELECT COUNT(*)::int FROM zone_cultivation_logs) AS logs,
      (SELECT COUNT(*)::int FROM fields WHERE name LIKE '__phase01r_verify__%') AS marker_fields
  `);

  return result.rows[0];
}

async function verifyCultivationSchema() {
  const client = await pool.connect();
  const results = {};

  try {
    results.before = await getCounts(client);

    const columnResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'zone_cultivation_profiles'
        AND column_name = 'expected_harvest_date'
    `);

    if (columnResult.rows.length !== 1) {
      throw new Error('expected_harvest_date column is missing');
    }

    const expectedHarvestColumn = columnResult.rows[0];
    if (expectedHarvestColumn.data_type !== 'date' || expectedHarvestColumn.is_nullable !== 'YES') {
      throw new Error('expected_harvest_date must be a nullable DATE column');
    }
    results.expectedHarvestColumn = expectedHarvestColumn;

    const farmerResult = await client.query(
      "SELECT id FROM users WHERE email = 'farmer@cropvision.local' LIMIT 1"
    );
    if (farmerResult.rows.length !== 1) {
      throw new Error('Seeded farmer user not found');
    }
    const userId = farmerResult.rows[0].id;

    await client.query('BEGIN');

    const fieldResult = await client.query(`
      INSERT INTO fields (
        user_id, owner_user_id, name, crop_type, latitude, longitude, created_at, updated_at
      )
      VALUES ($1, $1, $2, 'Rice', 0, 0, NOW(), NOW())
      RETURNING id
    `, [userId, FIELD_MARKER]);
    const fieldId = fieldResult.rows[0].id;

    const boundary = {
      type: 'Polygon',
      coordinates: [[[0, 0], [0, 1], [1, 1], [0, 0]]],
    };
    const zoneResult = await client.query(`
      INSERT INTO sub_zones (field_id, crop_type, boundary, status)
      VALUES ($1, 'Rice', $2::jsonb, 'HEALTHY')
      RETURNING id
    `, [fieldId, JSON.stringify(boundary)]);
    const stableZoneId = zoneResult.rows[0].id;

    const mapResult = await client.query(`
      INSERT INTO field_zone_maps (
        field_id, version, status, published_at, published_by, zones_data, zones_count
      )
      VALUES ($1, 1, 'published', NOW(), $2, $3::jsonb, 1)
      RETURNING id, version
    `, [fieldId, userId, JSON.stringify([{
      id: stableZoneId,
      code: 'VERIFY-01R',
      name: 'Phase 01R disposable zone',
      area: 1,
      boundary,
    }])]);
    const fieldZoneMapId = mapResult.rows[0].id;
    const zoneMapVersion = mapResult.rows[0].version;

    const profileResult = await client.query(`
      INSERT INTO zone_cultivation_profiles (
        user_id, field_id, stable_zone_id, field_zone_map_id, zone_map_version,
        lifecycle_state, crop_type, started_at, expected_harvest_date
      )
      VALUES ($1, $2, $3, $4, $5, 'current', 'Rice', '2026-06-02', $6)
      RETURNING id
    `, [userId, fieldId, stableZoneId, fieldZoneMapId, zoneMapVersion, EXPECTED_HARVEST_DATE]);
    const profileId = profileResult.rows[0].id;

    const logResult = await client.query(`
      INSERT INTO zone_cultivation_logs (
        user_id, field_id, stable_zone_id, field_zone_map_id, zone_map_version,
        profile_id, activity_kind, activity_date, title
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'planting', '2026-06-02', 'Phase 01R retention proof')
      RETURNING id
    `, [userId, fieldId, stableZoneId, fieldZoneMapId, zoneMapVersion, profileId]);
    const logId = logResult.rows[0].id;

    const deletedZone = await client.query(
      'DELETE FROM sub_zones WHERE id = $1 RETURNING id',
      [stableZoneId]
    );
    if (deletedZone.rows.length !== 1) {
      throw new Error('Disposable sub_zone was not hard-deleted');
    }

    const retainedResult = await client.query(`
      SELECT
        p.id AS profile_id,
        p.stable_zone_id AS profile_stable_zone_id,
        p.expected_harvest_date::text AS expected_harvest_date,
        l.id AS log_id,
        l.stable_zone_id AS log_stable_zone_id,
        EXISTS (SELECT 1 FROM sub_zones z WHERE z.id = p.stable_zone_id) AS sub_zone_still_exists
      FROM zone_cultivation_profiles p
      JOIN zone_cultivation_logs l ON l.profile_id = p.id
      WHERE p.id = $1 AND l.id = $2
    `, [profileId, logId]);

    if (retainedResult.rows.length !== 1) {
      throw new Error('Cultivation profile or log did not survive sub_zone hard-delete');
    }

    const retained = retainedResult.rows[0];
    if (retained.profile_stable_zone_id !== stableZoneId || retained.log_stable_zone_id !== stableZoneId) {
      throw new Error('Cultivation rows did not retain the copied stable_zone_id scalar');
    }
    if (retained.sub_zone_still_exists) {
      throw new Error('Disposable sub_zone still exists after hard-delete');
    }
    if (retained.expected_harvest_date !== EXPECTED_HARVEST_DATE) {
      throw new Error('expected_harvest_date did not round-trip exactly');
    }

    results.fixtureIds = { fieldId, stableZoneId, fieldZoneMapId, profileId, logId };
    results.retention = retained;

    await client.query('DELETE FROM zone_cultivation_logs WHERE field_id = $1', [fieldId]);
    await client.query('DELETE FROM zone_cultivation_profiles WHERE field_id = $1', [fieldId]);
    await client.query('DELETE FROM field_zone_maps WHERE field_id = $1', [fieldId]);
    await client.query('DELETE FROM fields WHERE id = $1', [fieldId]);
    await client.query('COMMIT');

    results.after = await getCounts(client);
    if (results.after.marker_fields !== 0) {
      throw new Error('Disposable marker field remains after cleanup');
    }
    if (results.after.profiles !== results.before.profiles || results.after.logs !== results.before.logs) {
      throw new Error('Cultivation row counts changed after disposable fixture cleanup');
    }

    results.pass = true;
    return results;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  verifyCultivationSchema()
    .then((results) => {
      console.log(JSON.stringify(results, null, 2));
    })
    .catch((error) => {
      console.error(JSON.stringify({ pass: false, error: error.message }, null, 2));
      process.exitCode = 1;
    })
    .finally(() => pool.end());
} else if (typeof describe === 'function') {
  describe.skip('Phase 01R cultivation schema verifier', () => {
    test('run directly against an approved database target', () => {});
  });
}

module.exports = { verifyCultivationSchema };
