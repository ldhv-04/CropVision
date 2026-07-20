/**
 * useMobileFieldStore — Mobile Field Manager Store (Task 2)
 *
 * Manages field list and zone map data for the mobile field viewer.
 * Uses apiRequest from @core for consistent auth header injection.
 *
 * DEPENDENCY NOTE:
 * - This store calls only /api/mobile/* endpoints.
 * - These endpoints expose only published zone maps — never draft.
 * - No satellite tiles, no MapLibre — polygon-only GeoJSON data.
 *
 * FUTURE DEPENDENCY NOTE:
 * - Crop/cultivation data (Task 3) will be fetched separately.
 * - This store only handles spatial polygon data.
 */

import { create } from 'zustand';
import { apiRequest } from '../../@core/api/apiClient';
import { ENDPOINTS } from '../../@core/api/endpoints';
import { normalizeApiError } from '../../@core/api/normalizeApiError';

const useMobileFieldStore = create((set, get) => ({
  // ─── State ────────────────────────────────────────────────────────────────
  fields: [],
  selectedFieldId: null,
  zoneMap: null,         // Current field's published zone map
  isLoadingFields: false,
  isLoadingMap: false,
  fieldsError: null,
  mapError: null,

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * Fetch all fields assigned to the authenticated mobile user.
   * Only returns fields with published zone maps.
   */
  fetchFields: async () => {
    set({ isLoadingFields: true, fieldsError: null });
    try {
      const data = await apiRequest(ENDPOINTS.mobile.fields);
      // Response shape: { fields: [...] }
      set({ fields: data.fields || [], isLoadingFields: false });
    } catch (err) {
      const message = err.message || 'Could not load your fields.';
      set({ fieldsError: message, isLoadingFields: false });
    }
  },

  /**
   * Fetch the published polygon-only zone map for a specific field.
   */
  fetchZoneMap: async (fieldId) => {
    if (!fieldId) return;
    set({ isLoadingMap: true, mapError: null, zoneMap: null });
    try {
      const data = await apiRequest(ENDPOINTS.mobile.fieldZoneMap(fieldId));
      // Response shape: { field: {...}, map: {...} }
      set({ zoneMap: data, isLoadingMap: false });
    } catch (err) {
      set({ mapError: normalizeApiError(err, 'Could not load zone map.'), isLoadingMap: false });
    }
  },

  /** Select a field for detail view */
  selectField: (fieldId) => set({ selectedFieldId: fieldId, zoneMap: null, mapError: null }),

  /** Clear zone map state (when navigating away) */
  clearZoneMap: () => set({ zoneMap: null, mapError: null, isLoadingMap: false }),

  clearErrors: () => set({ fieldsError: null, mapError: null }),
}));

export { useMobileFieldStore };
