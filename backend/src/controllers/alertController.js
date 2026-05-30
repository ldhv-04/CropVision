/**
 * Alert Controller — FULL VERSION
 *
 * Station → Field Feedback Loop with:
 * - Geographic targeting (radius-based filtering)
 * - Severity levels (info/warning/critical)
 * - Auto-suggestions from scan data (anomaly detection)
 * - Performance metrics (views, acks, response rates)
 */

const pool = require('../config/db');

// ── Haversine distance in km ──────────────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * POST /api/alerts — Admin creates an alert
 * Body: { title, message, severity, target_region, target_crop, target_lat, target_lng, target_radius_km }
 */
const createAlert = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Chi admin moi co the tao canh bao.' });
    }

    const { title, message, severity = 'info', target_region, target_crop, target_lat, target_lng, target_radius_km } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Tieu va noi dung canh bao la bat buoc.' });
    }

    const validSeverities = ['info', 'warning', 'critical'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({ success: false, message: 'Muc do canh bao khong hop le.' });
    }

    const query = `
      INSERT INTO alerts (title, message, severity, target_region, target_crop, created_by, target_lat, target_lng, target_radius_km)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const result = await pool.query(query, [
      title, message, severity,
      target_region || null, target_crop || null, req.user.userId,
      target_lat ? parseFloat(target_lat) : null,
      target_lng ? parseFloat(target_lng) : null,
      target_radius_km ? parseFloat(target_radius_km) : null,
    ]);

    res.status(201).json({
      success: true,
      message: 'Tao canh bao thanh cong.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[Alert] createAlert error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi tao canh bao.' });
  }
};

/**
 * GET /api/alerts — Farmer gets active alerts
 * Filters by geographic proximity if alert has geo-targeting.
 * Query: limit (default 20), lat, lng
 */
const getActiveAlerts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const farmerLat = req.query.lat ? parseFloat(req.query.lat) : null;
    const farmerLng = req.query.lng ? parseFloat(req.query.lng) : null;

    const query = `
      SELECT a.*,
        u.full_name AS creator_name,
        (SELECT COUNT(*) FROM alert_acknowledgments aa WHERE aa.alert_id = a.id) AS ack_count,
        (SELECT COUNT(*) FROM alert_acknowledgments aa WHERE aa.alert_id = a.id AND aa.user_id = $1) > 0 AS acknowledged_by_me
      FROM alerts a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.is_active = TRUE
      ORDER BY
        CASE a.severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
        a.created_at DESC
      LIMIT $2;
    `;

    const result = await pool.query(query, [req.user.userId, limit]);

    // Filter by geo-targeting: only show alerts where farmer is within radius
    let filtered = result.rows;
    if (farmerLat !== null && farmerLng !== null) {
      filtered = result.rows.filter((alert) => {
        // If no geo-targeting, show to everyone
        if (!alert.target_lat || !alert.target_lng || !alert.target_radius_km) return true;
        const dist = haversineDistance(farmerLat, farmerLng, parseFloat(alert.target_lat), parseFloat(alert.target_lng));
        return dist <= parseFloat(alert.target_radius_km);
      });
    } else {
      // No farmer location provided: only show non-geo-targeted alerts
      filtered = result.rows.filter((a) => !a.target_lat || !a.target_lng || !a.target_radius_km);
    }

    res.json({
      success: true,
      message: 'Lay danh sach canh bao thanh cong.',
      data: filtered,
    });
  } catch (error) {
    console.error('[Alert] getActiveAlerts error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay danh sach canh bao.' });
  }
};

/**
 * GET /api/alerts/all — Admin gets all alerts with stats
 */
const getAllAlerts = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Chi admin moi co the xem tat ca canh bao.' });
    }

    const query = `
      SELECT a.*,
        u.full_name AS creator_name,
        (SELECT COUNT(*) FROM alert_acknowledgments aa WHERE aa.alert_id = a.id) AS ack_count,
        (SELECT COUNT(*) FROM users WHERE role = 'user') AS total_users,
        (SELECT MIN(acknowledged_at) FROM alert_acknowledgments aa WHERE aa.alert_id = a.id) AS first_ack_at
      FROM alerts a
      LEFT JOIN users u ON a.created_by = u.id
      ORDER BY a.created_at DESC
      LIMIT 100;
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      message: 'Lay tat ca canh bao thanh cong.',
      data: result.rows,
    });
  } catch (error) {
    console.error('[Alert] getAllAlerts error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay danh sach canh bao.' });
  }
};

/**
 * GET /api/alerts/suggestions — Auto-detect anomalies from scan data
 * Scans the last N days for disease clusters that may warrant an alert.
 */
