/**
 * Epidemic Routes — Disease Report & Dispersion Alert Pipeline
 *
 * POST   /api/epidemic/report               — Report disease, compute cone, broadcast alerts
 * GET    /api/epidemic/alerts                — Get user's epidemic alerts
 * PATCH  /api/epidemic/alerts/:id/read       — Mark alert as read
 * PATCH  /api/epidemic/reports/:id/resolve   — Resolve a disease report
 */

const express = require('express');
const epidemicController = require('../controllers/epidemicController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All epidemic routes require authentication
router.use(authenticateToken);

// Named paths registered before parameterised paths
router.post('/report', epidemicController.reportDisease);
router.get('/alerts', epidemicController.getUserAlerts);
router.patch('/alerts/:id/read', epidemicController.markAlertRead);
router.patch('/reports/:id/resolve', epidemicController.resolveDiseaseReport);

// [NEW] Station admin: simulation with custom wind + outbreak ledger
router.post('/simulate', epidemicController.simulateDispersion);
router.get('/outbreaks', epidemicController.getOutbreaks);
router.get('/outbreaks/:id', epidemicController.getOutbreakDetail);

module.exports = router;