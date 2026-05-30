import { create } from 'zustand';
import api from '../../@core/api';
import { ENDPOINTS } from '../../@core/api/endpoints';

/**
 * fieldStore — Field and zone CRUD operations.
 *
 * Manages the list of fields, current field detail, and sub-zones.
 */
const useFieldStore = create((set, get) => ({
  // ── State ──
  fields: [],
  currentField: null,
  currentZones: [],
  loading: false,
  error: null,

  // ── Field CRUD ──
  fetchFields: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(ENDPOINTS.fields.list);
      set({ fields: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchField: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(ENDPOINTS.fields.detail(id));
      set({ currentField: res.data, loading: false });
      return res.data;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  createField: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(ENDPOINTS.fields.create, data);
      const { fields } = get();
      set({ fields: [...fields, res.data], loading: false });
      return res.data;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  updateField: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.put(ENDPOINTS.fields.update(id), data);
      const { fields } = get();
      set({
        fields: fields.map((f) => (f.id === id ? res.data : f)),
        currentField: res.data,
        loading: false,
      });
      return res.data;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  deleteField: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(ENDPOINTS.fields.delete(id));
      const { fields } = get();
      set({ fields: fields.filter((f) => f.id !== id), loading: false });
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  // ── Sub-Zone CRUD ──
  fetchZones: async (fieldId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(ENDPOINTS.subzones.list(fieldId));
      set({ currentZones: res.data, loading: false });
      return res.data;
    } catch (err) {
      set({ error: err.message, loading: false });
      return [];
    }
  },

  fetchZonesSummary: async (fieldId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(ENDPOINTS.subzones.summary(fieldId));
      set({ currentZones: res.data.zones || res.data, loading: false });
      return res.data;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  createZone: async (fieldId, data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(ENDPOINTS.subzones.create(fieldId), data);
      const { currentZones } = get();
      set({ currentZones: [...currentZones, res.data], loading: false });
      return res.data;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  updateZone: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.put(ENDPOINTS.subzones.update(id), data);
      const { currentZones } = get();
      set({
        currentZones: currentZones.map((z) => (z.id === id ? res.data : z)),
        loading: false,
      });
      return res.data;
    } catch (err) {
      set({ error: err.message, loading: false });
      return null;
    }
  },

  deleteZone: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(ENDPOINTS.subzones.delete(id));
      const { currentZones } = get();
      set({ currentZones: currentZones.filter((z) => z.id !== id), loading: false });
      return true;
    } catch (err) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  // ── Activities ──
  fetchActivities: async (fieldId) => {
    try {
      const res = await api.get(ENDPOINTS.fields.activities(fieldId));
      return res.data;
    } catch {
      return [];
    }
  },

  addActivity: async (fieldId, data) => {
    try {
      const res = await api.post(ENDPOINTS.fields.addActivity(fieldId), data);
      return res.data;
    } catch {
      return null;
    }
  },

  // ── Derived ──
  getZoneById: (zoneId) => {
    const { currentZones } = get();
    return currentZones.find((z) => z.id === zoneId) || null;
  },

  // ── Reset ──
  reset: () =>
    set({
      currentField: null,
      currentZones: [],
      error: null,
    }),
}));

export default useFieldStore;