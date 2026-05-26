/**
 * useFieldStore — AgriVision Module
 *
 * Manages field list and weather data for the farmer's AgriVision app.
 * Uses apiRequest from @core for consistent auth header injection.
 */

import { create } from 'zustand';
import { apiRequest } from '../../@core/api/apiClient';
import { ENDPOINTS } from '../../@core/api/endpoints';

const useFieldStore = create((set, get) => ({
  // ─── State ────────────────────────────────────────────────────────────────
  fields: [],
  selectedFieldId: null,
  weatherByField: {},   // { [fieldId]: weatherData }
  isLoading: false,
  isCreating: false,
  error: null,

  // ─── Actions ──────────────────────────────────────────────────────────────

  /** Fetch all fields owned by the current user */
  fetchFields: async (token) => {
    if (!token) return;
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest(ENDPOINTS.fields.list, {}, token);
      if (data.success) {
        set({ fields: data.data, isLoading: false });
      } else {
        set({ error: data.message, isLoading: false });
      }
    } catch (err) {
      set({ error: err.message || 'Không thể tải danh sách cánh đồng.', isLoading: false });
    }
  },

  /** Create a new field */
  createField: async (token, fieldData) => {
    set({ isCreating: true, error: null });
    try {
      const data = await apiRequest(ENDPOINTS.fields.create, {
        method: 'POST',
        body: JSON.stringify(fieldData),
      }, token);
      if (data.success) {
        set((state) => ({
          fields: [data.data, ...state.fields],
          isCreating: false,
        }));
        return { success: true, field: data.data };
      } else {
        set({ error: data.message, isCreating: false });
        return { success: false, message: data.message };
      }
    } catch (err) {
      const message = err.message || 'Không thể tạo cánh đồng.';
      set({ error: message, isCreating: false });
      return { success: false, message };
    }
  },

  /** Fetch weather for a specific field's coordinates */
  fetchWeatherForField: async (token, field) => {
    if (!field?.latitude || !field?.longitude) return;
    try {
      const data = await apiRequest(
        ENDPOINTS.weather.current(field.latitude, field.longitude),
        {},
        token
      );
      if (data.success) {
        set((state) => ({
          weatherByField: {
            ...state.weatherByField,
            [field.id]: data.data,
          },
        }));
      }
    } catch (err) {
      // Weather fetch is non-critical — silently fail
      console.warn('[FieldStore] Weather fetch failed:', err.message);
    }
  },

  /** Select a field (for inference context) */
  selectField: (fieldId) => set({ selectedFieldId: fieldId }),

  clearError: () => set({ error: null }),
}));

export { useFieldStore };
