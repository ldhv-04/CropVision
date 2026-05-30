/**
 * Seed Script — Geo-Spatial & Epidemic Module Test Data
 *
 * Creates sample fields with GeoJSON polygon boundaries and sub-zones
 * to enable testing of the epidemic dispersion model and telemetry simulation.
 *
 * Prerequisites:
 *   - Run 004-geo-epidemic.sql migration first
 *   - At least one user must exist in the `users` table
 *
 * Usage:
 *   node run-seed-geo.js
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

/**
 * GeoJSON Polygon helper — creates a closed polygon from a set of [lng, lat] vertices.
 * Automatically appends the first vertex to close the ring.
 */
function makeGeoJsonPolygon(vertices) {
  return {
    type: 'Polygon',
    coordinates: [[...vertices, vertices[0]]],
  };
}

// ── Sample GeoJSON boundaries (centred around Central Vietnam, ~108°E, ~16°N) ──

/** Main field boundary — ~1km × 0.8km rectangular farm plot */
const FIELD_BOUNDARY = makeGeoJsonPolygon([
  [108.2000, 16.0500],
  [108.2090, 16.0500],
  [108.2090, 16.0570],
  [108.2000, 16.0570],
]);

/** Sub-zone A — Tomato plot (northwest quarter) */
const SUB_ZONE_A = makeGeoJsonPolygon([
  [108.2002, 16.0535],
  [108.2045, 16.0535],
  [108.2045, 16.0568],
  [108.2002, 16.0568],
]);

/** Sub-zone B — Maize plot (northeast quarter) */
const SUB_ZONE_B = makeGeoJsonPolygon([
  [108.2048, 16.0535],
  [108.2088, 16.0535],
  [108.2088, 16.0568],
  [108.2048, 16.0568],
]);

/** Sub-zone C — Rice plot (south half) */
const SUB_ZONE_C = makeGeoJsonPolygon([
  [108.2002, 16.0502],
  [108.2088, 16.0502],
  [108.2088, 16.0532],
  [108.2002, 16.0532],
]);

