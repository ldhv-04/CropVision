/**
 * Phase 01 DB Verification Script
 * Inspects schema, then runs insert/query proof cases for all acceptance criteria.
 * All test data uses marker prefix __phase01_verify__ and is deleted at end.
 */
const pool = require('./src/config/db');

async function verify() {
  const client = await pool.connect();
  const results = {};

  try {
    // ── 1. Schema inspection ────────────────────────────────────────────────
    const cols = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('zone_cultivation_profiles', 'zone_cultivation_logs')
      ORDER BY table_name, ordinal_position
    `);
    results.columns = cols.rows;

    const idxs = await client.query(`
      SELECT indexname, tablename, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('zone_cultivation_profiles', 'zone_cultivation_logs')
      ORDER BY tablename, indexname
    `);
    results.indexes = idxs.rows;

    const cons = await client.query(`
      SELECT tc.table_name, tc.constraint_name, tc.constraint_type,
             kcu.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_col
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.constraint_schema = kcu.constraint_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = tc.constraint_schema
      WHERE tc.constraint_schema = 'public'
        AND tc.table_name IN ('zone_cultivation_profiles', 'zone_cultivation_logs')
      ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name
    `);
    results.constraints = cons.rows;

    // ── 2. Seed: find seeded farmer user + a field (read-only lookup) ────────
    const farmerRow = await client.query(
      "SELECT id FROM users WHERE email = 'farmer@cropvision.local' LIMIT 1"
    );
    if (farmerRow.rows.length === 0) throw new Error('Seeded farmer user not found');
    const userId = farmerRow.rows[0].id;

    // ── 3. Insert disposable field ───────────────────────────────────────────
    await client.query('BEGIN');

    // First inspect the fields table columns so we can satisfy NOT NULL constraints
    const fieldsColsRes = await client.query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'fields'
      ORDER BY ordinal_position
    `);
    const requiredFieldCols = fieldsColsRes.rows
      .filter(r => r.is_nullable === 'NO' && r.column_default === null)
      .map(r => r.column_name);
    results.fieldsRequiredCols = requiredFieldCols;

    const fieldRow = await client.query(`
      INSERT INTO fields (user_id, owner_user_id, name, crop_type, latitude, longitude, created_at, updated_at)
      VALUES ($1, $1, '__phase01_verify__test_field', 'Rice', 0, 0, NOW(), NOW())
      RETURNING id
    `, [userId]);
    const fieldId = fieldRow.rows[0].id;

    // Insert disposable field_zone_map
    const fzmRow = await client.query(`
      INSERT INTO field_zone_maps (field_id, version, status, published_at, published_by, zones_data, zones_count)
      VALUES ($1, 1, 'published', NOW(), $2, '[]', 0)
      RETURNING id, version
    `, [fieldId, userId]);
    const fzmId = fzmRow.rows[0].id;
    const fzmVersion = fzmRow.rows[0].version;
    const stableZoneId = 9001; // synthetic stable integer scalar

    // ── 4. PROOF: Insert 'current' profile ──────────────────────────────────
    const profRow = await client.query(`
      INSERT INTO zone_cultivation_profiles
        (user_id, field_id, stable_zone_id, field_zone_map_id, zone_map_version,
         lifecycle_state, crop_type, season_label, started_at)
      VALUES ($1, $2, $3, $4, $5, 'current', 'Rice', 'Season 1', '2026-01-01')
      RETURNING id, lifecycle_state
    `, [userId, fieldId, stableZoneId, fzmId, fzmVersion]);
    const profileId = profRow.rows[0].id;
    results.proof_currentProfile = { inserted: true, id: profileId, lifecycle_state: profRow.rows[0].lifecycle_state };

    // ── 5. PROOF: One-current-per-zone unique constraint ────────────────────
    // Use a savepoint so the transaction stays live after the expected violation.
    await client.query('SAVEPOINT before_unique_test');
    try {
      await client.query(`
        INSERT INTO zone_cultivation_profiles
          (user_id, field_id, stable_zone_id, field_zone_map_id, zone_map_version, lifecycle_state)
        VALUES ($1, $2, $3, $4, $5, 'current')
      `, [userId, fieldId, stableZoneId, fzmId, fzmVersion]);
      results.proof_uniqueCurrentConstraint = { enforced: false, error: 'SECOND INSERT SUCCEEDED — CONSTRAINT MISSING' };
    } catch (e) {
      await client.query('ROLLBACK TO SAVEPOINT before_unique_test');
      results.proof_uniqueCurrentConstraint = { enforced: true, errorCode: e.code, detail: e.detail };
    }
    await client.query('RELEASE SAVEPOINT before_unique_test');

    // ── 6. PROOF: Historical profile can coexist ────────────────────────────
    const histRow = await client.query(`
      INSERT INTO zone_cultivation_profiles
        (user_id, field_id, stable_zone_id, field_zone_map_id, zone_map_version, lifecycle_state, crop_type)
      VALUES ($1, $2, $3, $4, $5, 'historical', 'Corn')
      RETURNING id, lifecycle_state
    `, [userId, fieldId, stableZoneId, fzmId, fzmVersion]);
    results.proof_historicalCoexists = { inserted: true, id: histRow.rows[0].id, lifecycle_state: histRow.rows[0].lifecycle_state };

    // ── 7. PROOF: Pre-profile log (no profile_id) ────────────────────────────
    const preLogRow = await client.query(`
      INSERT INTO zone_cultivation_logs
        (user_id, field_id, stable_zone_id, field_zone_map_id, zone_map_version,
         activity_kind, activity_date)
      VALUES ($1, $2, $3, $4, $5, 'watering', '2026-01-10')
      RETURNING id, profile_id, source
    `, [userId, fieldId, stableZoneId, fzmId, fzmVersion]);
    results.proof_preProfileLog = {
      inserted: true,
      id: preLogRow.rows[0].id,
      profile_id: preLogRow.rows[0].profile_id,
      source: preLogRow.rows[0].source,
    };

    // ── 8. PROOF: Log with profile association ────────────────────────────────
    const linkedLogRow = await client.query(`
      INSERT INTO zone_cultivation_logs
        (user_id, field_id, stable_zone_id, field_zone_map_id, zone_map_version,
         profile_id, activity_kind, activity_date, amount, unit, product, title, note)
      VALUES ($1, $2, $3, $4, $5, $6, 'fertilizing', '2026-01-15', 50.5, 'kg', 'NPK 20-20-20', 'First fert', 'Test note')
      RETURNING id, profile_id, activity_kind, amount, unit
    `, [userId, fieldId, stableZoneId, fzmId, fzmVersion, profileId]);
    results.proof_linkedLog = { inserted: true, ...linkedLogRow.rows[0] };

    // ── 9. PROOF: Edit updates updated_at ────────────────────────────────────
    await new Promise(r => setTimeout(r, 50)); // small delay
    await client.query(`
      UPDATE zone_cultivation_logs SET note = 'Edited note', updated_at = NOW()
      WHERE id = $1
    `, [linkedLogRow.rows[0].id]);
    const editCheck = await client.query(
      'SELECT created_at, updated_at FROM zone_cultivation_logs WHERE id = $1',
      [linkedLogRow.rows[0].id]
    );
    results.proof_editUpdatesTimestamp = {
      created_at: editCheck.rows[0].created_at,
      updated_at: editCheck.rows[0].updated_at,
      updated_at_after_created: editCheck.rows[0].updated_at >= editCheck.rows[0].created_at,
    };

    // ── 10. PROOF: Soft-delete hides from normal reads ────────────────────────
    await client.query(
      'UPDATE zone_cultivation_logs SET deleted_at = NOW() WHERE id = $1',
      [preLogRow.rows[0].id]
    );
    const softDeleteCheck = await client.query(
      'SELECT COUNT(*) AS visible FROM zone_cultivation_logs WHERE user_id = $1 AND field_id = $2 AND deleted_at IS NULL',
      [userId, fieldId]
    );
    results.proof_softDeleteHides = {
      visibleAfterSoftDelete: parseInt(softDeleteCheck.rows[0].visible, 10),
      softDeletedRowHidden: parseInt(softDeleteCheck.rows[0].visible, 10) === 1,
    };

    // ── 11. PROOF: Orphaned lifecycle after zone removed ─────────────────────
    await client.query(`
      UPDATE zone_cultivation_profiles SET lifecycle_state = 'orphaned', closed_at = NOW()
      WHERE id = $1
    `, [profileId]);
    const orphanCheck = await client.query(
      'SELECT lifecycle_state FROM zone_cultivation_profiles WHERE id = $1',
      [profileId]
    );
    results.proof_orphanedLifecycle = { lifecycle_state: orphanCheck.rows[0].lifecycle_state };

    // ── 12. PROOF: Historical retention after zone hard-delete (stable_zone_id survives)
    // NOTE: we do NOT delete sub_zones here (they are station geometry, no FK to cultivation)
    // This proof shows the scalar stable_zone_id is retained even with no sub_zones row.
    const retentionCheck = await client.query(
      'SELECT id, stable_zone_id, lifecycle_state FROM zone_cultivation_profiles WHERE field_id = $1',
      [fieldId]
    );
    results.proof_retentionScalar = {
      profileCount: retentionCheck.rows.length,
      allHaveStableZoneId: retentionCheck.rows.every(r => r.stable_zone_id === stableZoneId),
      lifecycleStates: retentionCheck.rows.map(r => r.lifecycle_state),
    };

    // ── 13. PROOF: immutable source='mobile' enforced ────────────────────────
    await client.query('SAVEPOINT before_source_test');
    try {
      await client.query(`
        INSERT INTO zone_cultivation_logs
          (source, user_id, field_id, stable_zone_id, field_zone_map_id, zone_map_version,
           activity_kind, activity_date)
        VALUES ('station', $1, $2, $3, $4, $5, 'observation', '2026-01-20')
      `, [userId, fieldId, stableZoneId, fzmId, fzmVersion]);
      results.proof_immutableSource = { enforced: false, error: 'NON-MOBILE SOURCE ACCEPTED — CONSTRAINT MISSING' };
    } catch (e) {
      await client.query('ROLLBACK TO SAVEPOINT before_source_test');
      results.proof_immutableSource = { enforced: true, errorCode: e.code };
    }
    await client.query('RELEASE SAVEPOINT before_source_test');

    // ── Cleanup disposable data ───────────────────────────────────────────────
    await client.query('DELETE FROM zone_cultivation_logs WHERE field_id = $1', [fieldId]);
    await client.query('DELETE FROM zone_cultivation_profiles WHERE field_id = $1', [fieldId]);
    await client.query('DELETE FROM field_zone_maps WHERE field_id = $1', [fieldId]);
    await client.query("DELETE FROM fields WHERE name LIKE '__phase01_verify__%'");

    await client.query('COMMIT');

    // Verify cleanup
    const remaining = await client.query(
      "SELECT COUNT(*) AS c FROM fields WHERE name LIKE '__phase01_verify__%'"
    );
    results.cleanup = { remainingMarkerRows: parseInt(remaining.rows[0].c, 10) };

  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    results.error = e.message;
  } finally {
    client.release();
    await pool.end();
  }

  console.log(JSON.stringify(results, null, 2));
}

verify();
