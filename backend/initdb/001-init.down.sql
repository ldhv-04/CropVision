-- Rollback for Migration 001: Init
DROP TABLE IF EXISTS inference_results CASCADE;
DROP TABLE IF EXISTS crop_samples CASCADE;
DROP TABLE IF EXISTS users CASCADE;
