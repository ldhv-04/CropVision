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
const mobileCultivationController = require('../controllers/mobileCultivationController');
const { authenticateToken } = require('../middleware/authMiddleware');

const authenticateCultivationToken = (req, res, next) => {
  const json = res.json;
  res.json = function sendCultivationAuthError(body) {
    if (res.statusCode === 401 && body?.success === false && !body.code) {
      return json.call(this, { ...body, code: 'UNAUTHENTICATED' });
    }
    return json.call(this, body);
  };
  authenticateToken(req, res, () => {
    res.json = json;
    next();
  });
};

// GET /api/mobile/fields — List fields assigned to the authenticated user
router.get('/fields', authenticateToken, mobileController.getMyFields);

// GET /api/mobile/fields/:fieldId/zone-map — Get latest published polygon-only zone map
router.get('/fields/:fieldId/zone-map', authenticateToken, mobileController.getFieldZoneMap);

// Mobile-owned cultivation data for stable zones in the latest published map.
router.get(
  '/fields/:fieldId/zones/:zoneId/cultivation',
  authenticateCultivationToken,
  mobileCultivationController.getCultivation
);
router.get(
  '/fields/:fieldId/zones/:zoneId/cultivation/logs',
  authenticateCultivationToken,
  mobileCultivationController.getCultivationLogs
);
router.put(
  '/fields/:fieldId/zones/:zoneId/cultivation/profile',
  authenticateCultivationToken,
  mobileCultivationController.putCultivationProfile
);
router.post(
  '/fields/:fieldId/zones/:zoneId/cultivation/logs',
  authenticateCultivationToken,
  mobileCultivationController.postCultivationLog
);
router.patch(
  '/fields/:fieldId/zones/:zoneId/cultivation/logs/:logId',
  authenticateCultivationToken,
  mobileCultivationController.patchCultivationLog
);
router.delete(
  '/fields/:fieldId/zones/:zoneId/cultivation/logs/:logId',
  authenticateCultivationToken,
  mobileCultivationController.deleteCultivationLog
);

module.exports = router;
