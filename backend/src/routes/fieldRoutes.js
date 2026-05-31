/**
 * Field Routes — FULL VERSION
 *
 * CRUD + Soft Delete + Trash + Restore + Polygon Generation + Activities
 *
 * GET    /api/fields                    — List user's fields (active only)
 * POST   /api/fields                    — Create field (with boundary, growth_stage)
 * POST   /api/fields/generate-polygon   — Generate polygon from center+radius
 * GET    /api/fields/trash              — List soft-deleted fields
 * DELETE /api/fields/trash              — Empty entire trash
 * GET    /api/fields/:id                — Get field detail + activities
 * PUT    /api/fields/:id                — Update field (boundary, growth_stage, etc.)
 * DELETE /api/fields/:id                — Soft delete field
 * PATCH  /api/fields/:id/restore        — Restore soft-deleted field
 * DELETE /api/fields/:id/permanent      — Permanently delete (from trash)
 * POST   /api/fields/:id/activities     — Add activity to field
 * GET    /api/fields/:id/activities     — List activities for field
 */

const express = require('express');
const router = express.Router();
const fieldController = require('../controllers/fieldController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { nestedRouter: subZoneNestedRouter } = require('./subZoneRoutes');
const { nestedRouter: zoneNestedRouter } = require('./zoneRoutes');
const walkRoutes = require('./walkRoutes');

// Must register /:id paths with explicit method ordering
router.get('/', authenticateToken, fieldController.getFields);
router.post('/', authenticateToken, fieldController.createField);

// ── Polygon generation (center+radius → GeoJSON Polygon) ──
router.post('/generate-polygon', authenticateToken, fieldController.generatePolygon);

// ── Trash management ──
router.get('/trash', authenticateToken, fieldController.getTrash);

// ── Management Zone routes (nested under /api/fields/:fieldId/zones) ──
// [NEW] Zone Editor — Station/Admin spatial management of internal zones
router.use('/:fieldId/zones', zoneNestedRouter);

// ── Sub-Zone routes (nested under /api/fields/:fieldId/subzones) ──
// [OLD] Geo-Spatial Mapping module — adds sub-plot management to each field
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

// ── Soft delete recovery ──
router.patch('/:id/restore', authenticateToken, fieldController.restoreField);
router.delete('/:id/permanent', authenticateToken, fieldController.permanentDeleteField);

module.exports = router;