/**
 * Sub-Zone Routes — Sub-Plot Management
 *
 * Routes under /api/fields/:fieldId/subzones are NESTED under fieldRoutes.
 * Routes under /api/subzones/:id are TOP-LEVEL for direct sub-zone access.
 *
 * NESTED (mounted inside fieldRoutes):
 *   GET    /api/fields/:fieldId/subzones       — List sub-zones for a field
 *   POST   /api/fields/:fieldId/subzones       — Create sub-zone in a field
 *
 * TOP-LEVEL (mounted in server.js):
 *   GET    /api/subzones/:id                   — Get sub-zone detail + metrics
 *   PUT    /api/subzones/:id                   — Update sub-zone
 *   DELETE /api/subzones/:id                   — Delete sub-zone
 *   GET    /api/subzones/:id/metrics           — Get live telemetry for sub-zone
 *   GET    /api/subzones/:id/metrics/timeseries — Get metric time-series (NEW)
 *   GET    /api/subzones/:id/health-history     — Get health status timeline (NEW)
 */

const express = require('express');
const subZoneController = require('../controllers/subZoneController');
const { authenticateToken } = require('../middleware/authMiddleware');

// ── Nested routes: /api/fields/:fieldId/subzones ─────────────
// These are mounted inside fieldRoutes, so fieldId comes from params.
const nestedRouter = express.Router({ mergeParams: true });
nestedRouter.get('/', authenticateToken, subZoneController.getSubZones);
nestedRouter.post('/', authenticateToken, subZoneController.createSubZone);

// ── Top-level routes: /api/subzones/:id ──────────────────────
// These are mounted directly in server.js.
const topLevelRouter = express.Router();
// NEW: Time-series and health-history (must be before /:id to avoid conflict)
topLevelRouter.get('/:id/metrics/timeseries', authenticateToken, subZoneController.getSubZoneTimeSeries);
topLevelRouter.get('/:id/health-history', authenticateToken, subZoneController.getSubZoneHealthHistory);
topLevelRouter.get('/:id/metrics', authenticateToken, subZoneController.getSubZoneMetrics);
topLevelRouter.get('/:id', authenticateToken, subZoneController.getSubZoneById);
topLevelRouter.put('/:id', authenticateToken, subZoneController.updateSubZone);
topLevelRouter.delete('/:id', authenticateToken, subZoneController.deleteSubZone);

module.exports = { nestedRouter, topLevelRouter };