const pool = require('../config/db');

/**
 * HomepageService — Aggregates data for all homepage widgets in minimal queries.
 *
 * Single service that returns everything the homepage needs:
 * - Field summary stats
 * - Active alerts
 * - Epidemic alerts
 * - Recent scan trends
 * - Personalized disease recommendations
 */
const HomepageService = {
  /**
   * Get complete homepage summary for a user.
   * Returns all widget data in a single aggregated response.
   */
  async getSummary(userId) {
    const [fieldStats, activeAlerts, epidemicAlerts, recentScans] = await Promise.all([
      this._getFieldStats(userId),
      this._getActiveAlerts(userId),
      this._getEpidemicAlerts(userId),
      this._getRecentScans(userId),
    ]);

    return {
      fieldStats,
      alerts: activeAlerts,
      epidemicAlerts,
      recentScans,
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * Get personalized disease cards for the encyclopedia widget.
   * Prioritizes diseases matching the user's crop types.
   */
  async getPersonalizedDiseases(userId, limit = 8) {
    // First get user's crop types
    const cropsResult = await pool.query(
      'SELECT DISTINCT crop_type FROM fields WHERE user_id = $1',
      [userId]
    );
    const userCrops = cropsResult.rows.map(r => r.crop_type.toLowerCase());

    // Get diseases matching user's crops, then fill with others
    let diseases;
    if (userCrops.length > 0) {
      const placeholders = userCrops.map((_, i) => `$${i + 1}`).join(', ');
      diseases = await pool.query(`
        SELECT id, disease_class, disease_name_vi, disease_name_en, crop_type, severity, description
        FROM crop_diseases
        WHERE LOWER(crop_type) IN (${placeholders})
        ORDER BY
          CASE severity WHEN 'severe' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END,
          disease_name_vi ASC
        LIMIT $${userCrops.length + 1}
      `, [...userCrops, limit]);
    } else {
      diseases = await pool.query(`
        SELECT id, disease_class, disease_name_vi, disease_name_en, crop_type, severity, description
        FROM crop_diseases
        ORDER BY
          CASE severity WHEN 'severe' THEN 1 WHEN 'moderate' THEN 2 ELSE 3 END,
          disease_name_vi ASC
        LIMIT $1
      `, [limit]);
    }

    return diseases.rows;
  },

  /**
   * Field summary stats: total fields, total zones, status counts.
   */
  async _getFieldStats(userId) {
    const result = await pool.query(`
      SELECT
        COUNT(DISTINCT f.id) AS total_fields,
        COUNT(sz.id) AS total_zones,
        COUNT(sz.id) FILTER (WHERE sz.status = 'HEALTHY') AS healthy_zones,
        COUNT(sz.id) FILTER (WHERE sz.status = 'WARNING') AS warning_zones,
        COUNT(sz.id) FILTER (WHERE sz.status = 'INFECTED') AS infected_zones
      FROM fields f
      LEFT JOIN sub_zones sz ON sz.field_id = f.id
      WHERE f.user_id = $1
    `, [userId]);

    const stats = result.rows[0];
    return {
      totalFields: parseInt(stats.total_fields) || 0,
      totalZones: parseInt(stats.total_zones) || 0,
      healthyZones: parseInt(stats.healthy_zones) || 0,
      warningZones: parseInt(stats.warning_zones) || 0,
      infectedZones: parseInt(stats.infected_zones) || 0,
    };
  },

  /**
   * Active (unacknowledged) station alerts.
   */
  async _getActiveAlerts(userId) {
    const result = await pool.query(`
      SELECT a.id, a.title, a.message, a.severity, a.target_region, a.target_crop, a.created_at,
             NOT EXISTS(SELECT 1 FROM alert_acknowledgments aa WHERE aa.alert_id = a.id AND aa.user_id = $1) AS is_unacknowledged
      FROM alerts a
      WHERE a.is_active = TRUE
        AND NOT EXISTS(SELECT 1 FROM alert_acknowledgments aa WHERE aa.alert_id = a.id AND aa.user_id = $1)
      ORDER BY a.created_at DESC
      LIMIT 5
    `, [userId]);

    return result.rows;
  },

  /**
   * Unread epidemic alerts (zone_alerts).
   */
  async _getEpidemicAlerts(userId) {
    const result = await pool.query(`
      SELECT za.id, za.threat_level, za.message, za.is_read, za.created_at,
             sz.crop_type, dr.disease_type
      FROM zone_alerts za
      JOIN sub_zones sz ON sz.id = za.sub_zone_id
      JOIN fields f ON f.id = sz.field_id
      JOIN disease_reports dr ON dr.id = za.disease_report_id
      WHERE f.user_id = $1 AND za.is_read = FALSE
      ORDER BY za.created_at DESC
      LIMIT 5
    `, [userId]);

    return result.rows;
  },

  /**
   * Recent AI scan results (last 7 days).
   */
  async _getRecentScans(userId) {
    const result = await pool.query(`
      SELECT cs.id, cs.image_url, cs.created_at,
             ir.disease_class, ir.confidence
      FROM crop_samples cs
      LEFT JOIN inference_results ir ON ir.sample_id = cs.id
      WHERE cs.user_id = $1
        AND cs.created_at >= NOW() - INTERVAL '7 days'
      ORDER BY cs.created_at DESC
      LIMIT 5
    `, [userId]);

    return result.rows;
  },
};

module.exports = HomepageService;