async function run() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  CropVision — Geo-Spatial & Epidemic Module Seed');
  console.log('═══════════════════════════════════════════════════════\n');

  // ── 1. Find the farmer user ──
  let userResult = await pool.query("SELECT id, full_name FROM users WHERE email = 'farmer@cropvision.local' LIMIT 1");
  if (userResult.rows.length === 0) {
    userResult = await pool.query('SELECT id, full_name FROM users ORDER BY id ASC LIMIT 1');
  }

  if (userResult.rows.length === 0) {
    console.error('  ERR: No users found in database. Create a user first.');
    await pool.end();
    return;
  }

  const userId = userResult.rows[0].id;
  const userName = userResult.rows[0].full_name;
  console.log(`  Using user: ${userName} (id=${userId})\n`);

  // ── 2. Create a sample field with GeoJSON boundary ──
  console.log('  Creating sample field with GeoJSON boundary...');
  let fieldId;
  const SEED_FIELD_NAME = 'Nong trai mau — Quang Nam';

  try {
    // Check if the seed field already exists for this user (deduplication)
    const existingField = await pool.query(
      'SELECT id FROM fields WHERE user_id = $1 AND name = $2 LIMIT 1',
      [userId, SEED_FIELD_NAME]
    );

    if (existingField.rows.length > 0) {
      fieldId = existingField.rows[0].id;
      console.log(`  SKIP: Seed field already exists (id=${fieldId})`);
    } else {
      const fieldResult = await pool.query(
        `INSERT INTO fields (user_id, name, crop_type, area, latitude, longitude, boundary, growth_stage, planting_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          userId,
          SEED_FIELD_NAME,
          'Mixed',
          8000,                                      // ~8000 m²
          16.0535,                                   // latitude (centre)
          108.2045,                                  // longitude (centre)
          JSON.stringify(FIELD_BOUNDARY),
          'vegetative',
          '2025-03-15',
        ]
      );
      fieldId = fieldResult.rows[0].id;
      console.log(`  OK: Field created (id=${fieldId})`);
    }
  } catch (e) {
    console.error('  ERR creating field:', e.message);
    await pool.end();
    return;
  }

  // ── 3. Create sub-zones within the field ──
  const subZones = [
    { crop_type: 'Tomato', boundary: SUB_ZONE_A, planting_date: '2025-03-15', fertilize_freq: 14, spray_freq: 10 },
    { crop_type: 'Maize',  boundary: SUB_ZONE_B, planting_date: '2025-03-20', fertilize_freq: 21, spray_freq: 14 },
    { crop_type: 'Rice',   boundary: SUB_ZONE_C, planting_date: '2025-04-01', fertilize_freq: 14, spray_freq: 7 },
  ];

  console.log('\n  Creating sub-zones...');
  const subZoneIds = [];

  for (const sz of subZones) {
    try {
      const result = await pool.query(
        `INSERT INTO sub_zones (field_id, crop_type, boundary, planting_date, fertilize_freq, spray_freq)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          fieldId,
          sz.crop_type,
          JSON.stringify(sz.boundary),
          sz.planting_date,
          sz.fertilize_freq,
          sz.spray_freq,
        ]
      );
      subZoneIds.push(result.rows[0].id);
      console.log(`  OK: Sub-zone "${sz.crop_type}" created (id=${result.rows[0].id})`);
    } catch (e) {
      console.log(`  SKIP: Sub-zone "${sz.crop_type}": ${e.message.substring(0, 80)}`);
    }
  }

  // ── 4. Generate initial mock metrics for each sub-zone ──
  if (subZoneIds.length > 0) {
    console.log('\n  Generating initial telemetry metrics...');

    for (const szId of subZoneIds) {
      try {
        // Insert 5 metric snapshots (simulating 5 hours of data)
        for (let h = 0; h < 5; h++) {
          const hour = (new Date().getHours() - 4 + h + 24) % 24;
          const temp = 30 + 5 * Math.sin(((hour - 7) * Math.PI) / 12);
          const hum = 70 - 15 * Math.sin(((hour - 7) * Math.PI) / 12);

          await pool.query(
            `INSERT INTO zone_metrics (sub_zone_id, health_score, temperature, humidity, soil_moisture, ph, ec)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              szId,
              Math.floor(Math.random() * 15) + 85,  // healthy: 85-100
              temp + (Math.random() - 0.5) * 0.3,
              hum + (Math.random() - 0.5) * 0.3,
              Math.floor(Math.random() * 10) + 65,
              6.5 + (Math.random() - 0.5) * 0.2,
              1.5 + (Math.random() - 0.5) * 0.2,
            ]
          );
        }
        console.log(`  OK: 5 metric snapshots for sub-zone ${szId}`);
      } catch (e) {
        console.log(`  ERR: Metrics for sub-zone ${szId}: ${e.message.substring(0, 80)}`);
      }
    }
  }

  // ── 5. Verify data ──
  console.log('\n  Verifying seeded data...');
  try {
    const fieldCount = await pool.query('SELECT COUNT(*) FROM fields WHERE boundary IS NOT NULL');
    const subZoneCount = await pool.query('SELECT COUNT(*) FROM sub_zones');
    const metricCount = await pool.query('SELECT COUNT(*) FROM zone_metrics');

    console.log(`  Fields with boundaries: ${fieldCount.rows[0].count}`);
    console.log(`  Sub-zones:              ${subZoneCount.rows[0].count}`);
    console.log(`  Zone metrics:           ${metricCount.rows[0].count}`);
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Seed complete! You can now test the geo-epidemic API.');
    console.log('═══════════════════════════════════════════════════════');
  } catch (e) {
    console.error('  ERR verifying:', e.message);
  }

  await pool.end();
}

run();