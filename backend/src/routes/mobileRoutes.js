/**
 * Mobile Routes — Field Owner APIs
 *
 * TASK 1: Station-to-Mobile data pipeline.
 *
 * These routes are prefixed with /api/mobile and require authentication.
 * Any authenticated user (any role) can access these endpoints,
 * but the data is filtered by owner_user_id matching the authenticated user.
 *
 * ROUTES:
 *   GET /api/mobile/fields                          — List my assigned fields
 *   GET /api/mobile/fields/:fieldId/zone-map        — Get polygon-only zone map
 *
 * ACCESS RULES:
 * - Requires valid JWT token (authenticateToken)
 * - Does NOT require admin role — any authenticated user can call
 * - Data filtered by owner_user_id = req.user.userId
 *
 * DEPENDENCY NOTE:
 * - These APIs expose ONLY published zone maps from field_zone_maps table.
 * - Draft sub_zones from station are NEVER returned.
 * - No satellite tiles, no MapLibre, no tile URLs in responses.
 */

const express = require('express');
const router = express.Router();
const mobileController = require('../controllers/mobileController');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/mobile/fields — List fields assigned to the authenticated user
router.get('/fields', authenticateToken, mobileController.getMyFields);

// GET /api/mobile/fields/:fieldId/zone-map — Get latest published polygon-only zone map
router.get('/fields/:fieldId/zone-map', authenticateToken, mobileController.getFieldZoneMap);

module.exports = router;