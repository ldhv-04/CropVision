import { useCallback, useEffect, useState } from 'react';
import useMetricStore from '../stores/metricStore';
import { calculateTrend, formatMetric, getMetricLabel, getMetricIcon } from '../utils/metricCalculators';

/**
 * useZoneMetrics — Fetches and formats metric data for a specific zone.
 *
 * @param {number|string} zoneId
 * @returns {{ metrics, timeSeries, loading, trends, formatted }}
 */
export default function useZoneMetrics(zoneId) {
  const {
    fetchZoneMetrics,
    fetchTimeSeries,
    getLatestMetric,
    getMetricTrend,
    loading,
    error,
  } = useMetricStore();

  const [trends, setTrends] = useState({});

  // Fetch latest metrics when zone changes
  useEffect(() => {
    if (zoneId) {
      fetchZoneMetrics(zoneId);
    }
  }, [zoneId]);

  // Fetch time-series for all metrics
  const fetchAllTimeSeries = useCallback(async (range = '7d') => {
    if (!zoneId) return;

    const metricKeys = ['temperature', 'humidity', 'soil_moisture', 'soil_ph', 'nitrogen'];
    const results = {};

    await Promise.all(
      metricKeys.map(async (metric) => {
        const data = await fetchTimeSeries(zoneId, metric, range);
        if (data && data.length > 0) {
          results[metric] = calculateTrend(data);
        }
      })
    );

    setTrends(results);
  }, [zoneId, fetchTimeSeries]);

  // Auto-fetch time-series when zone changes
  useEffect(() => {
    if (zoneId) {
      fetchAllTimeSeries();
    }
  }, [zoneId, fetchAllTimeSeries]);

  // Format metrics for display
  const getFormattedMetric = useCallback((metric) => {
    const value = getLatestMetric(zoneId, metric);
    return {
      value,
      formatted: formatMetric(metric, value),
      label: getMetricLabel(metric),
      icon: getMetricIcon(metric),
      trend: trends[metric] || { direction: 'stable', delta: 0, percent: 0 },
    };
  }, [zoneId, getLatestMetric, trends]);

  const getAllFormattedMetrics = useCallback(() => {
    const keys = ['temperature', 'humidity', 'soil_moisture', 'soil_ph', 'nitrogen'];
    return keys.map((metric) => getFormattedMetric(metric));
  }, [getFormattedMetric]);

  return {
    loading,
    error,
    trends,
    fetchAllTimeSeries,
    getFormattedMetric,
    getAllFormattedMetrics,
    getLatestMetric: (metric) => getLatestMetric(zoneId, metric),
    getMetricTrend: (metric) => getMetricTrend(zoneId, metric),
  };
}