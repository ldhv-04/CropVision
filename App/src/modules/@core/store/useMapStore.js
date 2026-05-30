import { create } from 'zustand';
import { apiRequest } from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

export const useMapStore = create((set, get) => ({
  // State
  activeLayers: ['scans', 'outbreaks', 'simulations'],
  selectedFeature: null,
  timelineFilter: null,
  
  // Data cache
  mapData: {
    scans: [],
    loading: false,
    error: null,
    lastFetched: null,
  },

  // Actions
  toggleLayer: (layerId) => set((state) => {
    const current = state.activeLayers;
    return {
      activeLayers: current.includes(layerId)
        ? current.filter(id => id !== layerId)
        : [...current, layerId]
    };
  }),

  setSelectedFeature: (feature) => set({ selectedFeature: feature }),
  
  setTimelineFilter: (filter) => set({ timelineFilter: filter }),

  fetchMapData: async (token) => {
    const { mapData } = get();
    // Simple caching mechanism (fetch once per minute or if empty)
    const now = Date.now();
    if (mapData.scans.length > 0 && mapData.lastFetched && now - mapData.lastFetched < 60000) {
      return; // Use cached
    }

    set((state) => ({
      mapData: { ...state.mapData, loading: true, error: null }
    }));

    try {
      const data = await apiRequest(ENDPOINTS.admin.statsDiseases, {}, token);
      if (data.success && data.data.locations) {
        set((state) => ({
          mapData: {
            scans: data.data.locations,
            loading: false,
            error: null,
            lastFetched: now,
          }
        }));
      } else {
        throw new Error('Failed to parse map data locations.');
      }
    } catch (error) {
      console.warn('[useMapStore] fetchMapData failed:', error.message);
      set((state) => ({
        mapData: {
          ...state.mapData,
          loading: false,
          error: error.message
        }
      }));
    }
  },
}));
