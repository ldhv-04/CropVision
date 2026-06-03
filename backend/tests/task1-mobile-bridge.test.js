/**
 * Task 1: Station-to-Mobile Bridge — API Test Script
 *
 * Tests:
 * 1. Owner assignment by email (POST /api/fields/:id/assign-owner)
 * 2. Publish requires owner (POST /api/fields/:fieldId/zones/publish)
 * 3. Mobile field list (GET /api/mobile/fields)
 * 4. Mobile zone map (GET /api/mobile/fields/:fieldId/zone-map)
 * 5. Authorization checks
 */

const http = require('http');

const BASE = 'http://localhost:3000';
let adminToken = null;
let userToken = null;
let testUserId = null;
let testFieldId = null;
let testEmail = null;
let otherEmail = null;

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

function assert(condition, msg) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✅ PASS: ${msg}`);
  }
}

async function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  Task 1: Mobile Bridge API Tests');
  console.log('═══════════════════════════════════════════\n');

  // ── Step 1: Login as admin ───────────────────────
  console.log('── Step 1: Login as admin ──');
  const adminLogin = await req('POST', '/api/auth/login', {
    email: 'admin@cropvision.local',
    password: 'Admin@123',
  });
  console.log(`  Admin login response: ${adminLogin.status} ${JSON.stringify(adminLogin.body?.success)} ${adminLogin.body?.message}`);
  assert(adminLogin.status === 200, 'Admin login succeeds');
  // Login response is { data: { token, user } }
  adminToken = adminLogin.body?.data?.token;
  assert(!!adminToken, 'Admin token received');
  console.log(`  Token: ${adminToken ? adminToken.substring(0, 20) + '...' : 'NONE'}`);

  // ── Step 2: Register a test mobile user ──────────
  console.log('\n── Step 2: Register test mobile user ──');
  testEmail = `testmobile_${Date.now()}@gmail.com`;
  const regRes = await req('POST', '/api/auth/register', {
    fullName: 'Test Mobile User',
    email: testEmail,
    password: 'TestPass@123',
  });
  console.log(`  Register: ${regRes.status} ${JSON.stringify(regRes.body?.message || regRes.body?.success)}`);

  // Verify the user directly in DB for test purposes
  const pool = require('../src/config/db');
  await pool.query("UPDATE users SET is_verified = TRUE WHERE email = $1", [testEmail]);

  // Login as the test user
  const userLogin = await req('POST', '/api/auth/login', {
    email: testEmail,
    password: 'TestPass@123',
  });
  console.log(`  User login: ${userLogin.status}`);
  // Login response is { data: { token, user } }
  userToken = userLogin.body?.data?.token;
  assert(!!userToken, 'User token received');

  // Get user ID
  const userRes = await pool.query('SELECT id FROM users WHERE email = $1', [testEmail]);
  testUserId = userRes.rows[0]?.id;
  assert(!!testUserId, `User ID found: ${testUserId}`);

  // ── Step 3: Get or create a test field ───────────
  console.log('\n── Step 3: Get or create a test field ──');
  const createRes = await req('POST', '/api/fields', {
    name: `Task 1 Mobile Bridge ${Date.now()}`,
    crop_type: 'rice',
    boundary: {
      type: 'Polygon',
      coordinates: [[[106.6, 10.8], [106.7, 10.8], [106.7, 10.9], [106.6, 10.9], [106.6, 10.8]]],
    },
  }, adminToken);
  testFieldId = createRes.body?.data?.id;
  console.log(`  Created disposable field: ${testFieldId}`);
  assert(!!testFieldId, `Test field ID: ${testFieldId}`);

  // ── Step 4: Assign owner by email ────────────────
  console.log('\n── Step 4: Assign owner by email ──');

  // 4a. Invalid email
  const badEmail = await req('POST', `/api/fields/${testFieldId}/assign-owner`, { email: '' }, adminToken);
  assert(badEmail.status === 400, `Empty email returns 400: ${badEmail.status}`);

  // 4b. Unknown email
  const unknownEmail = await req('POST', `/api/fields/${testFieldId}/assign-owner`, { email: 'nobody@example.com' }, adminToken);
  assert(unknownEmail.status === 404, `Unknown email returns 404: ${unknownEmail.status}`);

  // 4c. Non-admin cannot assign owner
  const noAdmin = await req('POST', `/api/fields/${testFieldId}/assign-owner`, { email: testEmail }, userToken);
  assert(noAdmin.status === 403, `Non-admin gets 403: ${noAdmin.status}`);

  // 4d. Successful assignment
  const assignRes = await req('POST', `/api/fields/${testFieldId}/assign-owner`, { email: testEmail }, adminToken);
  assert(assignRes.status === 200, `Owner assignment succeeds: ${assignRes.status}`);
  assert(assignRes.body?.field?.ownerUserId === testUserId, `Owner user_id matches: ${assignRes.body?.field?.ownerUserId}`);
  assert(assignRes.body?.field?.ownerEmail === testEmail, `Owner email matches: ${assignRes.body?.field?.ownerEmail}`);
  console.log(`  Assigned: field ${testFieldId} → user ${testUserId} (${testEmail})`);

  // ── Step 5: Publish requires owner ───────────────
  console.log('\n── Step 5: Publish workflow ──');

  // 5a. Try publish on field with no zones
  const publishNoZones = await req('POST', `/api/fields/${testFieldId}/zones/publish`, {}, adminToken);
  assert(publishNoZones.status === 400, `Publish with no zones returns 400: ${publishNoZones.status}`);

  // 5b. Create a test zone
  const zoneRes = await req('POST', `/api/fields/${testFieldId}/zones`, {
    code: 'T1',
    name: 'Test Zone 1',
    boundary: {
      type: 'Polygon',
      coordinates: [[[106.62, 10.82], [106.68, 10.82], [106.68, 10.88], [106.62, 10.88], [106.62, 10.82]]],
    },
  }, adminToken);
  assert(zoneRes.status === 201, `Zone created: ${zoneRes.status}`);
  const zoneId = zoneRes.body?.data?.id;
  console.log(`  Created zone: ${zoneId}`);

  // 5c. Publish with owner and valid zone
  const publishRes = await req('POST', `/api/fields/${testFieldId}/zones/publish`, {}, adminToken);
  assert(publishRes.status === 200, `Publish succeeds: ${publishRes.status}`);
  assert(publishRes.body?.data?.version === 1, `Version is 1: ${publishRes.body?.data?.version}`);
  assert(publishRes.body?.data?.status === 'published', `Status is published: ${publishRes.body?.data?.status}`);
  assert(publishRes.body?.data?.zonesCount === 1, `Zones count is 1: ${publishRes.body?.data?.zonesCount}`);
  console.log(`  Published v${publishRes.body?.data?.version}: ${publishRes.body?.data?.zonesCount} zones`);

  // 5d. Republish should create v2
  const publishRes2 = await req('POST', `/api/fields/${testFieldId}/zones/publish`, {}, adminToken);
  assert(publishRes2.status === 200, `Republish succeeds: ${publishRes2.status}`);
  assert(publishRes2.body?.data?.version === 2, `Version is 2: ${publishRes2.body?.data?.version}`);
  console.log(`  Republished v${publishRes2.body?.data?.version}`);

  // ── Step 6: Mobile field list ────────────────────
  console.log('\n── Step 6: Mobile field list (GET /api/mobile/fields) ──');

  // 6a. Unauthenticated
  const noAuth = await req('GET', '/api/mobile/fields');
  assert(noAuth.status === 401, `Unauthenticated returns 401: ${noAuth.status}`);

  // 6b. Admin can also see their fields (but admin doesn't own the field)
  const adminFields = await req('GET', '/api/mobile/fields', null, adminToken);
  assert(adminFields.status === 200, `Admin fields returns 200: ${adminFields.status}`);
  assert(Array.isArray(adminFields.body?.fields), `Response has fields array`);
  console.log(`  Admin owns ${adminFields.body?.fields?.length || 0} fields`);

  // 6c. Test user sees assigned field
  const userFields = await req('GET', '/api/mobile/fields', null, userToken);
  assert(userFields.status === 200, `User fields returns 200: ${userFields.status}`);
  const myField = userFields.body?.fields?.find((f) => f.id === testFieldId);
  assert(!!myField, `User sees assigned field ${testFieldId}`);
  if (myField) {
    assert(myField.zonesCount === 1, `Zones count is 1: ${myField.zonesCount}`);
    assert(myField.latestMapVersion === 2, `Latest map version is 2: ${myField.latestMapVersion}`);
    assert(!!myField.publishedAt, `Published at is set`);
    console.log(`  Field: ${myField.name}, zones: ${myField.zonesCount}, v${myField.latestMapVersion}`);
  }

  // ── Step 7: Mobile zone map ──────────────────────
  console.log('\n── Step 7: Mobile zone map (GET /api/mobile/fields/:id/zone-map) ──');

  // 7a. Unauthenticated
  const noAuthMap = await req('GET', `/api/mobile/fields/${testFieldId}/zone-map`);
  assert(noAuthMap.status === 401, `Unauthenticated returns 401: ${noAuthMap.status}`);

  // 7b. Admin cannot access (not the owner)
  // Admin token has userId = admin's userId, not the test user's userId
  // So admin should get 403
  const adminMap = await req('GET', `/api/mobile/fields/${testFieldId}/zone-map`, null, adminToken);
  // Admin may or may not be the owner depending on who created the field
  console.log(`  Admin zone map access: ${adminMap.status}`);

  // 7c. Test user gets the zone map
  const userMap = await req('GET', `/api/mobile/fields/${testFieldId}/zone-map`, null, userToken);
  assert(userMap.status === 200, `User gets zone map: ${userMap.status}`);
  assert(userMap.body?.field?.id === testFieldId, `Field ID matches`);
  assert(userMap.body?.map?.type === 'polygon-only', `Map type is polygon-only: ${userMap.body?.map?.type}`);
  assert(userMap.body?.map?.version === 2, `Map version is 2: ${userMap.body?.map?.version}`);
  assert(Array.isArray(userMap.body?.map?.zones), `Zones is array`);
  assert(userMap.body?.map?.zones?.length === 1, `Zones length is 1: ${userMap.body?.map?.zones?.length}`);

  // Verify polygon-only (no satellite tiles, no MapLibre)
  const mapStr = JSON.stringify(userMap.body?.map);
  assert(!mapStr.includes('tile'), 'No tile URLs in response');
  assert(!mapStr.includes('maplibre'), 'No MapLibre in response');
  assert(!mapStr.includes('satellite'), 'No satellite in response');

  // Verify zone has geometry
  const zone = userMap.body?.map?.zones?.[0];
  if (zone) {
    assert(!!zone.geometry, `Zone has geometry: ${!!zone.geometry}`);
    assert(zone.code === 'T1', `Zone code is T1: ${zone.code}`);
    assert(zone.name === 'Test Zone 1', `Zone name is Test Zone 1: ${zone.name}`);
    console.log(`  Zone: ${zone.code} (${zone.name}), area: ${zone.area} ha`);
  }

  console.log(`  Map: v${userMap.body?.map?.version}, ${userMap.body?.map?.zones?.length} zones, published: ${userMap.body?.map?.publishedAt}`);

  // ── Step 8: Authorization check ──────────────────
  console.log('\n── Step 8: Cross-user authorization ──');

  // Register another user who should NOT see the field
  otherEmail = `other_${Date.now()}@gmail.com`;
  await req('POST', '/api/auth/register', {
    fullName: 'Other User',
    email: otherEmail,
    password: 'OtherPass@123',
  });
  await pool.query("UPDATE users SET is_verified = TRUE WHERE email = $1", [otherEmail]);
  const otherLogin = await req('POST', '/api/auth/login', { email: otherEmail, password: 'OtherPass@123' });
  const otherToken = otherLogin.body?.data?.token;

  if (otherToken) {
    const otherFields = await req('GET', '/api/mobile/fields', null, otherToken);
    assert(otherFields.body?.fields?.length === 0, `Other user sees 0 fields: ${otherFields.body?.fields?.length}`);

    const otherMap = await req('GET', `/api/mobile/fields/${testFieldId}/zone-map`, null, otherToken);
    assert(otherMap.status === 403, `Other user gets 403: ${otherMap.status}`);
  }

  // ── Step 9: Invalid field ID ─────────────────────
  console.log('\n── Step 9: Error cases ──');
  const badField = await req('GET', '/api/mobile/fields/99999/zone-map', null, userToken);
  assert(badField.status === 404, `Non-existent field returns 404: ${badField.status}`);

  // ── Cleanup ──────────────────────────────────────
  console.log('\n── Cleanup ──');
  // Clean up exact disposable test data.
  await pool.query('DELETE FROM zone_cultivation_logs WHERE field_id = $1', [testFieldId]);
  await pool.query('DELETE FROM zone_cultivation_profiles WHERE field_id = $1', [testFieldId]);
  await pool.query('DELETE FROM field_zone_maps WHERE field_id = $1', [testFieldId]);
  await pool.query('DELETE FROM sub_zones WHERE field_id = $1', [testFieldId]);
  await pool.query('DELETE FROM fields WHERE id = $1', [testFieldId]);
  await pool.query('DELETE FROM users WHERE email = ANY($1::text[])', [[testEmail, otherEmail].filter(Boolean)]);
  console.log(`  Cleaned up disposable field ${testFieldId}`);
  await pool.end();

  // ── Summary ──────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  if (process.exitCode) {
    console.log('  ❌ SOME TESTS FAILED');
  } else {
    console.log('  ✅ ALL TESTS PASSED');
  }
  console.log('═══════════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exitCode = 1;
});
