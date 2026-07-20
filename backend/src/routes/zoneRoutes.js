/**
 * Zone Routes — Management Zone Editor (Station/Admin)
 *
 * Routes under /api/fields/:fieldId/zones are NESTED under fieldRoutes.
 *
 * NESTED (mounted inside fieldRoutes):
 *   GET    /api/fields/:fieldId/zones              — List zones for a field
 *   POST   /api/fields/:fieldId/zones              — Create zone
 *   PATCH  /api/fields/:fieldId/zones/:zoneId      — Update zone
 *   DELETE /api/fields/:fieldId/zones/:zoneId      — Delete zone
 *   POST   /api/fields/:fieldId/zones/validate     — Validate all zones
 *   POST   /api/fields/:fieldId/zones/publish      — Publish zone map
 */

const express = require('express');
const zoneController = require('../controllers/zoneController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Nested router mounted under /api/fields/:fieldId/zones
const nestedRouter = express.Router({ mergeParams: true });

// All zone routes require authentication and admin role
nestedRouter.get('/', authenticateToken, requireAdmin, zoneController.getZones);
nestedRouter.post('/', authenticateToken, requireAdmin, zoneController.createZone);

// Validate and publish (must be before /:zoneId to avoid conflict)
nestedRouter.post('/validate', authenticateToken, requireAdmin, zoneController.validateZones);
nestedRouter.post('/publish', authenticateToken, requireAdmin, zoneController.publishZones);

// Single zone operations
nestedRouter.patch('/:zoneId', authenticateToken, requireAdmin, zoneController.updateZone);
nestedRouter.delete('/:zoneId', authenticateToken, requireAdmin, zoneController.deleteZone);

module.exports = { nestedRouter };