-- Rollback for Migration 003: Diseases Knowledge Base
DROP TABLE IF EXISTS pesticide_disease_map CASCADE;
DROP TABLE IF EXISTS treatment_methods CASCADE;
DROP TABLE IF EXISTS pesticides CASCADE;
DROP TABLE IF EXISTS crop_diseases CASCADE;
