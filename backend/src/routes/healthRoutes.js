const express = require('express');
const pool = require('../config/db');

const router = express.Router();

const AI_CORE_URL = (process.env.AI_CORE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const READINESS_TIMEOUT_MS = Number(process.env.READINESS_TIMEOUT_MS || 1500);

const withTimeout = (promise, timeoutMs, label) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} readiness timeout`)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const checkDatabase = async () => {
  await withTimeout(pool.query('SELECT 1'), READINESS_TIMEOUT_MS, 'database');
  return 'ok';
};

const checkAiCore = async () => {
  const response = await withTimeout(
    fetch(`${AI_CORE_URL}/health`, { method: 'GET' }),
    READINESS_TIMEOUT_MS,
    'ai-core'
  );

  return response.ok ? 'ok' : 'unavailable';
};

router.get('/health/live', (req, res) => {
  res.json({
    status: 'ok',
    service: 'backend',
    type: 'live',
  });
});

router.get('/health/ready', async (req, res) => {
  const checks = {};

  try {
    checks.database = await checkDatabase();
  } catch (_error) {
    checks.database = 'unavailable';
  }

  try {
    checks.aiCore = await checkAiCore();
  } catch (_error) {
    checks.aiCore = 'unavailable';
  }

  const ready = checks.database === 'ok';
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'unavailable',
    service: 'backend',
    type: 'ready',
    checks,
  });
});

router.get('/version', (req, res) => {
  res.json({
    service: 'backend',
    appEnv: process.env.APP_ENV || 'local',
    nodeEnv: process.env.NODE_ENV || 'development',
    gitSha: process.env.GIT_SHA || 'local',
    imageTag: process.env.IMAGE_TAG || 'local',
    migrationVersion: null,
  });
});

module.exports = router;
