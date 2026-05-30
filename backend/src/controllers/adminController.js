const adminModel = require('../models/adminModel');
const adminService = require('../services/adminService');

const ALLOWED_ROLES = new Set(['user', 'admin']);

// Tra ve so lieu tong quan cho dashboard admin.
const getSummary = async (req, res) => {
  try {
    const summary = await adminModel.getAdminSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Loi tai adminController.getSummary:', error.message);
    res.status(500).json({ success: false, message: 'Khong the tai thong ke admin.' });
  }
};

// Tra ve danh sach nguoi dung de admin quan ly role/trang thai.
const getUsers = async (req, res) => {
  try {
    const users = await adminModel.getUsersWithStats();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Loi tai adminController.getUsers:', error.message);
    res.status(500).json({ success: false, message: 'Khong the tai danh sach nguoi dung.' });
  }
};

// Tra ve danh sach mau vat de admin co the theo doi va xoa.
const getSamples = async (req, res) => {
  try {
    const samples = await adminModel.getSamplesWithStats();
    res.json({ success: true, data: samples });
  } catch (error) {
    console.error('Loi tai adminController.getSamples:', error.message);
    res.status(500).json({ success: false, message: 'Khong the tai danh sach mau vat.' });
  }
};

// Cho phep admin cap nhat role cho user.
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ success: false, message: 'Role khong hop le.' });
    }

    if (req.user.userId === userId && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Admin khong the tu ha quyen cua chinh minh.' });
    }

    const updatedUser = await adminModel.updateUserRoleById(userId, role);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Khong tim thay user can cap nhat.' });
    }

    res.json({ success: true, message: 'Cap nhat role thanh cong.', data: updatedUser });
  } catch (error) {
    console.error('Loi tai adminController.updateUserRole:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Khong the cap nhat role.' });
  }
};

// Cho phep admin xoa user khong phai admin co dinh.
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.userId === userId) {
      return res.status(400).json({ success: false, message: 'Admin khong the tu xoa tai khoan dang dang nhap.' });
    }

    const deletedUser = await adminModel.deleteUserById(userId);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'Khong tim thay user can xoa.' });
    }

    res.json({ success: true, message: 'Xoa nguoi dung thanh cong.', data: deletedUser });
  } catch (error) {
    console.error('Loi tai adminController.deleteUser:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Khong the xoa user.' });
  }
};

const deleteSample = async (req, res) => {
  try {
    const { sampleId } = req.params;
    const deletedSample = await adminService.deleteSampleWithFile(sampleId);

    if (!deletedSample) {
      return res.status(404).json({ success: false, message: 'Khong tim thay mau vat can xoa.' });
    }

    res.json({ success: true, message: 'Xoa mau vat thanh cong.', data: deletedSample });
  } catch (error) {
    console.error('Loi tai adminController.deleteSample:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Khong the xoa mau vat.' });
  }
};

/**
 * GET /api/admin/stats/enhanced
 * Returns KPIs with week-over-week comparison for Station dashboard.
 */
