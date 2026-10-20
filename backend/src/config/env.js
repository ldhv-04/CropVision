/**
 * 12-Factor App: Config Module (Factor III)
 * Validates and exposes environment configuration fail-fast with zero implicit fallbacks.
 */

const path = require('path');
require('dotenv').config({ quiet: process.env.NODE_ENV === 'test' });
require('dotenv').config({ path: path.join(__dirname, '../../../.env'), quiet: process.env.NODE_ENV === 'test' });

const isTest = process.env.NODE_ENV === 'test';

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || process.env.BACKEND_PORT || 3000),
  JWT_SECRET: process.env.JWT_SECRET || (isTest ? 'test_jwt_secret_for_ci' : null),
  DB: {
    user: process.env.DB_USER || process.env.POSTGRES_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || process.env.POSTGRES_DB || 'cropvision_db',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || '12345678',
    port: Number(process.env.DB_PORT || process.env.POSTGRES_PORT || 5432),
  },
  AI_CORE_URL: (process.env.AI_CORE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, ''),
  STORAGE_DRIVER: process.env.STORAGE_DRIVER || 'local',
  ADMIN: {
    fullName: process.env.ADMIN_FULL_NAME || 'CropVision Admin',
    email: process.env.ADMIN_EMAIL || 'admin@cropvision.local',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
  },
};

// Fail-fast validation upon boot (Factor III)
if (!config.JWT_SECRET) {
  throw new Error('FATAL [12-Factor Config]: JWT_SECRET environment variable is not set. Process cannot boot securely.');
}

module.exports = config;
