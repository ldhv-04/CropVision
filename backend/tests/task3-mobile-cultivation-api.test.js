/**
 * Phase 02 targeted mobile cultivation API verifier.
 *
 * Run directly:
 *   node tests/task3-mobile-cultivation-api.test.js
 *
 * This script uses disposable committed marker fixtures and an ephemeral
 * Express app. It does not reuse the shared-state Task 1 bridge script.
 */

require('dotenv').config();

const { randomUUID } = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const pool = require('../src/config/db');
const mobileRoutes = require('../src/routes/mobileRoutes');

const RUN_ID = Date.now();
const MARKER = `__phase02_api_${RUN_ID}`;
const BOUNDARY = {
  type: 'Polygon',
  coordinates: [[[0, 0], [0, 1], [1, 1], [0, 0]]],
};

const state = {
  userIds: [],
  fieldIds: [],
  zoneIds: [],
  mapIds: [],
};

const app = express();
app.use(express.json());
app.use('/api/mobile', mobileRoutes);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function token(userId, email) {
  return jwt.sign({ userId, email, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function api(method, path, authToken, body) {
  let call = request(app)[method](path);
  if (authToken) call = call.set('Authorization', `Bearer ${authToken}`);
  if (body !== undefined) call = call.send(body);
  return call;
}

async function counts(client) {
  const result = await client.query(`
    SELECT
      (SELECT COUNT(*)::int FROM zone_cultivation_profiles) AS profiles,
      (SELECT COUNT(*)::int FROM zone_cultivation_logs) AS logs,
      (SELECT COUNT(*)::int FROM fields WHERE name LIKE $1) AS marker_fields,
      (SELECT COUNT(*)::int FROM users WHERE email LIKE $2) AS marker_users
  `, [`${MARKER}%`, `${MARKER}%`]);
  return result.rows[0];
}

async function createUser(client, suffix) {
  const id = randomUUID();
  const email = `${MARKER}_${suffix}@example.test`;
  await client.query(`
    INSERT INTO users (id, full_name, email, password_hash, is_verified, role)
    VALUES ($1, $2, $3, 'not-used', TRUE, 'user')
  `, [id, `${MARKER}_${suffix}`, email]);
  state.userIds.push(id);
  return { id, email, token: token(id, email) };
}

async function createField(client, owner, suffix) {
  const id = randomUUID();
  await client.query(`
    INSERT INTO fields (
      id, user_id, owner_user_id, name, crop_type, latitude, longitude,
      boundary, zones_published_at, zone_map_version, created_at, updated_at
    )
    VALUES ($1, $2, $2, $3, 'Rice', 0, 0, $4::jsonb, NOW(), 2, NOW(), NOW())
  `, [id, owner.id, `${MARKER}_${suffix}`, JSON.stringify(BOUNDARY)]);
  state.fieldIds.push(id);
  return id;
}

async function createZone(client, fieldId, suffix) {
  const result = await client.query(`
    INSERT INTO sub_zones (field_id, crop_type, boundary, status, code, name, area, zone_status)
    VALUES ($1, 'Rice', $2::jsonb, 'HEALTHY', $3, $4, 1, 'published')
    RETURNING id
  `, [fieldId, JSON.stringify(BOUNDARY), `${suffix}-CODE`, `${suffix} zone`]);
  state.zoneIds.push(result.rows[0].id);
  return result.rows[0].id;
}

async function createMap(client, fieldId, ownerId, version, status, zones) {
  const result = await client.query(`
    INSERT INTO field_zone_maps (
      field_id, version, status, published_at, published_by,
      zones_data, boundary_data, zones_count
    )
    VALUES ($1, $2, $3, NOW(), $4, $5::jsonb, $6::jsonb, $7)
    RETURNING id
  `, [
    fieldId,
    version,
    status,
    ownerId,
    JSON.stringify(zones.map(zone => ({
      id: zone.id,
      code: zone.code,
      name: zone.name,
      area: 1,
      boundary: BOUNDARY,
    }))),
    JSON.stringify(BOUNDARY),
    zones.length,
  ]);
  state.mapIds.push(result.rows[0].id);
  return result.rows[0].id;
}

async function cleanup(client) {
  if (state.fieldIds.length > 0) {
    await client.query('DELETE FROM zone_cultivation_logs WHERE field_id = ANY($1::uuid[])', [state.fieldIds]);
    await client.query('DELETE FROM zone_cultivation_profiles WHERE field_id = ANY($1::uuid[])', [state.fieldIds]);
    await client.query('DELETE FROM sub_zones WHERE field_id = ANY($1::uuid[])', [state.fieldIds]);
    await client.query('DELETE FROM field_zone_maps WHERE field_id = ANY($1::uuid[])', [state.fieldIds]);
    await client.query('DELETE FROM fields WHERE id = ANY($1::uuid[])', [state.fieldIds]);
  }
  if (state.userIds.length > 0) {
    await client.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [state.userIds]);
  }
}

async function verifyMobileCultivationApi() {
  const client = await pool.connect();
  const results = { matrix: [], dbProof: {} };

  try {
    results.dbProof.before = await counts(client);

    const owner = await createUser(client, 'owner');
    const other = await createUser(client, 'other');
    const fieldId = await createField(client, owner, 'field');
    const activeZoneId = await createZone(client, fieldId, 'ACTIVE');
    const preProfileZoneId = await createZone(client, fieldId, 'PREPROFILE');
    const removedZoneId = await createZone(client, fieldId, 'REMOVED');
    const archivedMapId = await createMap(client, fieldId, owner.id, 1, 'archived', [
      { id: activeZoneId, code: 'ACTIVE', name: 'Active zone' },
      { id: removedZoneId, code: 'REMOVED', name: 'Removed zone' },
    ]);
    const publishedMapId = await createMap(client, fieldId, owner.id, 2, 'published', [
      { id: activeZoneId, code: 'ACTIVE', name: 'Active zone' },
      { id: preProfileZoneId, code: 'PREPROFILE', name: 'Pre-profile zone' },
    ]);

    const base = `/api/mobile/fields/${fieldId}/zones`;
    const active = `${base}/${activeZoneId}/cultivation`;
    const preProfile = `${base}/${preProfileZoneId}/cultivation`;
    const removed = `${base}/${removedZoneId}/cultivation`;
    const neverKnown = `${base}/99999999/cultivation`;

    const unauth = await api('get', active);
    assert(unauth.status === 401 && unauth.body.code === 'UNAUTHENTICATED', 'Unauthenticated cultivation read must return coded 401');
    results.matrix.push('unauthenticated read -> 401');

    const denied = await api('put', `${active}/profile`, other.token, {
      publicationVersion: 'bad',
      cropType: '',
    });
    assert(denied.status === 403 && denied.body.code === 'FIELD_ACCESS_DENIED', 'Non-owner must receive 403 before payload validation');
    results.matrix.push('non-owner profile write -> 403 before payload validation');

    const deniedPagination = await api('get', `${active}/logs?limit=0`, other.token);
    assert(deniedPagination.status === 403, 'Non-owner listing must receive 403 before pagination validation');

    const unknown = await api('post', `${neverKnown}/logs`, owner.token, {
      publicationVersion: 2,
      type: 'watering',
      eventDate: '2026-06-02',
    });
    assert(unknown.status === 404 && unknown.body.code === 'ZONE_NOT_FOUND', 'Never-known zone must return 404');
    results.matrix.push('never-known zone -> 404');

    const bridgeFields = await api('get', '/api/mobile/fields', owner.token);
    assert(bridgeFields.status === 200 && bridgeFields.body.fields.some(field => field.id === fieldId), 'Existing mobile fields bridge must remain compatible');
    const bridgeMap = await api('get', `/api/mobile/fields/${fieldId}/zone-map`, owner.token);
    assert(bridgeMap.status === 200 && bridgeMap.body.map.type === 'polygon-only', 'Existing polygon-only zone map bridge must remain compatible');
    assert(bridgeMap.body.map.version === 2 && bridgeMap.body.map.zones.length === 2, 'Existing zone map bridge must expose latest published map');
    results.matrix.push('existing fields and polygon-only zone-map bridge -> 200');

    const emptySummary = await api('get', active, owner.token);
    assert(emptySummary.status === 200 && emptySummary.body.data.profile === null, 'Owner summary must expose null profile before upsert');
    assert(emptySummary.body.data.logs.length === 0, 'Owner summary must start with no active logs');
    assert(
      JSON.stringify(Object.keys(emptySummary.body.data.field).sort()) === JSON.stringify(['id', 'name']),
      'Station field metadata must stay bounded'
    );
    assert(
      JSON.stringify(Object.keys(emptySummary.body.data.zone).sort()) === JSON.stringify(['area', 'code', 'id', 'name']),
      'Station zone metadata must stay bounded'
    );
    assert(
      JSON.stringify(Object.keys(emptySummary.body.data.publication).sort()) === JSON.stringify(['publishedAt', 'status', 'version']),
      'Publication metadata must stay bounded'
    );
    results.matrix.push('owned latest zone summary -> bounded metadata, null profile, empty logs');

    const beforePreProfile = await client.query('SELECT COUNT(*)::int AS count FROM zone_cultivation_profiles WHERE field_id = $1', [fieldId]);
    const preProfileLog = await api('post', `${preProfile}/logs`, owner.token, {
      publicationVersion: 2,
      type: 'observation',
      eventDate: '2026-06-01',
      title: 'Before profile',
    });
    assert(preProfileLog.status === 201, 'Pre-profile log creation must succeed');
    const preProfileDb = await client.query(
      'SELECT profile_id FROM zone_cultivation_logs WHERE id = $1',
      [preProfileLog.body.data.log.id]
    );
    assert(preProfileDb.rows[0].profile_id === null, 'Pre-profile log must persist profile_id = null');
    const afterPreProfile = await client.query('SELECT COUNT(*)::int AS count FROM zone_cultivation_profiles WHERE field_id = $1', [fieldId]);
    assert(beforePreProfile.rows[0].count === afterPreProfile.rows[0].count, 'Pre-profile log must not create a profile');
    results.matrix.push('pre-profile log create -> 201 with DB profile_id null');

    const invalidProfile = await api('put', `${active}/profile`, owner.token, {
      publicationVersion: 2,
      cropType: '',
      plantingDate: '2026-02-30',
    });
    assert(invalidProfile.status === 400, 'Invalid profile payload must return 400');

    const profile = await api('put', `${active}/profile`, owner.token, {
      publicationVersion: 2,
      cropType: '  Rice  ',
      plantingDate: '2026-06-02',
      expectedHarvestDate: '2026-09-30',
      note: '  Summer crop  ',
    });
    assert(profile.status === 200 && profile.body.data.profile.cropType === 'Rice', 'Profile create must trim cropType');
    assert(
      profile.body.data.profile.expectedHarvestDate === '2026-09-30',
      `Profile expected harvest must round-trip: ${JSON.stringify(profile.body)}`
    );

    const profileUpdate = await api('put', `${active}/profile`, owner.token, {
      publicationVersion: 2,
      cropType: 'Rice updated',
      note: null,
    });
    assert(profileUpdate.status === 200 && profileUpdate.body.data.profile.cropType === 'Rice updated', 'Profile update must upsert current row');
    const profileDb = await client.query(`
      SELECT COUNT(*)::int AS count, MAX(crop_type) AS crop_type,
             MAX(expected_harvest_date)::text AS expected_harvest_date
      FROM zone_cultivation_profiles
      WHERE field_id = $1 AND stable_zone_id = $2 AND lifecycle_state = 'current'
    `, [fieldId, activeZoneId]);
    assert(profileDb.rows[0].count === 1 && profileDb.rows[0].crop_type === 'Rice updated', 'Profile upsert must keep one current DB row');
    assert(profileDb.rows[0].expected_harvest_date === null, 'Omitted expected harvest on full PUT must clear the DB value');
    results.matrix.push('profile create/update -> 200 with one current DB row');

    const activeCountBeforeConflicts = await client.query(
      'SELECT COUNT(*)::int AS count FROM zone_cultivation_logs WHERE field_id = $1 AND stable_zone_id = $2',
      [fieldId, activeZoneId]
    );
    const stale = await api('post', `${active}/logs`, owner.token, {
      publicationVersion: 1,
      type: 'watering',
      eventDate: '2026-06-02',
    });
    assert(stale.status === 409 && stale.body.code === 'PUBLICATION_CONFLICT', 'Stale publication must return 409');
    assert(stale.body.latestPublicationVersion === 2 && stale.body.requiresReload === true, 'Stale conflict must include latest version and reload flag');

    const removedWrite = await api('post', `${removed}/logs`, owner.token, {
      publicationVersion: 2,
      type: 'watering',
      eventDate: '2026-06-02',
    });
    assert(removedWrite.status === 409 && removedWrite.body.requiresManualSetup === true, 'Removed zone must return manual-setup 409');
    const activeCountAfterConflicts = await client.query(
      'SELECT COUNT(*)::int AS count FROM zone_cultivation_logs WHERE field_id = $1 AND stable_zone_id = $2',
      [fieldId, activeZoneId]
    );
    assert(activeCountBeforeConflicts.rows[0].count === activeCountAfterConflicts.rows[0].count, 'Conflict requests must not partially mutate logs');
    results.matrix.push('stale and removed-zone writes -> 409 with no partial DB mutation');

    const invalidCases = [
      [undefined, 'missing JSON body'],
      [{ publicationVersion: 'bad', type: 'watering', eventDate: '2026-06-02' }, 'malformed publication version'],
      [{ publicationVersion: 2, type: 'invalid', eventDate: '2026-06-02' }, 'invalid type'],
      [{ publicationVersion: 2, type: 'watering', eventDate: '2026-02-30' }, 'invalid calendar date'],
      [{ publicationVersion: 2, type: 'watering', eventDate: '2026-06-02', amount: -1, unit: 'l' }, 'negative amount'],
      [{ publicationVersion: 2, type: 'watering', eventDate: '2026-06-02', amount: 1 }, 'missing amount unit'],
    ];
    for (const [body, label] of invalidCases) {
      const response = await api('post', `${active}/logs`, owner.token, body);
      assert(response.status === 400, `${label} must return 400`);
    }
    const invalidPage = await api('get', `${active}/logs?limit=0`, owner.token);
    assert(invalidPage.status === 400, 'Invalid pagination must return 400');
    results.matrix.push('publication, payload, date, amount/unit, and pagination validation -> 400');

    const createdLogs = [];
    for (let day = 1; day <= 12; day += 1) {
      const response = await api('post', `${active}/logs`, owner.token, {
        publicationVersion: 2,
        type: day % 2 ? 'watering' : 'fertilizing',
        eventDate: `2026-06-${String(day).padStart(2, '0')}`,
        amount: day,
        unit: 'l',
        product: 'Marker product',
        title: `Log ${day}`,
        note: `Note ${day}`,
      });
      assert(response.status === 201, `Log ${day} creation must succeed`);
      createdLogs.push(response.body.data.log);
    }

    const summary = await api('get', active, owner.token);
    assert(summary.status === 200 && summary.body.data.logs.length === 10, 'Summary must cap recent logs at 10');
    assert(summary.body.data.logs[0].eventDate === '2026-06-12', 'Summary logs must order newest activity first');
    const page = await api('get', `${active}/logs?limit=2&offset=1`, owner.token);
    assert(page.status === 200 && page.body.data.logs.length === 2, 'Paginated logs must apply limit and offset');
    assert(page.body.data.logs[0].eventDate === '2026-06-11', 'Paginated logs must preserve newest-first ordering');
    const capped = await api('get', `${active}/logs?limit=500`, owner.token);
    assert(capped.status === 200 && capped.body.data.pagination.limit === 100, 'Pagination limit must cap at 100');
    const defaultPage = await api('get', `${active}/logs`, owner.token);
    assert(defaultPage.body.data.pagination.limit === 20 && defaultPage.body.data.pagination.offset === 0, 'Pagination defaults must be limit 20 and offset 0');
    results.matrix.push('summary cap and pagination ordering/default/cap -> 200');

    const editableLogId = createdLogs[0].id;
    const patched = await api('patch', `${active}/logs/${editableLogId}`, owner.token, {
      publicationVersion: 2,
      type: 'observation',
      eventDate: '2026-06-20',
      amount: null,
      unit: null,
      note: 'Edited',
    });
    assert(patched.status === 200 && patched.body.data.log.note === 'Edited', 'Owner must patch latest mobile log');
    const patchDb = await client.query('SELECT activity_kind, note FROM zone_cultivation_logs WHERE id = $1', [editableLogId]);
    assert(patchDb.rows[0].activity_kind === 'observation' && patchDb.rows[0].note === 'Edited', 'Patch must persist in DB');

    const foreignLog = await client.query(`
      INSERT INTO zone_cultivation_logs (
        user_id, field_id, stable_zone_id, field_zone_map_id, zone_map_version,
        activity_kind, activity_date, title
      )
      VALUES ($1, $2, $3, $4, 2, 'observation', '2026-06-02', 'Foreign lane proof')
      RETURNING id
    `, [other.id, fieldId, activeZoneId, publishedMapId]);
    const foreignPatch = await api('patch', `${active}/logs/${foreignLog.rows[0].id}`, owner.token, {
      publicationVersion: 2,
      note: 'Must not edit',
    });
    assert(foreignPatch.status === 404 && foreignPatch.body.code === 'LOG_NOT_FOUND', 'Owner must not patch another user log');

    const missingDeleteVersion = await api('delete', `${active}/logs/${editableLogId}`, owner.token);
    assert(missingDeleteVersion.status === 400, 'DELETE must require query-string publicationVersion');
    const deleted = await api('delete', `${active}/logs/${editableLogId}?publicationVersion=2`, owner.token);
    assert(deleted.status === 200 && deleted.body.success === true && deleted.body.data.log.deletedAt, 'DELETE must return JSON soft-delete payload');
    const deleteDb = await client.query('SELECT deleted_at FROM zone_cultivation_logs WHERE id = $1', [editableLogId]);
    assert(deleteDb.rows[0].deleted_at, 'DELETE must persist deleted_at');
    results.matrix.push('log patch ownership and JSON soft-delete -> DB verified');

    const historicalLog = await client.query(`
      INSERT INTO zone_cultivation_logs (
        user_id, field_id, stable_zone_id, field_zone_map_id, zone_map_version,
        activity_kind, activity_date, title
      )
      VALUES ($1, $2, $3, $4, 1, 'observation', '2026-05-01', 'Historical proof')
      RETURNING id
    `, [owner.id, fieldId, activeZoneId, archivedMapId]);
    const historicalPatch = await api('patch', `${active}/logs/${historicalLog.rows[0].id}`, owner.token, {
      publicationVersion: 2,
      note: 'Must stay retained',
    });
    assert(historicalPatch.status === 404, 'Historical retained log must not be mutable through latest-actionable API');
    const visible = await api('get', `${active}/logs?limit=100`, owner.token);
    assert(!visible.body.data.logs.some(log => log.id === historicalLog.rows[0].id), 'Historical log must not appear in MVP latest-actionable list');
    results.matrix.push('historical retained log -> hidden and non-mutable');

    const ambiguousMapId = await createMap(client, fieldId, owner.id, 3, 'published', [
      { id: activeZoneId, code: 'ACTIVE', name: 'Active zone' },
    ]);
    const beforeAmbiguous = await client.query('SELECT COUNT(*)::int AS count FROM zone_cultivation_logs WHERE field_id = $1', [fieldId]);
    const ambiguousWrite = await api('post', `${active}/logs`, owner.token, {
      publicationVersion: 3,
      type: 'observation',
      eventDate: '2026-06-30',
    });
    assert(ambiguousWrite.status === 409 && ambiguousWrite.body.code === 'PUBLICATION_CONFLICT', 'Ambiguous published snapshots must fail closed with 409');
    const afterAmbiguous = await client.query('SELECT COUNT(*)::int AS count FROM zone_cultivation_logs WHERE field_id = $1', [fieldId]);
    assert(beforeAmbiguous.rows[0].count === afterAmbiguous.rows[0].count, 'Ambiguous publication conflict must not partially write');
    await client.query('DELETE FROM field_zone_maps WHERE id = $1', [ambiguousMapId]);
    results.matrix.push('multiple published snapshots -> fail-closed 409 with no partial mutation');

    results.dbProof.fixture = {
      fieldId,
      activeZoneId,
      preProfileZoneId,
      removedZoneId,
      archivedMapId,
      publishedMapId,
      profiles: (await client.query('SELECT COUNT(*)::int AS count FROM zone_cultivation_profiles WHERE field_id = $1', [fieldId])).rows[0].count,
      logs: (await client.query('SELECT COUNT(*)::int AS count FROM zone_cultivation_logs WHERE field_id = $1', [fieldId])).rows[0].count,
      softDeletedLogs: (await client.query('SELECT COUNT(*)::int AS count FROM zone_cultivation_logs WHERE field_id = $1 AND deleted_at IS NOT NULL', [fieldId])).rows[0].count,
    };

    await cleanup(client);
    results.dbProof.after = await counts(client);
    assert(results.dbProof.after.marker_fields === 0 && results.dbProof.after.marker_users === 0, 'Marker fields and users must be cleaned');
    assert(results.dbProof.after.profiles === results.dbProof.before.profiles, 'Profile count must return to baseline');
    assert(results.dbProof.after.logs === results.dbProof.before.logs, 'Log count must return to baseline');

    results.pass = true;
    return results;
  } catch (error) {
    try { await cleanup(client); } catch (_) {}
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  verifyMobileCultivationApi()
    .then(results => console.log(JSON.stringify(results, null, 2)))
    .catch(error => {
      console.error(JSON.stringify({ pass: false, error: error.message }, null, 2));
      process.exitCode = 1;
    })
    .finally(() => pool.end());
} else if (typeof describe === 'function') {
  describe.skip('Phase 02 mobile cultivation API verifier', () => {
    test('run directly against an approved disposable database target', () => {});
  });
}

module.exports = { verifyMobileCultivationApi };
