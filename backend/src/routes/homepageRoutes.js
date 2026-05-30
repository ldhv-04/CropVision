/**
 * Homepage Routes — Aggregated data for homepage widgets
 *
 * GET /api/homepage/summary   — Field stats + alerts + recent scans
 * GET /api/homepage/diseases  — Personalized disease cards for encyclopedia widget
 */

const express = require('express');
const router = express.Router();
const homepageController = require('../controllers/homepageController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/summary', authenticateToken, homepageController.getSummary);
router.get('/diseases', authenticateToken, homepageController.getDiseases);

module.exports = router;