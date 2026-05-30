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
  'ALTER TABLE crop_samples ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 6)',
  'ALTER TABLE crop_samples ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 6)',
  'CREATE INDEX IF NOT EXISTS idx_crop_samples_geo ON crop_samples(latitude, longitude) WHERE latitude IS NOT NULL',
  `CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    target_region VARCHAR(255),
    target_crop VARCHAR(100),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS alert_acknowledgments (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (alert_id, user_id)
  )`,
  'CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_alert_ack_user ON alert_acknowledgments(user_id)',
  'ALTER TABLE alerts ADD COLUMN IF NOT EXISTS target_lat NUMERIC(10, 6)',
  'ALTER TABLE alerts ADD COLUMN IF NOT EXISTS target_lng NUMERIC(10, 6)',
  'ALTER TABLE alerts ADD COLUMN IF NOT EXISTS target_radius_km NUMERIC(8, 2)',
  'ALTER TABLE fields ADD COLUMN IF NOT EXISTS boundary JSONB',
  'ALTER TABLE fields ADD COLUMN IF NOT EXISTS growth_stage VARCHAR(50) DEFAULT \'germination\'',
  'ALTER TABLE fields ADD COLUMN IF NOT EXISTS planting_date DATE',
  `CREATE TABLE IF NOT EXISTS field_activities (
    id SERIAL PRIMARY KEY,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    notes TEXT,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  'CREATE INDEX IF NOT EXISTS idx_field_activities_field ON field_activities(field_id, created_at DESC)',
  'ALTER TABLE crop_diseases ADD COLUMN IF NOT EXISTS video_url TEXT',
  'ALTER TABLE crop_diseases ADD COLUMN IF NOT EXISTS diagnosis_tree JSONB',

  // ── [NEW] Geo-Spatial Mapping & Epidemiological Dispersion Module ──
  // Sub-zones: sub-plots within a field, each with its own crop, boundary, and status
  `CREATE TABLE IF NOT EXISTS sub_zones (
    id                SERIAL PRIMARY KEY,
    field_id          UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    crop_type         VARCHAR(100) NOT NULL,
    boundary          JSONB NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'HEALTHY'
      CHECK (status IN ('HEALTHY', 'WARNING', 'INFECTED')),
    planting_date     TIMESTAMP,
    fertilize_freq    INTEGER NOT NULL DEFAULT 14,
    spray_freq        INTEGER NOT NULL DEFAULT 10,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  'CREATE INDEX IF NOT EXISTS idx_sub_zones_field_id ON sub_zones(field_id)',

  // Zone metrics: time-series telemetry per sub-zone
  `CREATE TABLE IF NOT EXISTS zone_metrics (
    id              SERIAL PRIMARY KEY,
    sub_zone_id     INTEGER NOT NULL REFERENCES sub_zones(id) ON DELETE CASCADE,
    health_score    INTEGER NOT NULL CHECK (health_score BETWEEN 0 AND 100),
    temperature     NUMERIC(5, 2) NOT NULL,
    humidity        NUMERIC(5, 2) NOT NULL,
    soil_moisture   NUMERIC(5, 2) NOT NULL,
    ph              NUMERIC(4, 2) NOT NULL,
    ec              NUMERIC(5, 2) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  'CREATE INDEX IF NOT EXISTS idx_zone_metrics_sub_zone_created ON zone_metrics(sub_zone_id, created_at DESC)',

  // Disease reports: disease occurrences within a sub-zone
  `CREATE TABLE IF NOT EXISTS disease_reports (
    id              SERIAL PRIMARY KEY,
    sub_zone_id     INTEGER NOT NULL REFERENCES sub_zones(id) ON DELETE CASCADE,
    disease_type    VARCHAR(255) NOT NULL,
    is_resolved     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  'CREATE INDEX IF NOT EXISTS idx_disease_reports_sub_zone_id ON disease_reports(sub_zone_id)',

  // Zone alerts: epidemic broadcast notifications
  `CREATE TABLE IF NOT EXISTS zone_alerts (
    id                  SERIAL PRIMARY KEY,
    sub_zone_id         INTEGER NOT NULL REFERENCES sub_zones(id) ON DELETE CASCADE,
    disease_report_id   INTEGER NOT NULL REFERENCES disease_reports(id) ON DELETE CASCADE,
    threat_level        VARCHAR(20) NOT NULL DEFAULT 'WARNING'
      CHECK (threat_level IN ('WARNING', 'CRITICAL')),
    message             TEXT,
    is_read             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  'CREATE INDEX IF NOT EXISTS idx_zone_alerts_sub_zone_id ON zone_alerts(sub_zone_id)',
  'CREATE INDEX IF NOT EXISTS idx_zone_alerts_disease_report_id ON zone_alerts(disease_report_id)',

  // ── [NEW] GPS Boundary Walk Sessions ──
  // Stores GPS point arrays from farmer walk-around field perimeter mapping.
  // The mobile app appends [lng, lat] tuples every 2 seconds during active walk.
  `CREATE TABLE IF NOT EXISTS gps_walks (
    id              SERIAL PRIMARY KEY,
    field_id        UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    points          JSONB NOT NULL DEFAULT '[]',   -- Array of [lng, lat] pairs
    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at    TIMESTAMP
  )`,
  'CREATE INDEX IF NOT EXISTS idx_gps_walks_field_id ON gps_walks(field_id)',

  // ── [NEW] Field Management Redesign: health_score, zone_health_history ──
  'ALTER TABLE sub_zones ADD COLUMN IF NOT EXISTS health_score NUMERIC(3,2) DEFAULT 1.00',
  `CREATE TABLE IF NOT EXISTS zone_health_history (
    id              SERIAL PRIMARY KEY,
    sub_zone_id     INTEGER NOT NULL REFERENCES sub_zones(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL,
    health_score    NUMERIC(3,2) NOT NULL,
    reason          VARCHAR(100),
    changed_at      TIMESTAMPTZ DEFAULT NOW()
  )`,
  'CREATE INDEX IF NOT EXISTS idx_zone_health_history_zone ON zone_health_history(sub_zone_id, changed_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_zone_metrics_latest ON zone_metrics(sub_zone_id, created_at DESC)',
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