const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function run() {
  console.log('Dropping old view...');
  await pool.query('DROP VIEW IF EXISTS disease_summary');
  console.log('OK: dropped');

  console.log('Creating new disease_summary view...');
  await pool.query(`
    CREATE VIEW disease_summary AS
    SELECT
      d.id, d.disease_class, d.disease_name_vi, d.disease_name_en,
      d.crop_type, d.severity, d.description, d.symptoms, d.causes, d.source,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'method_type', t.method_type,
          'method_name', t.method_name,
          'description', t.description,
          'application_guide', t.application_guide,
          'frequency', t.frequency,
          'effectiveness', t.effectiveness
        )) FILTER (WHERE t.id IS NOT NULL),
        '[]'
      ) AS treatments,
      COALESCE(
        json_agg(DISTINCT jsonb_build_object(
          'trade_name', p.trade_name,
          'active_ingredient', p.active_ingredient,
          'dosage', p.dosage,
          'pre_harvest_interval', p.pre_harvest_interval,
          'price_range', p.price_range
        )) FILTER (WHERE p.id IS NOT NULL),
        '[]'
      ) AS pesticides
    FROM crop_diseases d
    LEFT JOIN treatment_methods t ON t.disease_id = d.id
    LEFT JOIN pesticide_disease_map pdm ON pdm.disease_id = d.id
    LEFT JOIN pesticides p ON p.id = pdm.pesticide_id
    GROUP BY d.id
  `);
  console.log('OK: view created');

  // Verify
  const result = await pool.query(
    'SELECT disease_class, disease_name_vi, crop_type, json_array_length(treatments::json) as treatments, json_array_length(pesticides::json) as pesticides FROM disease_summary ORDER BY crop_type'
  );
  console.log('\nDisease Summary:');
  for (const r of result.rows) {
    console.log('  [' + r.crop_type + '] ' + r.disease_class + ': ' + r.disease_name_vi + ' (T:' + r.treatments + ' P:' + r.pesticides + ')');
  }
  console.log('\nDone!');
  await pool.end();
}

run();