const getEnhancedStats = async (req, res) => {
  try {
    const pool = require('../config/db');

    // This week vs last week comparisons
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM crop_samples WHERE created_at >= NOW() - INTERVAL '7 days') AS scans_this_week,
        (SELECT COUNT(*) FROM crop_samples WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days') AS scans_last_week,
        (SELECT COUNT(DISTINCT user_id) FROM crop_samples WHERE created_at >= NOW() - INTERVAL '7 days') AS active_farmers,
        (SELECT COUNT(DISTINCT user_id) FROM crop_samples WHERE created_at >= NOW() - INTERVAL '14 days' AND created_at < NOW() - INTERVAL '7 days') AS active_farmers_last_week,
        (SELECT COUNT(*) FROM inference_results ir JOIN crop_samples cs ON ir.sample_id = cs.id WHERE cs.created_at >= NOW() - INTERVAL '7 days' AND ir.disease_class NOT LIKE '%Healthy%') AS diseases_detected,
        (SELECT COUNT(*) FROM inference_results ir JOIN crop_samples cs ON ir.sample_id = cs.id WHERE cs.created_at >= NOW() - INTERVAL '14 days' AND cs.created_at < NOW() - INTERVAL '7 days' AND ir.disease_class NOT LIKE '%Healthy%') AS diseases_last_week,
        (SELECT COUNT(*) FROM alerts WHERE is_active = TRUE) AS active_alerts,
        (SELECT COUNT(*) FROM users WHERE role = 'user') AS total_users,
        (SELECT COUNT(*) FROM crop_samples) AS total_scans
    `;
    const result = await pool.query(statsQuery);
    const s = result.rows[0];

    const pctChange = (current, previous) => {
      const c = parseInt(current, 10) || 0;
      const p = parseInt(previous, 10) || 0;
      if (p === 0) return c > 0 ? 100 : 0;
      return Math.round(((c - p) / p) * 100);
    };

    res.json({
      success: true,
      data: {
        scans: { value: parseInt(s.scans_this_week, 10), change: pctChange(s.scans_this_week, s.scans_last_week), label: 'Lần quét tuần này' },
        farmers: { value: parseInt(s.active_farmers, 10), change: pctChange(s.active_farmers, s.active_farmers_last_week), label: 'Nông dân hoạt động' },
        diseases: { value: parseInt(s.diseases_detected, 10), change: pctChange(s.diseases_detected, s.diseases_last_week), label: 'Bệnh phát hiện' },
        alerts: { value: parseInt(s.active_alerts, 10), label: 'Cảnh báo đang hoạt động' },
        totalUsers: parseInt(s.total_users, 10),
        totalScans: parseInt(s.total_scans, 10),
      },
    });
  } catch (error) {
    console.error('[Admin] getEnhancedStats error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay thong ke nang cao.' });
  }
};

/**
 * GET /api/admin/stats/timeline
 * Returns scan counts per day for the last 30 days (for time-series chart).
 */
const getTimeline = async (req, res) => {
  try {
    const pool = require('../config/db');
    const days = parseInt(req.query.days, 10) || 30;

    const query = `
      SELECT
        DATE(cs.created_at) AS date,
        COUNT(*) AS scan_count,
        COUNT(DISTINCT cs.user_id) AS farmer_count,
        COUNT(CASE WHEN ir.disease_class NOT LIKE '%Healthy%' THEN 1 END) AS disease_count
      FROM crop_samples cs
      LEFT JOIN inference_results ir ON cs.id = ir.sample_id
      WHERE cs.created_at >= NOW() - INTERVAL '1 day' * $1
      GROUP BY DATE(cs.created_at)
      ORDER BY date ASC
    `;

    const result = await pool.query(query, [days]);

    res.json({
      success: true,
      data: result.rows.map(r => ({
        date: r.date,
        scans: parseInt(r.scan_count, 10),
        farmers: parseInt(r.farmer_count, 10),
        diseases: parseInt(r.disease_count, 10),
      })),
    });
  } catch (error) {
    console.error('[Admin] getTimeline error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay du lieu thoi gian.' });
  }
};

/**
 * GET /api/admin/stats/diseases
 * Returns disease distribution for charts.
 */
const getDiseaseDistribution = async (req, res) => {
  try {
    const pool = require('../config/db');

    const query = `
      SELECT
        ir.disease_class,
        cd.disease_name_vi,
        cd.severity,
        COUNT(*) AS detection_count
      FROM inference_results ir
      LEFT JOIN crop_diseases cd ON ir.disease_class = cd.disease_class
      GROUP BY ir.disease_class, cd.disease_name_vi, cd.severity
      ORDER BY detection_count DESC
      LIMIT 10
    `;

    const result = await pool.query(query);

    // Also get scan locations for map
    const locationsQuery = `
      SELECT cs.id, cs.latitude, cs.longitude, cs.created_at,
        COALESCE(
          json_agg(
            json_build_object('disease_class', ir.disease_class, 'confidence', ir.confidence)
          ) FILTER (WHERE ir.id IS NOT NULL), '[]'
        ) AS detections
      FROM crop_samples cs
      LEFT JOIN inference_results ir ON cs.id = ir.sample_id
      WHERE cs.latitude IS NOT NULL AND cs.longitude IS NOT NULL
      GROUP BY cs.id, cs.latitude, cs.longitude, cs.created_at
      ORDER BY cs.created_at DESC
      LIMIT 500
    `;

    const locationsResult = await pool.query(locationsQuery);

    res.json({
      success: true,
      data: {
        diseases: result.rows.map(r => ({
          disease_class: r.disease_class,
          disease_name: r.disease_name_vi || r.disease_class,
          severity: r.severity,
          count: parseInt(r.detection_count, 10),
        })),
        locations: locationsResult.rows,
      },
    });
  } catch (error) {
    console.error('[Admin] getDiseaseDistribution error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay phan bo benh.' });
  }
};

module.exports = {
  getSummary,
  getUsers,
  getSamples,
  updateUserRole,
  deleteUser,
  deleteSample,
  getEnhancedStats,
  getTimeline,
  getDiseaseDistribution,
};
