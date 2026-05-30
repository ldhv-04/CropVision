/**
 * useSubZoneStore — AgriVision & Station Modules
 *
 * Manages cultivation sub-zones (plots), live sensor telemetry,
 * epidemiological outbreaks, and active alerts.
 */

import { create } from 'zustand';
import { apiRequest } from '../../@core/api/apiClient';
import { ENDPOINTS } from '../../@core/api/endpoints';

const useSubZoneStore = create((set, get) => ({
  // ─── State ────────────────────────────────────────────────────────────────
  subZones: [],
  activeMetrics: {},      // { [subZoneId]: metricsData }
  epidemicAlerts: [],
  outbreaks: [],
  selectedOutbreak: null,
  simulationResult: null, // { simulationCone, affectedZoneIds, weather }
  isLoading: false,
  isSaving: false,
  error: null,

  // ─── Actions ──────────────────────────────────────────────────────────────

  /** Fetch sub-zones for a parent field */
  fetchSubZones: async (token, fieldId) => {
    if (!token || !fieldId) return;
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest(ENDPOINTS.subzones.list(fieldId), {}, token);
      if (data.success) {
        set({ subZones: data.data, isLoading: false });
      } else {
        set({ error: data.message, isLoading: false });
      }
    } catch (err) {
      set({ error: err.message || 'Không thể tải danh sách vùng trồng.', isLoading: false });
    }
  },

  /** Create a new sub-zone */
  createSubZone: async (token, fieldId, subZoneData) => {
    set({ isSaving: true, error: null });
    try {
      const data = await apiRequest(ENDPOINTS.subzones.create(fieldId), {
        method: 'POST',
        body: JSON.stringify(subZoneData),
      }, token);
      if (data.success) {
        set((state) => ({
          subZones: [...state.subZones, data.data],
          isSaving: false,
        }));
        return { success: true, subZone: data.data };
      } else {
        set({ error: data.message, isSaving: false });
        return { success: false, message: data.message };
      }
    } catch (err) {
      const message = err.message || 'Không thể tạo vùng trồng.';
      set({ error: message, isSaving: false });
      return { success: false, message };
    }
  },

  /** Update an existing sub-zone (boundary or status) */
  updateSubZone: async (token, id, subZoneData) => {
    set({ isSaving: true, error: null });
    try {
      const data = await apiRequest(ENDPOINTS.subzones.detail(id), {
        method: 'PUT',
        body: JSON.stringify(subZoneData),
      }, token);
      if (data.success) {
        set((state) => ({
          subZones: state.subZones.map((z) => (z.id === id ? data.data : z)),
          isSaving: false,
        }));
        return { success: true, subZone: data.data };
      } else {
        set({ error: data.message, isSaving: false });
        return { success: false, message: data.message };
      }
    } catch (err) {
      const message = err.message || 'Không thể cập nhật vùng trồng.';
      set({ error: message, isSaving: false });
      return { success: false, message };
    }
  },

  /** Delete a sub-zone */
  deleteSubZone: async (token, id) => {
    set({ isSaving: true, error: null });
    try {
      const data = await apiRequest(ENDPOINTS.subzones.detail(id), {
        method: 'DELETE',
      }, token);
      if (data.success) {
        set((state) => ({
          subZones: state.subZones.filter((z) => z.id !== id),
          isSaving: false,
        }));
        return { success: true };
      } else {
        set({ error: data.message, isSaving: false });
        return { success: false, message: data.message };
      }
    } catch (err) {
      const message = err.message || 'Không thể xóa vùng trồng.';
      set({ error: message, isSaving: false });
      return { success: false, message };
    }
  },

  /** Fetch live sensor metrics for a sub-zone */
  fetchSubZoneMetrics: async (token, id) => {
    if (!token || !id) return;
    try {
      const data = await apiRequest(ENDPOINTS.subzones.metrics(id), {}, token);
      if (data.success) {
        set((state) => ({
          activeMetrics: {
            ...state.activeMetrics,
            [id]: data.data,
          },
        }));
        return { success: true, metrics: data.data };
      }
    } catch (err) {
      console.warn('[SubZoneStore] Metrics fetch failed:', err.message);
    }
    return { success: false };
  },

  /** Report a disease outbreak for a sub-zone */
  reportOutbreak: async (token, subZoneId, diseaseType, dangerRadius) => {
    set({ isSaving: true, error: null });
    try {
      const data = await apiRequest(ENDPOINTS.epidemic.report, {
        method: 'POST',
        body: JSON.stringify({ subZoneId, diseaseType, dangerRadius }),
      }, token);
      if (data.success) {
        // Optimistically set the reporting zone status to INFECTED
        set((state) => ({
          subZones: state.subZones.map((z) =>
            z.id === subZoneId ? { ...z, status: 'INFECTED' } : z
          ),
          isSaving: false,
        }));
        return { success: true, data };
      } else {
        set({ error: data.message, isSaving: false });
        return { success: false, message: data.message };
      }
    } catch (err) {
      const message = err.message || 'Không thể báo cáo dịch bệnh.';
      set({ error: message, isSaving: false });
      return { success: false, message };
    }
  },

  /** Fetch all active epidemic alerts for the current farmer */
  fetchEpidemicAlerts: async (token) => {
    if (!token) return;
    try {
      const data = await apiRequest(ENDPOINTS.epidemic.alerts, {}, token);
      if (data.success) {
        set({ epidemicAlerts: data.data });
      }
    } catch (err) {
      console.warn('[SubZoneStore] Alerts fetch failed:', err.message);
    }
  },

  /** Mark an alert as read */
  markAlertRead: async (token, id) => {
    if (!token || !id) return;
    try {
      const data = await apiRequest(ENDPOINTS.epidemic.alertRead(id), {
        method: 'PATCH',
      }, token);
      if (data.success) {
        set((state) => ({
          epidemicAlerts: state.epidemicAlerts.map((a) =>
            a.id === id ? { ...a, is_read: true } : a
          ),
        }));
      }
    } catch (err) {
      console.warn('[SubZoneStore] Mark alert read failed:', err.message);
    }
  },

  // ─── Station (Admin) Actions ──────────────────────────────────────────────

  /** Fetch all active outbreaks for admin incident ledger */
  fetchOutbreaks: async (token) => {
    if (!token) return;
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest(ENDPOINTS.epidemic.outbreaks, {}, token);
      if (data.success) {
        set({ outbreaks: data.data, isLoading: false });
      } else {
        set({ error: data.message, isLoading: false });
      }
    } catch (err) {
      set({ error: err.message || 'Không thể tải danh sách dịch bệnh.', isLoading: false });
    }
  },

  /** Fetch details of a single outbreak */
  fetchOutbreakDetail: async (token, id) => {
    if (!token || !id) return;
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest(ENDPOINTS.epidemic.outbreakDetail(id), {}, token);
      if (data.success) {
        set({ selectedOutbreak: data.data, isLoading: false });
      } else {
        set({ error: data.message, isLoading: false });
      }
    } catch (err) {
      set({ error: err.message || 'Không thể tải chi tiết dịch bệnh.', isLoading: false });
    }
  },

  /** Run custom wind dispersion simulation on the Map */
  runSimulation: async (token, simulationData) => {
    set({ isSaving: true });
    try {
      const data = await apiRequest(ENDPOINTS.epidemic.simulate, {
        method: 'POST',
        body: JSON.stringify(simulationData),
      }, token);
      if (data.success) {
        set({
          simulationResult: {
            simulationCone: data.simulationCone,
            affectedZoneIds: data.affectedZoneIds,
            weather: data.weather,
          },
          isSaving: false,
        });
        return { success: true, data };
      }
    } catch (err) {
      console.warn('[SubZoneStore] Run simulation failed:', err.message);
    }
    set({ isSaving: false });
    return { success: false };
  },

  /** Resolve an outbreak */
  resolveOutbreak: async (token, reportId) => {
    set({ isSaving: true });
    try {
      const data = await apiRequest(ENDPOINTS.epidemic.reportResolve(reportId), {
        method: 'PATCH',
      }, token);
      if (data.success) {
        set((state) => ({
          outbreaks: state.outbreaks.filter((o) => o.report_id !== reportId),
          simulationResult: null,
          selectedOutbreak: null,
          isSaving: false,
        }));
        return { success: true };
      }
    } catch (err) {
      console.warn('[SubZoneStore] Resolve outbreak failed:', err.message);
    }
    set({ isSaving: false });
    return { success: false };
  },

  clearSimulation: () => set({ simulationResult: null }),
}));

export { useSubZoneStore };
