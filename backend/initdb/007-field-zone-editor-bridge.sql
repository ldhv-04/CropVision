-- Migration 007: Field ownership and zone publishing schema.
-- Keeps fresh Docker init databases aligned with the existing station/mobile
-- zone editor migration runners. Safe to apply manually to an existing local DB.

ALTER TABLE fields
  ADD COLUMN IF NOT EXISTS code VARCHAR(20);

ALTER TABLE fields
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE fields
  ADD COLUMN IF NOT EXISTS owner_email_snapshot VARCHAR(255);

ALTER TABLE fields
  ADD COLUMN IF NOT EXISTS zones_published_at TIMESTAMPTZ;

ALTER TABLE fields
  ADD COLUMN IF NOT EXISTS zone_map_version INTEGER DEFAULT 0;

ALTER TABLE sub_zones
  ADD COLUMN IF NOT EXISTS code VARCHAR(20);

ALTER TABLE sub_zones
  ADD COLUMN IF NOT EXISTS name VARCHAR(255);

ALTER TABLE sub_zones
  ADD COLUMN IF NOT EXISTS area NUMERIC(10, 4);

ALTER TABLE sub_zones
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

ALTER TABLE sub_zones
  ADD COLUMN IF NOT EXISTS created_by_station_id UUID;

ALTER TABLE sub_zones
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE sub_zones
  ADD COLUMN IF NOT EXISTS zone_status VARCHAR(20) DEFAULT 'draft'
  CHECK (zone_status IN ('draft', 'published', 'unpublished'));

CREATE TABLE IF NOT EXISTS field_zone_maps (
  id SERIAL PRIMARY KEY,
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES users(id) ON DELETE SET NULL,
  zones_data JSONB NOT NULL DEFAULT '[]',
  boundary_data JSONB,
  zones_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sub_zones_field_code
  ON sub_zones(field_id, code) WHERE code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_field_zone_maps_field_status
  ON field_zone_maps(field_id, status, version DESC);

CREATE INDEX IF NOT EXISTS idx_fields_owner_user_id
  ON fields(owner_user_id) WHERE owner_user_id IS NOT NULL;
