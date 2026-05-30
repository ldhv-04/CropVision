/**
 * Disease Encyclopedia Routes — Public API
 *
 * Endpoints for browsing the disease knowledge base.
 * Used by AgriVision and Station encyclopedia screens.
 *
 * GET /api/diseases            — List diseases (filter by crop_type, search)
 * GET /api/diseases/crops/list — Get available crop types
 * GET /api/diseases/:id        — Get full disease detail
 */

const express = require('express');
const diseaseController = require('../controllers/diseaseController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All disease routes require auth (to prevent abuse)
router.use(authenticateToken);

// Must register named paths BEFORE /:id to avoid route conflict
router.get('/crops/list', diseaseController.getCropTypes);
router.get('/pesticides/list', diseaseController.listPesticides);
router.get('/symptoms/tree', diseaseController.getSymptomTree);
router.get('/', diseaseController.listDiseases);
router.get('/:id', diseaseController.getDiseaseDetail);

module.exports = router;