/**
 * metricCalculators — Metric normalization and aggregation helpers.
 *
 * Normalizes raw metric values to 0-1 range for color mapping.
 * Provides trend calculations and health score computation.
 */

// ── Normalization ranges ──
const METRIC_RANGES = {
  temperature: { min: 10, max: 40 },
  humidity: { min: 0, max: 100 },
  soil_moisture: { min: 0, max: 100 },
  soil_ph: { min: 4.0, max: 9.0 },
  nitrogen: { min: 0, max: 100 },
  ec: { min: 0, max: 4 },
};

/**
 * Normalize a metric value to 0-1 range.
 * @param {string} metric - metric name
 * @param {number} value - raw value
 * @returns {number} normalized 0-1
 */
export function normalizeMetric(metric, value) {
  const range = METRIC_RANGES[metric];
  if (!range) return 0;
  return Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
}

/**
 * Denormalize a 0-1 value back to metric range.
 */
export function denormalizeMetric(metric, normalized) {
  const range = METRIC_RANGES[metric];
  if (!range) return 0;
  return range.min + normalized * (range.max - range.min);
}

/**
 * Get the metric range for display (min/max labels).
 */
export function getMetricRange(metric) {
  return METRIC_RANGES[metric] || { min: 0, max: 100 };
}

/**
 * Calculate trend direction from a time-series array.
 * @param {Array<{timestamp: string, value: number}>} dataPoints
 * @returns {{ direction: 'up'|'down'|'stable', delta: number, percent: number }}
 */
export function calculateTrend(dataPoints) {
  if (!dataPoints || dataPoints.length < 2) {
    return { direction: 'stable', delta: 0, percent: 0 };
  }

  const recent = dataPoints[dataPoints.length - 1].value;
  const previous = dataPoints[0].value;
  const delta = recent - previous;
  const percent = previous !== 0 ? ((delta / Math.abs(previous)) * 100).toFixed(1) : 0;

  let direction = 'stable';
  if (Math.abs(delta) > 0.1) {
    direction = delta > 0 ? 'up' : 'down';
  }

  return { direction, delta: delta.toFixed(1), percent };
}

/**
 * Format metric value for display.
 * @param {string} metric
 * @param {number} value
 * @returns {string}
 */
export function formatMetric(metric, value) {
  if (value == null) return '—';
  const units = {
    temperature: '°C',
    humidity: '%',
    soil_moisture: '%',
    soil_ph: '',
    nitrogen: 'mg/kg',
    ec: 'mS/cm',
  };
  const decimals = metric === 'soil_ph' ? 1 : 0;
  return `${Number(value).toFixed(decimals)}${units[metric] || ''}`;
}

/**
 * Get display label for a metric key.
 */
export function getMetricLabel(metric) {
  const labels = {
    temperature: 'Temperature',
    humidity: 'Humidity',
    soil_moisture: 'Soil Moisture',
    soil_ph: 'Soil pH',
    nitrogen: 'Nitrogen',
    ec: 'EC',
  };
  return labels[metric] || metric;
}

/**
 * Get emoji icon for a metric.
 */
export function getMetricIcon(metric) {
  const icons = {
    temperature: '🌡',
    humidity: '💧',
    soil_moisture: '💧',
    soil_ph: '⚗',
    nitrogen: '🧪',
    ec: '⚡',
  };
  return icons[metric] || '📊';
}

/**
 * Compute composite health score from individual metrics.
 * Weights: disease status (40%), moisture (20%), pH (15%), nitrogen (15%), temp (10%)
 */
export function computeHealthScore(metrics) {
  if (!metrics) return 1.0;

  const weights = {
    disease: 0.40,
    moisture: 0.20,
    ph: 0.15,
    nitrogen: 0.15,
    temperature: 0.10,
  };

  let score = 0;
  let totalWeight = 0;

  // Disease: HEALTHY=1.0, WARNING=0.5, INFECTED=0.0
  if (metrics.status) {
    const diseaseScore = { HEALTHY: 1.0, WARNING: 0.5, INFECTED: 0.0 }[metrics.status] || 0.5;
    score += diseaseScore * weights.disease;
    totalWeight += weights.disease;
  }

  // Moisture: optimal at 40-60%, penalize extremes
  if (metrics.soil_moisture != null) {
    const m = metrics.soil_moisture;
    const moistureScore = m >= 30 && m <= 70 ? 1.0 : m < 30 ? m / 30 : (100 - m) / 30;
    score += Math.max(0, Math.min(1, moistureScore)) * weights.moisture;
    totalWeight += weights.moisture;
  }

  // pH: optimal at 6.0-7.5
  if (metrics.soil_ph != null) {
    const p = metrics.soil_ph;
    const phScore = p >= 6.0 && p <= 7.5 ? 1.0 : p < 6.0 ? (p - 4.0) / 2.0 : (9.0 - p) / 1.5;
    score += Math.max(0, Math.min(1, phScore)) * weights.ph;
    totalWeight += weights.ph;
  }

  // Nitrogen: higher is generally better (up to a point)
  if (metrics.nitrogen != null) {
    const n = metrics.nitrogen;
    const nScore = n >= 40 ? 1.0 : n / 40;
    score += Math.max(0, Math.min(1, nScore)) * weights.nitrogen;
    totalWeight += weights.nitrogen;
  }

  // Temperature: optimal at 20-30°C
  if (metrics.temperature != null) {
    const t = metrics.temperature;
    const tScore = t >= 20 && t <= 30 ? 1.0 : t < 20 ? (t - 10) / 10 : (40 - t) / 10;
    score += Math.max(0, Math.min(1, tScore)) * weights.temperature;
    totalWeight += weights.temperature;
  }

  return totalWeight > 0 ? Math.round((score / totalWeight) * 100) / 100 : 1.0;
}