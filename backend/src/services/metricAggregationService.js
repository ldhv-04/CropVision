const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * MetricAggregationService — Aggregates zone metrics for map rendering.
 *
 * Single query per field instead of N queries per zone.
 * Supports time-series aggregation and health history.
 */
const MetricAggregationService = {
  /**
   * Get all zones for a field with their latest metrics in one query.
   * Uses LATERAL JOIN for efficient latest-metric-per-zone fetching.
   *
   * @param {string} fieldId - UUID of the field
   * @returns {Promise<Array>} zones with latest metrics and color values
   */
  async getZonesSummary(fieldId) {
    const query = `
      SELECT
        sz.id, sz.field_id, sz.crop_type, sz.boundary, sz.status,
        sz.planting_date, sz.fertilize_freq, sz.spray_freq,
        sz.created_at, sz.updated_at,
        sz.health_score,
        lm.temperature, lm.humidity, lm.soil_moisture, lm.ph as soil_ph,
        lm.ec, lm.health_score as metric_health_score,
        lm.created_at as measured_at
      FROM sub_zones sz
      LEFT JOIN LATERAL (
        SELECT temperature, humidity, soil_moisture, ph, ec, health_score, created_at
        FROM zone_metrics
        WHERE sub_zone_id = sz.id
        ORDER BY created_at DESC
        LIMIT 1
      ) lm ON true
      WHERE sz.field_id = $1
      ORDER BY sz.id
    `;

    const result = await pool.query(query, [fieldId]);

    // Enrich each zone with color values for all layers
    return result.rows.map((zone) => ({
      ...zone,
      color_values: {
        disease: {
          value: this._diseaseToNumeric(zone.status),
          state: zone.status,
        },
        moisture: {
          value: zone.soil_moisture != null ? parseFloat(zone.soil_moisture) : null,
          normalized: zone.soil_moisture != null ? parseFloat(zone.soil_moisture) / 100 : null,
        },
        ph: {
          value: zone.soil_ph != null ? parseFloat(zone.soil_ph) : null,
          normalized: zone.soil_ph != null ? (parseFloat(zone.soil_ph) - 4.0) / 5.0 : null,
        },
        nitrogen: {
          value: zone.ec != null ? parseFloat(zone.ec) * 25 : null, // EC proxy for nitrogen
          normalized: zone.ec != null ? Math.min(1, parseFloat(zone.ec) * 25 / 100) : null,
        },
        temperature: {
          value: zone.temperature != null ? parseFloat(zone.temperature) : null,
          normalized: zone.temperature != null ? (parseFloat(zone.temperature) - 10) / 30 : null,
        },
      },
    }));
  },

  /**
   * Get time-series data for a specific zone and metric.
   *
   * @param {number} zoneId
   * @param {string} metric - column name (temperature, humidity, soil_moisture, ph, ec)
   * @param {string} range - '7d', '30d', '90d'
   * @returns {Promise<Array>} array of { timestamp, value }
   */
  async getZoneTimeSeries(zoneId, metric, range = '7d') {
    // Validate metric column name to prevent SQL injection
    const allowedMetrics = ['temperature', 'humidity', 'soil_moisture', 'ph', 'ec', 'health_score'];
    if (!allowedMetrics.includes(metric)) {
      throw new Error(`Invalid metric: ${metric}. Allowed: ${allowedMetrics.join(', ')}`);
    }

    // Parse range
    const rangeMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = rangeMap[range] || 7;

    // Determine bucket size based on range
    let bucketInterval;
    if (days <= 7) {
      bucketInterval = '6 hours';
    } else if (days <= 30) {
      bucketInterval = '1 day';
    } else {
      bucketInterval = '3 days';
    }

    const query = `
      SELECT
        date_trunc('hour', created_at) AT TIME ZONE 'UTC' AS bucket,
        ROUND(AVG(${metric})::numeric, 2) AS value,
        MIN(created_at) AS timestamp
      FROM zone_metrics
      WHERE sub_zone_id = $1
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    const result = await pool.query(query, [zoneId]);

    return result.rows.map((row) => ({
      timestamp: row.timestamp || row.bucket,
      value: parseFloat(row.value),
    }));
  },

  /**
   * Get health history for a zone.
   *
   * @param {number} zoneId
   * @returns {Promise<Array>} ordered health change timeline
   */
  async getZoneHealthHistory(zoneId) {
    const query = `
      SELECT status, health_score, reason, changed_at
      FROM zone_health_history
      WHERE sub_zone_id = $1
      ORDER BY changed_at ASC
    `;

    const result = await pool.query(query, [zoneId]);

    // If no history exists, create one from current zone state
    if (result.rows.length === 0) {
      const zoneQuery = `
        SELECT status, health_score, created_at
        FROM sub_zones
        WHERE id = $1
      `;
      const zoneResult = await pool.query(zoneQuery, [zoneId]);
      if (zoneResult.rows.length > 0) {
        const zone = zoneResult.rows[0];
        return [{
          status: zone.status,
          health_score: parseFloat(zone.health_score || 1.0),
          reason: 'initial',
          changed_at: zone.created_at,
        }];
      }
    }

    return result.rows.map((row) => ({
      status: row.status,
      health_score: parseFloat(row.health_score),
      reason: row.reason,
      changed_at: row.changed_at,
    }));
  },

  /**
   * Convert disease status to numeric for color mapping.
   */
  _diseaseToNumeric(status) {
    const map = { HEALTHY: 0.9, WARNING: 0.5, INFECTED: 0.1 };
    return map[status] || 0.5;
  },
};

module.exports = MetricAggregationService;