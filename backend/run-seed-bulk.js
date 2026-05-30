/**
 * Bulk Seed Script — 10,000 Zone Load Test
 *
 * Generates random GeoJSON polygons around Central Vietnam (~108°E, ~16°N)
 * for benchmarking the zone_metrics compound index performance.
 *
 * Prerequisites:
 *   - Run `node run-migration.js` first (creates all tables)
 *   - At least one user must exist
 *
 * Usage:
 *   node run-seed-bulk.js
 *
 * Expected result:
 *   - 100 fields with GeoJSON boundaries
 *   - 100 sub-zones per field = 10,000 total sub-zones
 *   - 100 metrics per sub-zone = 1,000,000 metric rows
 *   - Index query time: <50ms for latest metric per zone
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// ── Configuration ───────────────────────────────────────────

const NUM_FIELDS = 100;
const SUBZONES_PER_FIELD = 100;
const METRICS_PER_ZONE = 100;
const BATCH_SIZE = 500; // Insert batch size for metrics

// Base coordinates: Central Vietnam (~108°E, ~16°N)
const BASE_LNG = 108.0;
const BASE_LAT = 16.0;
const SPREAD = 2.0; // ±2 degrees spread

// ── Helpers ─────────────────────────────────────────────────

/** Random float in [min, max) */
const randRange = (min, max) => min + Math.random() * (max - min);

/** Generate a random rectangular GeoJSON Polygon around a center point */
const randomPolygon = (centerLng, centerLat, sizeLng, sizeLat) => ({
  type: 'Polygon',
  coordinates: [[
    [centerLng - sizeLng / 2, centerLat - sizeLat / 2],
    [centerLng + sizeLng / 2, centerLat - sizeLat / 2],
    [centerLng + sizeLng / 2, centerLat + sizeLat / 2],
    [centerLng - sizeLng / 2, centerLat + sizeLat / 2],
    [centerLng - sizeLng / 2, centerLat - sizeLat / 2], // close ring
  ]],
});

/** Pick a random element from an array */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const CROP_TYPES = ['Tomato', 'Maize', 'Rice', 'Pepper', 'Cucumber', 'Soybean', 'Cassava', 'Coffee'];
const STATUSES = ['HEALTHY', 'HEALTHY', 'HEALTHY', 'HEALTHY', 'WARNING', 'INFECTED']; // weighted

