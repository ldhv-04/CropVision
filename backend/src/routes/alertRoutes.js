/**
 * Alert Routes — Station → Field Feedback Loop
 *
 * POST   /api/alerts                  — Admin creates alert
 * GET    /api/alerts                  — Get active alerts (all users)
 * GET    /api/alerts/all              — Admin: all alerts with stats
 * POST   /api/alerts/:id/acknowledge  — Farmer acknowledges alert
 * PATCH  /api/alerts/:id/deactivate   — Admin deactivates alert
 */

const express = require('express');
const alertController = require('../controllers/alertController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All alert routes require auth
router.use(authenticateToken);

// Order matters: named paths before /:id
router.get('/all', alertController.getAllAlerts);
router.get('/suggestions', alertController.getAnomalySuggestions);
router.post('/', alertController.createAlert);
router.get('/', alertController.getActiveAlerts);
router.get('/:id/metrics', alertController.getAlertMetrics);
router.post('/:id/acknowledge', alertController.acknowledgeAlert);
router.patch('/:id/deactivate', alertController.deactivateAlert);

module.exports = router;