/**
 * useMobileCultivationStore - Mobile cultivation profile/log state.
 *
 * Uses only the Phase 02 /api/mobile cultivation contract through apiRequest.
 */

import { create } from 'zustand';
import { apiRequest } from '../../@core/api/apiClient';
import { ENDPOINTS } from '../../@core/api/endpoints';

const normalizeError = (error, fallback) => {
  const body = error?.data || {};
  return {
    status: error?.status,
    code: body.code,
    message: body.message || error?.message || fallback,
    latestPublicationVersion: body.latestPublicationVersion,
    requiresReload: body.requiresReload,
    requiresManualSetup: body.requiresManualSetup,
  };
};

const useMobileCultivationStore = create((set, get) => ({
  summary: null,
  logs: [],
  pagination: { limit: 20, offset: 0, count: 0 },
  isLoading: false,
  isLoadingLogs: false,
  isSaving: false,
  error: null,
  conflict: null,

  fetchSummary: async (fieldId, zoneId) => {
    if (!fieldId || !zoneId) return;
    set({ isLoading: true, error: null, conflict: null });
    try {
      const response = await apiRequest(ENDPOINTS.mobile.cultivation(fieldId, zoneId));
      const data = response.data || {};
      set({
        summary: data,
        logs: data.logs || [],
        pagination: { limit: 10, offset: 0, count: (data.logs || []).length },
        isLoading: false,
      });
    } catch (error) {
      const normalized = normalizeError(error, 'Could not load cultivation data.');
      set({
        isLoading: false,
        error: normalized.message,
        conflict: normalized.code === 'PUBLICATION_CONFLICT' ? normalized : null,
      });
    }
  },

  fetchLogs: async (fieldId, zoneId, page = {}) => {
    if (!fieldId || !zoneId) return;
    set({ isLoadingLogs: true, error: null });
    try {
      const response = await apiRequest(ENDPOINTS.mobile.cultivationLogs(fieldId, zoneId, page));
      const data = response.data || {};
      set({
        logs: data.logs || [],
        pagination: data.pagination || { limit: page.limit || 20, offset: page.offset || 0, count: (data.logs || []).length },
        isLoadingLogs: false,
      });
    } catch (error) {
      const normalized = normalizeError(error, 'Could not load cultivation logs.');
      set({
        isLoadingLogs: false,
        error: normalized.message,
        conflict: normalized.code === 'PUBLICATION_CONFLICT' ? normalized : null,
      });
    }
  },

  saveProfile: async (fieldId, zoneId, payload) => {
    set({ isSaving: true, error: null, conflict: null });
    try {
      const response = await apiRequest(ENDPOINTS.mobile.cultivationProfile(fieldId, zoneId), {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const current = get().summary || {};
      set({
        summary: { ...current, profile: response.data?.profile || null },
        isSaving: false,
      });
      await get().fetchSummary(fieldId, zoneId);
      return { ok: true };
    } catch (error) {
      const normalized = normalizeError(error, 'Could not save profile.');
      set({
        isSaving: false,
        error: normalized.message,
        conflict: normalized.code === 'PUBLICATION_CONFLICT' ? normalized : null,
      });
      return { ok: false, error: normalized };
    }
  },

  createLog: async (fieldId, zoneId, payload) => {
    set({ isSaving: true, error: null, conflict: null });
    try {
      await apiRequest(ENDPOINTS.mobile.cultivationLogs(fieldId, zoneId), {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      set({ isSaving: false });
      await get().fetchSummary(fieldId, zoneId);
      return { ok: true };
    } catch (error) {
      const normalized = normalizeError(error, 'Could not create log.');
      set({
        isSaving: false,
        error: normalized.message,
        conflict: normalized.code === 'PUBLICATION_CONFLICT' ? normalized : null,
      });
      return { ok: false, error: normalized };
    }
  },

  updateLog: async (fieldId, zoneId, logId, payload) => {
    set({ isSaving: true, error: null, conflict: null });
    try {
      await apiRequest(ENDPOINTS.mobile.cultivationLog(fieldId, zoneId, logId), {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      set({ isSaving: false });
      await get().fetchSummary(fieldId, zoneId);
      return { ok: true };
    } catch (error) {
      const normalized = normalizeError(error, 'Could not update log.');
      set({
        isSaving: false,
        error: normalized.message,
        conflict: normalized.code === 'PUBLICATION_CONFLICT' ? normalized : null,
      });
      return { ok: false, error: normalized };
    }
  },

  deleteLog: async (fieldId, zoneId, logId, publicationVersion) => {
    set({ isSaving: true, error: null, conflict: null });
    try {
      await apiRequest(ENDPOINTS.mobile.cultivationLogDelete(fieldId, zoneId, logId, publicationVersion), {
        method: 'DELETE',
      });
      set({ isSaving: false });
      await get().fetchSummary(fieldId, zoneId);
      return { ok: true };
    } catch (error) {
      const normalized = normalizeError(error, 'Could not delete log.');
      set({
        isSaving: false,
        error: normalized.message,
        conflict: normalized.code === 'PUBLICATION_CONFLICT' ? normalized : null,
      });
      return { ok: false, error: normalized };
    }
  },

  clearCultivation: () => set({
    summary: null,
    logs: [],
    pagination: { limit: 20, offset: 0, count: 0 },
    isLoading: false,
    isLoadingLogs: false,
    isSaving: false,
    error: null,
    conflict: null,
  }),

  clearMessages: () => set({ error: null, conflict: null }),
}));

export { useMobileCultivationStore };