async function run() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  CropVision — Bulk Load Test (10K Zones)');
  console.log('═══════════════════════════════════════════════════════\n');

  // ── 1. Find first user ──
  const userResult = await pool.query('SELECT id, full_name FROM users ORDER BY id ASC LIMIT 1');
  if (userResult.rows.length === 0) {
    console.error('  ERR: No users found. Create a user first.');
    await pool.end();
    return;
  }

  const userId = userResult.rows[0].id;
  console.log(`  User: ${userResult.rows[0].full_name} (${userId})\n`);

  // ── 2. Create fields in batch ──
  console.log(`  Creating ${NUM_FIELDS} fields...`);
  const fieldIds = [];
  const startTime = Date.now();

  for (let f = 0; f < NUM_FIELDS; f++) {
    const lng = BASE_LNG + randRange(-SPREAD, SPREAD);
    const lat = BASE_LAT + randRange(-SPREAD, SPREAD);
    const boundary = randomPolygon(lng, lat, 0.01, 0.008);

    try {
      const result = await pool.query(
        `INSERT INTO fields (user_id, name, crop_type, area, latitude, longitude, boundary, growth_stage, planting_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          userId,
          `Bulk Test Field #${f + 1}`,
          pick(CROP_TYPES),
          Math.floor(randRange(1000, 50000)),
          lat, lng,
          JSON.stringify(boundary),
          pick(['germination', 'seedling', 'vegetative', 'flowering', 'fruiting']),
          '2025-01-15',
        ]
      );
      fieldIds.push(result.rows[0].id);
    } catch (e) {
      console.error(`  ERR field #${f + 1}: ${e.message.substring(0, 60)}`);
    }

    if ((f + 1) % 20 === 0) process.stdout.write(`    ${f + 1}/${NUM_FIELDS} fields...\r`);
  }

  const fieldTime = Date.now() - startTime;
  console.log(`  OK: ${fieldIds.length} fields created (${fieldTime}ms)\n`);

  // ── 3. Create sub-zones ──
  console.log(`  Creating ${SUBZONES_PER_FIELD} sub-zones per field (${fieldIds.length * SUBZONES_PER_FIELD} total)...`);
  const subZoneIds = [];
  const szStartTime = Date.now();

  for (const fieldId of fieldIds) {
    // Get field center for sub-zone generation
    const fieldResult = await pool.query('SELECT latitude, longitude FROM fields WHERE id = $1', [fieldId]);
    const fLat = parseFloat(fieldResult.rows[0].latitude);
    const fLng = parseFloat(fieldResult.rows[0].longitude);

    for (let z = 0; z < SUBZONES_PER_FIELD; z++) {
      const offsetLng = fLng + randRange(-0.004, 0.004);
      const offsetLat = fLat + randRange(-0.003, 0.003);
      const szBoundary = randomPolygon(offsetLng, offsetLat, 0.002, 0.0015);

      try {
        const result = await pool.query(
          `INSERT INTO sub_zones (field_id, crop_type, boundary, status, planting_date, fertilize_freq, spray_freq)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [
            fieldId,
            pick(CROP_TYPES),
            JSON.stringify(szBoundary),
            pick(STATUSES),
            '2025-02-01',
            Math.floor(randRange(7, 28)),
            Math.floor(randRange(5, 21)),
          ]
        );
        subZoneIds.push(result.rows[0].id);
      } catch (e) {
        // Skip duplicates
      }
    }

    process.stdout.write(`    ${subZoneIds.length} sub-zones...\r`);
  }

  const szTime = Date.now() - szStartTime;
  console.log(`  OK: ${subZoneIds.length} sub-zones created (${szTime}ms)\n`);

  // ── 4. Insert metrics in batches ──
  const totalMetrics = subZoneIds.length * METRICS_PER_ZONE;
  console.log(`  Generating ${totalMetrics} metric rows (${METRICS_PER_ZONE} per zone)...`);
  const metricStartTime = Date.now();

  let inserted = 0;
  for (let batch = 0; batch < subZoneIds.length; batch += BATCH_SIZE) {
    const batchIds = subZoneIds.slice(batch, batch + BATCH_SIZE);
    const values = [];
    const params = [];
    let paramIdx = 1;

    for (const szId of batchIds) {
      for (let m = 0; m < METRICS_PER_ZONE; m++) {
        const hour = m % 24;
        const temp = 30 + 5 * Math.sin(((hour - 7) * Math.PI) / 12) + (Math.random() - 0.5);
        const hum = 70 - 15 * Math.sin(((hour - 7) * Math.PI) / 12) + (Math.random() - 0.5);

        values.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5}, $${paramIdx + 6})`);
        params.push(
          szId,
          Math.floor(Math.random() * 15) + 85,
          temp.toFixed(2), hum.toFixed(2),
          (Math.floor(Math.random() * 10) + 65),
          (6.5 + (Math.random() - 0.5) * 0.2).toFixed(2),
          (1.5 + (Math.random() - 0.5) * 0.2).toFixed(2)
        );
        paramIdx += 7;
      }
    }

    // Use INSERT with VALUES for batch performance
    const sql = `INSERT INTO zone_metrics (sub_zone_id, health_score, temperature, humidity, soil_moisture, ph, ec) VALUES ${values.join(', ')}`;

    try {
      await pool.query(sql, params);
      inserted += batchIds.length * METRICS_PER_ZONE;
    } catch (e) {
      console.error(`  ERR batch at ${batch}: ${e.message.substring(0, 80)}`);
    }

    process.stdout.write(`    ${inserted}/${totalMetrics} metrics...\r`);
  }

  const metricTime = Date.now() - metricStartTime;
  console.log(`  OK: ${inserted} metrics inserted (${metricTime}ms)\n`);

  // ── 5. Benchmark index performance ──
  console.log('  ── Benchmarking Index Performance ──\n');

  // Test: Query latest metric for a random sub-zone
  const testZoneId = subZoneIds[Math.floor(Math.random() * subZoneIds.length)];

  const benchStart = process.hrtime.bigint();
  const benchResult = await pool.query(
    `SELECT * FROM zone_metrics WHERE sub_zone_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [testZoneId]
  );
  const benchEnd = process.hrtime.bigint();
  const benchMs = Number(benchEnd - benchStart) / 1_000_000;

  console.log(`  Latest metric query (zone ${testZoneId}):`);
  console.log(`    Rows returned: ${benchResult.rows.length}`);
  console.log(`    Query time:    ${benchMs.toFixed(2)} ms`);
  console.log(`    Target:        < 50 ms → ${benchMs < 50 ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test: Count total metrics
  const countStart = process.hrtime.bigint();
  const countResult = await pool.query('SELECT COUNT(*) FROM zone_metrics');
  const countEnd = process.hrtime.bigint();
  const countMs = Number(countEnd - countStart) / 1_000_000;

  console.log(`  Total metric count query:`);
  console.log(`    Total rows:  ${countResult.rows[0].count}`);
  console.log(`    Query time:  ${countMs.toFixed(2)} ms\n`);

  // Test: Scan all sub-zones (simulates epidemic scan)
  const scanStart = process.hrtime.bigint();
  const scanResult = await pool.query(
    `SELECT id, field_id, boundary, crop_type, status FROM sub_zones LIMIT 10000`
  );
  const scanEnd = process.hrtime.bigint();
  const scanMs = Number(scanEnd - scanStart) / 1_000_000;

  console.log(`  Sub-zone bulk scan (all zones):`);
  console.log(`    Zones scanned: ${scanResult.rows.length}`);
  console.log(`    Query time:    ${scanMs.toFixed(2)} ms\n`);

  // ── 6. Summary ──
  const totalTime = Date.now() - startTime;
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Bulk Seed Complete — Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Fields:      ${fieldIds.length}`);
  console.log(`  Sub-zones:   ${subZoneIds.length}`);
  console.log(`  Metrics:     ${inserted}`);
  console.log(`  Total time:  ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`  Index perf:  ${benchMs.toFixed(2)} ms (target: <50ms)`);
  console.log('═══════════════════════════════════════════════════════');

  await pool.end();
}

run();