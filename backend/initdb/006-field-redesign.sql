-- Migration 006: Field Management Redesign
-- Adds health_score to sub_zones, growth_stage to fields,
-- zone_health_history table, and performance indexes

-- 1. Add health_score to sub_zones (0.00 = critically unhealthy, 1.00 = perfectly healthy)
ALTER TABLE sub_zones ADD COLUMN IF NOT EXISTS health_score NUMERIC(3,2) DEFAULT 1.00;

-- 2. Add growth_stage to fields
ALTER TABLE fields ADD COLUMN IF NOT EXISTS growth_stage VARCHAR(50);
-- Values: seedling, vegetative, flowering, fruiting, maturity, harvest

-- 3. Create zone_health_history table
CREATE TABLE IF NOT EXISTS zone_health_history (
  id SERIAL PRIMARY KEY,
  sub_zone_id INT REFERENCES sub_zones(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  health_score NUMERIC(3,2) NOT NULL,
  reason VARCHAR(100),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_zone_health_history_zone
  ON zone_health_history(sub_zone_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_zone_metrics_latest
  ON zone_metrics(sub_zone_id, created_at DESC);