const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

const stmts = [
  'ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS inference_id INTEGER',
  'ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB',
  `CREATE TABLE IF NOT EXISTS crop_diseases (
    id SERIAL PRIMARY KEY,
    disease_class VARCHAR(255) NOT NULL UNIQUE,
    disease_name_vi VARCHAR(255) NOT NULL,
    disease_name_en VARCHAR(255),
    crop_type VARCHAR(100),
    description TEXT,
    symptoms TEXT[],
    causes TEXT[],
    severity VARCHAR(20) DEFAULT 'moderate',
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS treatment_methods (
    id SERIAL PRIMARY KEY,
    disease_id INTEGER NOT NULL REFERENCES crop_diseases(id) ON DELETE CASCADE,
    method_type VARCHAR(50) NOT NULL,
    method_name VARCHAR(255) NOT NULL,
    description TEXT,
    application_guide TEXT,
    frequency VARCHAR(100),
    effectiveness INTEGER CHECK (effectiveness BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS pesticides (
    id SERIAL PRIMARY KEY,
    trade_name VARCHAR(255) NOT NULL,
    active_ingredient VARCHAR(255) NOT NULL,
    concentration VARCHAR(100),
    manufacturer VARCHAR(255),
    dosage VARCHAR(255),
    application_method TEXT,
    safety_precautions TEXT[],
    pre_harvest_interval INTEGER DEFAULT 0,
    price_range VARCHAR(50),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS pesticide_disease_map (
    pesticide_id INTEGER NOT NULL REFERENCES pesticides(id) ON DELETE CASCADE,
    disease_id INTEGER NOT NULL REFERENCES crop_diseases(id) ON DELETE CASCADE,
    effectiveness INTEGER CHECK (effectiveness BETWEEN 1 AND 5),
    PRIMARY KEY (pesticide_id, disease_id)
  )`,
  'CREATE INDEX IF NOT EXISTS idx_crop_diseases_class ON crop_diseases(disease_class)',
  'CREATE INDEX IF NOT EXISTS idx_treatment_disease ON treatment_methods(disease_id)',
  'CREATE INDEX IF NOT EXISTS idx_pesticide_disease ON pesticide_disease_map(disease_id)',
  `CREATE TABLE IF NOT EXISTS fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    crop_type VARCHAR(255) NOT NULL,
    area NUMERIC(10, 2),
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS weather_cache (
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    weather_data JSONB NOT NULL,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (latitude, longitude)
  )`,
  'ALTER TABLE crop_samples ADD COLUMN IF NOT EXISTS field_id UUID REFERENCES fields(id) ON DELETE SET NULL',
  "ALTER TABLE crop_samples ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'mobile'",
  'ALTER TABLE crop_samples ADD COLUMN IF NOT EXISTS batch_id UUID',
];

