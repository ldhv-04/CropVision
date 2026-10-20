import { create } from 'zustand';
import api from '../../@core/api';
import { ENDPOINTS } from '../../@core/api/endpoints';

/**
 * metricStore — Zone metric data and time-series cache.
 *
 * Caches latest metrics per zone and time-series data.
 * TTL-based invalidation for stale data.
 */

const METRIC_TTL_MS = 5 * 60 * 1000; // 5 minutes

const useMetricStore = create((set, get) => ({
  // ── State ──
  // { [zoneId]: { data: MetricData, fetchedAt: number } }
  zoneMetrics: {},

  // { [zoneId]: { [metric]: { data: DataPoint[], fetchedAt: number } } }
  timeSeries: {},

  loading: false,
  error: null,

  // ── Fetch latest metrics for a zone ──
  fetchZoneMetrics: async (zoneId) => {
    const { zoneMetrics } = get();
    const cached = zoneMetrics[zoneId];
    if (cached && Date.now() - cached.fetchedAt < METRIC_TTL_MS) {
      return cached.data;
    }

    set({ loading: true, error: null });
    try {
      const res = await api.get(ENDPOINTS.subzones.metrics(zoneId));
      set((s) => ({
        zoneMetrics: {
          ...s.zoneMetrics,
          [zoneId]: { data: res.data, fetchedAt: Date.now() },
        },
        loading: false,
      }));
      return res.data;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  // ── Fetch time-series for a zone + metric ──
  fetchTimeSeries: async (zoneId, metric, range = '7d') => {
    const { timeSeries } = get();
    const cached = timeSeries[zoneId]?.[metric];
    if (cached && Date.now() - cached.fetchedAt < METRIC_TTL_MS) {
      return cached.data;
    }

    set({ loading: true, error: null });
    try {
      const res = await api.get(ENDPOINTS.subzones.timeSeries(zoneId, metric, range));
      const data = res.data.data || res.data;
      set((s) => ({
        timeSeries: {
          ...s.timeSeries,
          [zoneId]: {
            ...(s.timeSeries[zoneId] || {}),
            [metric]: { data, fetchedAt: Date.now() },
          },
        },
        loading: false,
      }));
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      return [];
    }
  },

  // ── Fetch health history for a zone ──
  fetchHealthHistory: async (zoneId) => {
    try {
      const res = await api.get(ENDPOINTS.subzones.healthHistory(zoneId));
      return res.data.history || res.data;
    } catch {
      return [];
    }
  },

  // ── Derived selectors ──
  getLatestMetric: (zoneId, metric) => {
    const { zoneMetrics } = get();
    const cached = zoneMetrics[zoneId];
    if (!cached?.data) return null;
    // Support both nested and flat response shapes
    const metrics = cached.data.latest_metrics || cached.data;
    return metrics?.[metric] ?? null;
  },

  getMetricTrend: (zoneId, metric) => {
    const { timeSeries } = get();
    const cached = timeSeries[zoneId]?.[metric];
    if (!cached?.data) return [];
    return cached.data;
  },

  getColorValue: (zoneId, layer) => {
    const { zoneMetrics } = get();
    const cached = zoneMetrics[zoneId];
    if (!cached?.data?.color_values) return null;
    return cached.data.color_values[layer] || null;
  },

  // ── Cache management ──
  invalidateZone: (zoneId) => {
    set((s) => {
      const { [zoneId]: _, ...rest } = s.zoneMetrics;
      const { [zoneId]: __, ...restTs } = s.timeSeries;
      return { zoneMetrics: rest, timeSeries: restTs };
    });
  },

  clearCache: () => set({ zoneMetrics: {}, timeSeries: {} }),

  // ── Reset ──
  reset: () =>
    set({
      zoneMetrics: {},
      timeSeries: {},
      error: null,
    }),
}));

export default useMetricStore;