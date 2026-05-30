/**
 * Walk Routes — GPS Boundary Walk Sessions
 *
 * Enables farmers to walk around field perimeter while streaming GPS coordinates.
 *
 * POST   /api/fields/:fieldId/walk/start              — Start a new walk session
 * GET    /api/fields/:fieldId/walk/:walkId             — Get walk status + collected points
 * PATCH  /api/fields/:fieldId/walk/:walkId/points      — Append GPS points to walk
 * POST   /api/fields/:fieldId/walk/:walkId/complete    — Complete walk → save GeoJSON boundary
 */

const express = require('express');
const walkController = require('../controllers/walkController');
const { authenticateToken } = require('../middleware/authMiddleware');

// mergeParams: true allows access to :fieldId from parent router (fieldRoutes)
const router = express.Router({ mergeParams: true });

// All walk routes require authentication
router.use(authenticateToken);

router.post('/start', walkController.startWalk);
router.get('/:walkId', walkController.getWalkStatus);
router.patch('/:walkId/points', walkController.appendPoints);
router.post('/:walkId/complete', walkController.completeWalk);

module.exports = router;