async function run() {
  console.log('Running schema migration...');
  for (const sql of stmts) {
    try {
      await pool.query(sql);
      console.log('OK:', sql.substring(0, 70));
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('EXISTS:', sql.substring(0, 70));
      } else {
        console.error('ERR:', e.message);
      }
    }
  }

  console.log('\nRunning seed data...');
  const seedStmts = [
    `INSERT INTO crop_diseases (disease_class, disease_name_vi, disease_name_en, crop_type, description, symptoms, causes, severity) VALUES
    ('Tomato___Healthy', 'Cà chua khỏe mạnh', 'Tomato Healthy', 'tomato', 'Cây cà chua phát triển bình thường.', ARRAY['Lá xanh đậm'], ARRAY['Điều kiện tốt'], 'mild'),
    ('Tomato___Bacterial_spot', 'Bacterial spot — Cháy lá vi khuẩn', 'Bacterial Spot', 'tomato', 'Bệnh do vi khuẩn Xanthomonas campestris.', ARRAY['Đốm nâu đen nhỏ trên lá', 'Lá vàng và rụng'], ARRAY['Vi khuẩn Xanthomonas', 'Lây lan qua nước mưa'], 'moderate'),
    ('Tomato___Early_blight', 'Early blight — Cháy lá sớm', 'Early Blight', 'tomato', 'Bệnh nấm Alternaria solani gây cháy lá sớm.', ARRAY['Đốm nâu tròn có tâm đen', 'Vàng lá từ dưới lên'], ARRAY['Nấm Alternaria solani', 'Độ ẩm cao'], 'moderate'),
    ('Tomato___Late_blight', 'Late blight — Cháy lá muộn', 'Late Blight', 'tomato', 'Bệnh nấm Phytophthora infestans rất nguy hiểm.', ARRAY['Đốm nâu xanh đậm trên lá', 'Thối quả nhanh'], ARRAY['Nấm Phytophthora infestans', 'Thời tiết lạnh ẩm'], 'severe'),
    ('Tomato___Leaf_Mold', 'Nấm mốc lá', 'Leaf Mold', 'tomato', 'Bệnh nấm Fulvia fulva gây mốc lá.', ARRAY['Vàng lá trên', 'Mốc xanh nâu dưới lá'], ARRAY['Nấm Fulvia fulva', 'Độ ẩm cao'], 'mild'),
    ('Tomato___Septoria_leaf_spot', 'Septoria — Đốm lá Septoria', 'Septoria Leaf Spot', 'tomato', 'Bệnh nấm Septoria lycopersici gây đốm lá.', ARRAY['Đốm tròn nhỏ màu xám', 'Lá vàng và rụng'], ARRAY['Nấm Septoria lycopersici', 'Mưa nhiều'], 'moderate'),
    ('Tomato___Spider_mites', 'Nhện đỏ', 'Spider Mites', 'tomato', 'Nhện đỏ hút nhựa cây, gây vàng lá.', ARRAY['Lá vàng đốm', 'Tơ nhện dưới lá'], ARRAY['Nhện đỏ Tetranychus urticae', 'Khô nóng'], 'mild'),
    ('Tomato___Target_Spot', 'Đốm lá hình bia', 'Target Spot', 'tomato', 'Bệnh nấm Corynespora cassiicola.', ARRAY['Đốm nâu hình tròn', 'Lá vàng và chết'], ARRAY['Nấm Corynespora cassiicola', 'Độ ẩm cao'], 'moderate'),
    ('Tomato___Yellow_Leaf_Curl_Virus', 'Virus cuộn lá vàng', 'Yellow Leaf Curl Virus', 'tomato', 'Bệnh virus TYLCV lây truyền bởi rệp phấn trắng.', ARRAY['Lá cuộn lên', 'Vàng lá', 'Cây còi cọc'], ARRAY['Virus TYLCV', 'Rệp phấn trắng'], 'severe'),
    ('Tomato___Tomato_mosaic_virus', 'Virus khảm cà chua', 'Tomato Mosaic Virus', 'tomato', 'Bệnh virus ToMV gây khảm lá.', ARRAY['Lá khảm xanh vàng', 'Lá cuộn'], ARRAY['Virus ToMV', 'Lây qua tay, dụng cụ'], 'moderate'),
    ('Pepper__bell___Bacterial_spot', 'Bacterial spot — Ớt', 'Bacterial Spot', 'pepper', 'Bệnh vi khuẩn trên ớt.', ARRAY['Đốm nâu nhỏ trên lá'], ARRAY['Vi khuẩn Xanthomonas'], 'moderate'),
    ('Pepper__bell___healthy', 'Ớt khỏe mạnh', 'Pepper Healthy', 'pepper', 'Cây ớt phát triển bình thường.', ARRAY['Lá xanh', 'Quả chắc'], ARRAY['Điều kiện tốt'], 'mild')
    ON CONFLICT (disease_class) DO NOTHING`,
  ];

  for (const sql of seedStmts) {
    try {
      await pool.query(sql);
      console.log('OK: Seed data inserted');
    } catch (e) {
      if (e.message.includes('already exists') || e.message.includes('duplicate key')) {
        console.log('EXISTS: Seed data already present');
      } else {
        console.error('ERR:', e.message);
      }
    }
  }

  console.log('\nDone!');
  await pool.end();
}

run();