-- Base field tables required by geo/epidemic init scripts.
-- Keep this aligned with backend/run-migration.js for fresh local Compose DBs.

CREATE TABLE IF NOT EXISTS fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  crop_type VARCHAR(255) NOT NULL,
  area NUMERIC(10, 2),
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  boundary JSONB,
  growth_stage VARCHAR(50) DEFAULT 'germination',
  planting_date DATE,
  deleted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  color VARCHAR(7) DEFAULT '#4CAF50',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weather_cache (
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  weather_data JSONB NOT NULL,
  cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (latitude, longitude)
);

CREATE INDEX IF NOT EXISTS idx_fields_active
  ON fields(user_id, is_active) WHERE is_active = TRUE;
