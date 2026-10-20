/**
 * useFieldStore — Canonical Field Store (@core Layer)
 *
 * Single Source of Truth (12-Factor App) for Field entity data,
 * sub-zones, and weather cache across Web and Mobile.
 */

import { create } from 'zustand';
import api from '../api';
import { ENDPOINTS } from '../api/endpoints';

export const useFieldStore = create((set, get) => ({
  // ─── State ────────────────────────────────────────────────────────────────
  fields: [],
  currentField: null,
  selectedFieldId: null,
  currentZones: [],
  weatherByField: {}, // { [fieldId]: weatherData }
  loading: false,
  isLoading: false,   // Alias for compatibility
  isCreating: false,
  error: null,

  // ─── Field CRUD ───────────────────────────────────────────────────────────

  /**
   * Fetch all fields owned by the current user.
   * Supports optional token argument or automatic auth injection.
   */
  fetchFields: async (token = null) => {
    set({ loading: true, isLoading: true, error: null });
    try {
      const res = await api.get(ENDPOINTS.fields.list, {}, token);
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      set({ fields: list, loading: false, isLoading: false });
      return list;
    } catch (err) {
      const message = err.message || 'Không thể tải danh sách cánh đồng.';
      set({ error: message, loading: false, isLoading: false });
      return [];
    }
  },

  /**
   * Fetch a single field detail by ID.
   */
  fetchField: async (id, token = null) => {
    if (!id) return null;
    set({ loading: true, isLoading: true, error: null });
    try {
      const res = await api.get(ENDPOINTS.fields.detail(id), {}, token);
      const field = res?.data || res;
      set({
        currentField: field,
        selectedFieldId: id,
        loading: false,
        isLoading: false,
      });
      return field;
    } catch (err) {
      const message = err.message || 'Không thể tải chi tiết cánh đồng.';
      set({ error: message, loading: false, isLoading: false });
      return null;
    }
  },

  /**
   * Create a new field.
   * Polymorphic signature supports:
   *   createField(fieldData)
   *   createField(token, fieldData)
   *   createField(fieldData, token)
   */
  createField: async (arg1, arg2) => {
    let fieldData = typeof arg1 === 'string' ? arg2 : arg1;
    let token = typeof arg1 === 'string' ? arg1 : (arg2 || null);

    set({ loading: true, isCreating: true, error: null });
    try {
      const res = await api.post(ENDPOINTS.fields.create, fieldData, {}, token);
      const created = res?.data || res;

      // Ensure created object is enriched with success indicator for caller flexibility
      const result = typeof created === 'object' && created !== null
        ? { ...created, success: true, field: created }
        : created;

      const { fields } = get();
      set({
        fields: [created, ...fields.filter((f) => f.id !== created.id)],
        currentField: created,
        selectedFieldId: created.id,
        loading: false,
        isCreating: false,
      });
      return result;
    } catch (err) {
      const message = err.message || 'Không thể tạo cánh đồng.';
      set({ error: message, loading: false, isCreating: false });
      return null;
    }
  },

  /**
   * Update an existing field.
   */
  updateField: async (id, data, token = null) => {
    set({ loading: true, error: null });
    try {
      const res = await api.put(ENDPOINTS.fields.update(id), data, {}, token);
      const updated = res?.data || res;
      const { fields } = get();
      set({
        fields: fields.map((f) => (f.id === id ? updated : f)),
        currentField: updated,
        loading: false,
      });
      return updated;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  /**
   * Delete a field by ID.
   */
  deleteField: async (id, token = null) => {
    set({ loading: true, error: null });
    try {
      await api.delete(ENDPOINTS.fields.delete(id), {}, token);
      const { fields, selectedFieldId } = get();
      set({
        fields: fields.filter((f) => f.id !== id),
        currentField: selectedFieldId === id ? null : get().currentField,
        selectedFieldId: selectedFieldId === id ? null : selectedFieldId,
        loading: false,
      });
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  // ─── Sub-Zone Operations ──────────────────────────────────────────────────

  fetchZones: async (fieldId, token = null) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(ENDPOINTS.subzones.list(fieldId), {}, token);
      const zones = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      set({ currentZones: zones, loading: false });
      return zones;
    } catch (err) {
      set({ error: err.message, loading: false });
      return [];
    }
  },

  fetchZonesSummary: async (fieldId, token = null) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(ENDPOINTS.subzones.summary(fieldId), {}, token);
      const zones = res?.data?.zones || res?.data || res || [];
      set({ currentZones: Array.isArray(zones) ? zones : [], loading: false });
      return res?.data || res;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  createZone: async (fieldId, data, token = null) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(ENDPOINTS.subzones.create(fieldId), data, {}, token);
      const created = res?.data || res;
      const { currentZones } = get();
      set({ currentZones: [...currentZones, created], loading: false });
      return created;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  updateZone: async (id, data, token = null) => {
    set({ loading: true, error: null });
    try {
      const res = await api.put(ENDPOINTS.subzones.update(id), data, {}, token);
      const updated = res?.data || res;
      const { currentZones } = get();
      set({
        currentZones: currentZones.map((z) => (z.id === id ? updated : z)),
        loading: false,
      });
      return updated;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  deleteZone: async (id, token = null) => {
    set({ loading: true, error: null });
    try {
      await api.delete(ENDPOINTS.subzones.delete(id), {}, token);
      const { currentZones } = get();
      set({ currentZones: currentZones.filter((z) => z.id !== id), loading: false });
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  // ─── Activities ───────────────────────────────────────────────────────────

  fetchActivities: async (fieldId, token = null) => {
    try {
      const res = await api.get(ENDPOINTS.fields.activities(fieldId), {}, token);
      return res?.data || res || [];
    } catch {
      return [];
    }
  },

  addActivity: async (fieldId, data, token = null) => {
    try {
      const res = await api.post(ENDPOINTS.fields.addActivity(fieldId), data, {}, token);
      return res?.data || res;
    } catch {
      return null;
    }
  },

  // ─── Weather Cache ────────────────────────────────────────────────────────

  fetchWeatherForField: async (token, field) => {
    const targetField = field || get().currentField;
    if (!targetField?.latitude || !targetField?.longitude) return;
    try {
      const res = await api.get(
        ENDPOINTS.weather.current(targetField.latitude, targetField.longitude),
        {},
        token
      );
      const data = res?.data || res;
      set((state) => ({
        weatherByField: {
          ...state.weatherByField,
          [targetField.id]: data,
        },
      }));
    } catch (err) {
      console.warn('[FieldStore] Weather fetch failed:', err?.message);
    }
  },

  // ─── Selection & Helper Selectors ─────────────────────────────────────────

  selectField: (fieldId) => {
    const { fields } = get();
    const current = fields.find((f) => f.id === fieldId) || null;
    set({ selectedFieldId: fieldId, currentField: current });
  },

  setCurrentField: (field) => {
    set({ currentField: field, selectedFieldId: field?.id || null });
  },

  getZoneById: (zoneId) => {
    const { currentZones } = get();
    return currentZones.find((z) => z.id === zoneId) || null;
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      fields: [],
      currentField: null,
      selectedFieldId: null,
      currentZones: [],
      weatherByField: {},
      error: null,
      loading: false,
      isLoading: false,
      isCreating: false,
    }),
}));

export default useFieldStore;
