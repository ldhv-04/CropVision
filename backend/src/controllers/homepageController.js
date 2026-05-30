const HomepageService = require('../services/homepageService');

/**
 * Homepage Controller — Aggregated data for all homepage widgets.
 */

/**
 * GET /api/homepage/summary
 * Returns field stats, alerts, epidemic alerts, and recent scans in one call.
 */
const getSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const data = await HomepageService.getSummary(userId);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[Homepage] getSummary error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay du lieu trang chu.' });
  }
};

/**
 * GET /api/homepage/diseases
 * Returns personalized disease cards for the encyclopedia widget.
 */
const getDiseases = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit, 10) || 8;
    const diseases = await HomepageService.getPersonalizedDiseases(userId, limit);
    res.json({ success: true, data: diseases });
  } catch (error) {
    console.error('[Homepage] getDiseases error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay danh sach benh.' });
  }
};

module.exports = {
  getSummary,
  getDiseases,
};