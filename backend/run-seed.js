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
  // 1. Create disease_summary view
  console.log('Creating disease_summary view...');
  try {
    await pool.query(`
      CREATE OR REPLACE VIEW disease_summary AS
      SELECT 
        d.id, d.disease_class, d.disease_name_vi, d.crop_type, d.severity, d.description, d.symptoms,
        COALESCE(json_agg(json_build_object('method_type', t.method_type, 'method_name', t.method_name, 'effectiveness', t.effectiveness)) FILTER (WHERE t.id IS NOT NULL), '[]') AS treatments,
        COALESCE(json_agg(json_build_object('trade_name', p.trade_name, 'active_ingredient', p.active_ingredient, 'dosage', p.dosage, 'pre_harvest_interval', p.pre_harvest_interval)) FILTER (WHERE p.id IS NOT NULL), '[]') AS pesticides
      FROM crop_diseases d
      LEFT JOIN treatment_methods t ON t.disease_id = d.id
      LEFT JOIN pesticide_disease_map pdm ON pdm.disease_id = d.id
      LEFT JOIN pesticides p ON p.id = pdm.pesticide_id
      GROUP BY d.id, d.disease_class, d.disease_name_vi, d.crop_type, d.severity, d.description, d.symptoms
    `);
    console.log('  OK: disease_summary view created');
  } catch (e) {
    console.log('  ERR:', e.message);
  }

  // 2. Insert treatment_methods
  console.log('Inserting treatment_methods...');
  const treatments = [
    // Bacterial Spot (Tomato)
    `INSERT INTO treatment_methods (disease_id, method_type, method_name, description, application_guide, frequency, effectiveness)
     SELECT id, 'chemical', 'Phun dong (Copper-based)', 'Su dung thuoc dong de kiem soat vi khuan.', 'Phun 1-2 lan/tuan, phun vao buoi sang som.', '1-2 lan/tuan', 4
     FROM crop_diseases WHERE disease_class = 'Tomato___Bacterial_spot' ON CONFLICT DO NOTHING`,
    `INSERT INTO treatment_methods (disease_id, method_type, method_name, description, application_guide, frequency, effectiveness)
     SELECT id, 'cultural', 'Xoay vu + lam sach vuon', 'Thay doi vi tri trong hang nam, loai bo cay benh.', 'Gieo trong cach cay cu it nhat 200m.', 'Moi vu', 3
     FROM crop_diseases WHERE disease_class = 'Tomato___Bacterial_spot' ON CONFLICT DO NOTHING`,
    `INSERT INTO treatment_methods (disease_id, method_type, method_name, description, application_guide, frequency, effectiveness)
     SELECT id, 'biological', 'Su dung che pham sinh hoc', 'Su dung Bacillus subtilis de uc che vi khuan.', 'Phun che pham sinh hoc theo huong dan.', '1 lan/tuan', 3
     FROM crop_diseases WHERE disease_class = 'Tomato___Bacterial_spot' ON CONFLICT DO NOTHING`,
    // Late Blight (Tomato)
    `INSERT INTO treatment_methods (disease_id, method_type, method_name, description, application_guide, frequency, effectiveness)
     SELECT id, 'chemical', 'Phun Mancozeb + Metalaxyl', 'Ket hop thuoc BVTV de kiem soat nam Phytophthora.', 'Phun ngay khi phat hien trieu chung. 5-7 ngay/lan.', '5-7 ngay/lan', 5
     FROM crop_diseases WHERE disease_class = 'Tomato___Late_blight' ON CONFLICT DO NOTHING`,
    `INSERT INTO treatment_methods (disease_id, method_type, method_name, description, application_guide, frequency, effectiveness)
     SELECT id, 'cultural', 'Loai bo cay benh + thong khi', 'Cat bo ngay phan cay bi benh, tang khoang cach trong.', 'Cat bo va dot cay benh. Trong thưa, tia canh.', 'Lien tuc', 4
     FROM crop_diseases WHERE disease_class = 'Tomato___Late_blight' ON CONFLICT DO NOTHING`,
    // Early Blight (Tomato)
    `INSERT INTO treatment_methods (disease_id, method_type, method_name, description, application_guide, frequency, effectiveness)
     SELECT id, 'chemical', 'Phun Chlorothalonil', 'Su dung thuoc co chua Chlorothalonil de phong tru nam Alternaria.', 'Phun khi thay dom dau tien. 7-10 ngay/lan.', '7-10 ngay/lan', 4
     FROM crop_diseases WHERE disease_class = 'Tomato___Early_blight' ON CONFLICT DO NOTHING`,
    // Yellow Leaf Curl Virus
    `INSERT INTO treatment_methods (disease_id, method_type, method_name, description, application_guide, frequency, effectiveness)
     SELECT id, 'cultural', 'Diet rep phan trang + luoi chan', 'Kiem soat rep phan trang — vector truyen benh.', 'Lap luoi 50 mesh quanh nha kinh.', 'Lien tuc', 4
     FROM crop_diseases WHERE disease_class = 'Tomato___Yellow_Leaf_Curl_Virus' ON CONFLICT DO NOTHING`,
    `INSERT INTO treatment_methods (disease_id, method_type, method_name, description, application_guide, frequency, effectiveness)
     SELECT id, 'cultural', 'Chon giong khang benh', 'Su dung giong ca chua co gen khang TYLCV.', 'Mua giong tu nha cung cap uy tin.', 'Moi vu', 5
     FROM crop_diseases WHERE disease_class = 'Tomato___Yellow_Leaf_Curl_Virus' ON CONFLICT DO NOTHING`,
  ];

  for (const sql of treatments) {
    try {
      await pool.query(sql);
      console.log('  OK: treatment inserted');
    } catch (e) {
      console.log('  SKIP:', e.message.substring(0, 80));
    }
  }

  // 3. Insert pesticides
  console.log('Inserting pesticides...');
  const pesticides = [
    `INSERT INTO pesticides (trade_name, active_ingredient, concentration, manufacturer, dosage, application_method, safety_precautions, pre_harvest_interval, price_range) VALUES
    ('Boocil 50WP', 'Copper hydroxide', '50WP', 'Bayer', '30-40g/20 lit nuoc', 'Phun deu la', ARRAY['Deo gang tay cao su', 'Mac ao bao ho'], 3, 'Trung binh'),
    ('Dithane M-45 80WP', 'Mancozeb', '80WP', 'Corteva', '30-40g/20 lit nuoc', 'Phun khi troi kho rao', ARRAY['Deo gang tay', 'Mat na phong doc'], 7, 'Re'),
    ('Ridomil Gold 68WP', 'Metalaxyl + Mancozeb', '68WP', 'Syngenta', '20-25g/20 lit nuoc', 'Phun goc hoac phun la', ARRAY['Deo gang tay', 'Kinh bao ho'], 14, 'Cao'),
    ('Daconil 75WP', 'Chlorothalonil', '75WP', 'Syngenta', '25-30g/20 lit nuoc', 'Phun khi troi mat', ARRAY['Deo gang tay', 'Mat na', 'Ao bao ho'], 7, 'Trung binh'),
    ('Confidor 200SL', 'Imidacloprid', '200SL', 'Bayer', '2-3ml/20 lit nuoc', 'Phun khi thay rep', ARRAY['Deo gang tay', 'Mat na', 'Tranh ao ca'], 14, 'Trung binh'),
    ('Trichoderma Harzianum', 'Trichoderma harzianum', 'SP', 'NN Sinh hoc', '5g/20 lit nuoc', 'Phun dat va la', ARRAY['Bao quan noi kho mat'], 0, 'Re'),
    ('Bacsub 1000WP', 'Bacillus subtilis', '1000WP', 'CN Sinh hoc', '10-15g/20 lit nuoc', 'Phun la khi troi mat', ARRAY['Bao quan noi mat', 'Dung ngay sau khi pha'], 0, 'Trung binh')
    ON CONFLICT DO NOTHING`,
  ];

  for (const sql of pesticides) {
    try {
      await pool.query(sql);
      console.log('  OK: pesticides inserted');
    } catch (e) {
      console.log('  SKIP:', e.message.substring(0, 80));
    }
  }

  // 4. Insert pesticide-disease mappings
  console.log('Inserting pesticide-disease mappings...');
  const mappings = [
    `INSERT INTO pesticide_disease_map (pesticide_id, disease_id, effectiveness)
     SELECT p.id, d.id, 4 FROM pesticides p, crop_diseases d
     WHERE p.trade_name = 'Boocil 50WP' AND d.disease_class = 'Tomato___Bacterial_spot' ON CONFLICT DO NOTHING`,
    `INSERT INTO pesticide_disease_map (pesticide_id, disease_id, effectiveness)
     SELECT p.id, d.id, 5 FROM pesticides p, crop_diseases d
     WHERE p.trade_name = 'Ridomil Gold 68WP' AND d.disease_class = 'Tomato___Late_blight' ON CONFLICT DO NOTHING`,
    `INSERT INTO pesticide_disease_map (pesticide_id, disease_id, effectiveness)
     SELECT p.id, d.id, 4 FROM pesticides p, crop_diseases d
     WHERE p.trade_name = 'Dithane M-45 80WP' AND d.disease_class = 'Tomato___Late_blight' ON CONFLICT DO NOTHING`,
    `INSERT INTO pesticide_disease_map (pesticide_id, disease_id, effectiveness)
     SELECT p.id, d.id, 4 FROM pesticides p, crop_diseases d
     WHERE p.trade_name = 'Daconil 75WP' AND d.disease_class = 'Tomato___Early_blight' ON CONFLICT DO NOTHING`,
    `INSERT INTO pesticide_disease_map (pesticide_id, disease_id, effectiveness)
     SELECT p.id, d.id, 4 FROM pesticides p, crop_diseases d
     WHERE p.trade_name = 'Confidor 200SL' AND d.disease_class = 'Tomato___Yellow_Leaf_Curl_Virus' ON CONFLICT DO NOTHING`,
    `INSERT INTO pesticide_disease_map (pesticide_id, disease_id, effectiveness)
     SELECT p.id, d.id, 3 FROM pesticides p, crop_diseases d
     WHERE p.trade_name = 'Trichoderma Harzianum' AND d.disease_class = 'Tomato___Leaf_Mold' ON CONFLICT DO NOTHING`,
    `INSERT INTO pesticide_disease_map (pesticide_id, disease_id, effectiveness)
     SELECT p.id, d.id, 3 FROM pesticides p, crop_diseases d
     WHERE p.trade_name = 'Bacsub 1000WP' AND d.disease_class = 'Tomato___Septoria_leaf_spot' ON CONFLICT DO NOTHING`,
  ];

  for (const sql of mappings) {
    try {
      await pool.query(sql);
      console.log('  OK: mapping inserted');
    } catch (e) {
      console.log('  SKIP:', e.message.substring(0, 80));
    }
  }

  // 5. Verify disease_summary view
  console.log('\nVerifying disease_summary view...');
  try {
    const result = await pool.query('SELECT disease_class, disease_name_vi, json_array_length(treatments::json) as treatments_count, json_array_length(pesticides::json) as pesticides_count FROM disease_summary LIMIT 5');
    for (const row of result.rows) {
      console.log(`  ${row.disease_class}: ${row.disease_name_vi} (${row.treatments_count} treatments, ${row.pesticides_count} pesticides)`);
    }
    console.log('\nDone!');
  } catch (e) {
    console.log('  ERR:', e.message);
  }

  await pool.end();
}

run();