-- Rollback for Migration 005: Geo-Spatial & Epidemic
DROP TABLE IF EXISTS zone_alerts CASCADE;
DROP TABLE IF EXISTS disease_reports CASCADE;
DROP TABLE IF EXISTS zone_metrics CASCADE;
DROP TABLE IF EXISTS sub_zones CASCADE;
