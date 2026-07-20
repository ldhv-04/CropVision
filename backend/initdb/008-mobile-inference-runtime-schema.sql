-- Migration 008: Mobile inference/runtime schema alignment.
-- Fresh Docker init databases need the same additive columns/tables that the
-- backend inference, sample history, and alert endpoints already expect.

ALTER TABLE crop_samples
  ADD COLUMN IF NOT EXISTS field_id UUID REFERENCES fields(id) ON DELETE SET NULL;

ALTER TABLE crop_samples
  ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'mobile';

ALTER TABLE crop_samples
  ADD COLUMN IF NOT EXISTS batch_id UUID;

ALTER TABLE crop_samples
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 6);

ALTER TABLE crop_samples
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 6);

CREATE INDEX IF NOT EXISTS idx_crop_samples_geo
  ON crop_samples(latitude, longitude) WHERE latitude IS NOT NULL;

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info'
    CHECK (severity IN ('info', 'warning', 'critical')),
  target_region VARCHAR(255),
  target_crop VARCHAR(100),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_acknowledgments (
  id SERIAL PRIMARY KEY,
  alert_id INTEGER NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (alert_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_alerts_active
  ON alerts(is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_ack_user
  ON alert_acknowledgments(user_id);

ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS target_lat NUMERIC(10, 6);

ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS target_lng NUMERIC(10, 6);

ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS target_radius_km NUMERIC(8, 2);
