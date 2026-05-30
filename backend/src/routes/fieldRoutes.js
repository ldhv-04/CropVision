/**
 * Field Routes — FULL VERSION
 *
 * CRUD + Update + Delete + Activities
 *
 * GET    /api/fields              — List user's fields
 * POST   /api/fields              — Create field (with boundary, growth_stage)
 * GET    /api/fields/:id          — Get field detail + activities
 * PUT    /api/fields/:id          — Update field (boundary, growth_stage, etc.)
 * DELETE /api/fields/:id          — Delete field
 * POST   /api/fields/:id/activities  — Add activity to field
 * GET    /api/fields/:id/activities  — List activities for field
 */

const express = require('express');
const router = express.Router();
const fieldController = require('../controllers/fieldController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { nestedRouter: subZoneNestedRouter } = require('./subZoneRoutes');
const walkRoutes = require('./walkRoutes');

// Must register /:id paths with explicit method ordering
router.get('/', authenticateToken, fieldController.getFields);
router.post('/', authenticateToken, fieldController.createField);

// ── Sub-Zone routes (nested under /api/fields/:fieldId/subzones) ──
// [NEW] Geo-Spatial Mapping module — adds sub-plot management to each field
router.use('/:fieldId/subzones', subZoneNestedRouter);

// ── GPS Walk routes (nested under /api/fields/:fieldId/walk) ──
// [NEW] GPS Boundary Walk — farmer walks perimeter to map field boundary
router.use('/:fieldId/walk', walkRoutes);

// ── NEW: Zone Summary (aggregated metrics for map rendering) ──
router.get('/:id/zones/summary', authenticateToken, fieldController.getZonesSummary);

router.get('/:id/activities', authenticateToken, fieldController.getActivities);
router.post('/:id/activities', authenticateToken, fieldController.addActivity);
router.get('/:id', authenticateToken, fieldController.getFieldById);
router.put('/:id', authenticateToken, fieldController.updateField);
router.delete('/:id', authenticateToken, fieldController.deleteField);

module.exports = router;