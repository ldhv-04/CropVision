-- Rollback for Migration 006: Field Management Redesign
DROP TABLE IF EXISTS zone_health_history CASCADE;
ALTER TABLE fields DROP COLUMN IF EXISTS growth_stage;
ALTER TABLE sub_zones DROP COLUMN IF EXISTS health_score;