const getAnomalySuggestions = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Chi admin moi co the xem goi y.' });
    }

    const days = parseInt(req.query.days, 10) || 7;
    const minDetections = parseInt(req.query.min_detections, 10) || 5;

    // Find disease clusters: disease_class that appeared >= minDetections in the last N days
    // Group by approximate region (rounded lat/lng to ~10km grid)
    const query = `
      SELECT
        ir.disease_class,
        cd.disease_name_vi,
        cd.severity AS disease_severity,
        cd.crop_type,
        COUNT(DISTINCT cs.id) AS scan_count,
        COUNT(DISTINCT cs.user_id) AS affected_farmers,
        ROUND(AVG(cs.latitude)::numeric, 2) AS avg_lat,
        ROUND(AVG(cs.longitude)::numeric, 2) AS avg_lng,
        MIN(cs.created_at) AS first_detected,
        MAX(cs.created_at) AS last_detected
      FROM inference_results ir
      JOIN crop_samples cs ON ir.sample_id = cs.id
      LEFT JOIN crop_diseases cd ON ir.disease_class = cd.disease_class
      WHERE cs.created_at >= NOW() - INTERVAL '1 day' * $1
        AND cs.latitude IS NOT NULL
        AND cs.longitude IS NOT NULL
        AND cd.severity != 'mild'
      GROUP BY ir.disease_class, cd.disease_name_vi, cd.severity, cd.crop_type
      HAVING COUNT(DISTINCT cs.id) >= $2
      ORDER BY scan_count DESC
      LIMIT 20;
    `;

    const result = await pool.query(query, [days, minDetections]);

    // Check which suggestions already have active alerts
    const existingAlerts = await pool.query(
      `SELECT target_crop, target_region FROM alerts WHERE is_active = TRUE`
    );

    const suggestions = result.rows.map((row) => ({
      ...row,
      suggested_title: `Phát hiện ${row.disease_name_vi || row.disease_class} tại khu vực (${row.avg_lat}, ${row.avg_lng})`,
      suggested_message: `Phát hiện ${row.scan_count} ca ${row.disease_name_vi || row.disease_class} từ ${row.affected_farmers} nông dân trong ${days} ngày qua. Khuyến nghị kiểm tra và phun phòng.`,
      suggested_severity: row.disease_severity === 'severe' ? 'critical' : 'warning',
      suggested_radius_km: 30,
    }));

    res.json({
      success: true,
      message: 'Lay goi y canh bao thanh cong.',
      data: suggestions,
    });
  } catch (error) {
    console.error('[Alert] getAnomalySuggestions error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi phan tich du lieu.' });
  }
};

/**
 * GET /api/alerts/:id/metrics — Performance metrics for a specific alert
 */
const getAlertMetrics = async (req, res) => {
  try {
    const alertId = parseInt(req.params.id, 10);

    // Get alert details
    const alertResult = await pool.query('SELECT * FROM alerts WHERE id = $1', [alertId]);
    if (alertResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay canh bao.' });
    }

    const alert = alertResult.rows[0];

    // Get metrics
    const metricsQuery = `
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'user') AS total_users,
        (SELECT COUNT(*) FROM alert_acknowledgments WHERE alert_id = $1) AS ack_count,
        (SELECT MIN(acknowledged_at) FROM alert_acknowledgments WHERE alert_id = $1) AS first_ack_at,
        (SELECT MAX(acknowledged_at) FROM alert_acknowledgments WHERE alert_id = $1) AS last_ack_at,
        (SELECT AVG(EXTRACT(EPOCH FROM (aa.acknowledged_at - a.created_at)) / 3600)
         FROM alert_acknowledgments aa
         JOIN alerts a ON a.id = aa.alert_id
         WHERE aa.alert_id = $1) AS avg_response_hours
    `;

    const metricsResult = await pool.query(metricsQuery, [alertId]);
    const m = metricsResult.rows[0];

    const totalUsers = parseInt(m.total_users, 10) || 0;
    const ackCount = parseInt(m.ack_count, 10) || 0;

    res.json({
      success: true,
      message: 'Lay thong ke canh bao thanh cong.',
      data: {
        alert,
        metrics: {
          total_users: totalUsers,
          ack_count: ackCount,
          ack_percentage: totalUsers > 0 ? Math.round((ackCount / totalUsers) * 100) : 0,
          first_ack_at: m.first_ack_at,
          last_ack_at: m.last_ack_at,
          avg_response_hours: m.avg_response_hours ? parseFloat(m.avg_response_hours).toFixed(1) : null,
        },
      },
    });
  } catch (error) {
    console.error('[Alert] getAlertMetrics error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay thong ke canh bao.' });
  }
};

/**
 * POST /api/alerts/:id/acknowledge — Farmer acknowledges an alert
 */
const acknowledgeAlert = async (req, res) => {
  try {
    const alertId = parseInt(req.params.id, 10);

    const query = `
      INSERT INTO alert_acknowledgments (alert_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (alert_id, user_id) DO NOTHING
      RETURNING *;
    `;
    const result = await pool.query(query, [alertId, req.user.userId]);

    res.json({
      success: true,
      message: result.rows.length > 0 ? 'Da xac nhan canh bao.' : 'Ban da xac nhan canh bao nay roi.',
      data: result.rows[0] || null,
    });
  } catch (error) {
    console.error('[Alert] acknowledgeAlert error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi xac nhan canh bao.' });
  }
};

/**
 * PATCH /api/alerts/:id/deactivate — Admin deactivates an alert
 */
const deactivateAlert = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Chi admin moi co the tat canh bao.' });
    }

    const alertId = parseInt(req.params.id, 10);
    const query = `UPDATE alerts SET is_active = FALSE WHERE id = $1 RETURNING *;`;
    const result = await pool.query(query, [alertId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay canh bao.' });
    }

    res.json({
      success: true,
      message: 'Da tat canh bao.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[Alert] deactivateAlert error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi tat canh bao.' });
  }
};

module.exports = {
  createAlert,
  getActiveAlerts,
  getAllAlerts,
  getAnomalySuggestions,
  getAlertMetrics,
  acknowledgeAlert,
  deactivateAlert,
};