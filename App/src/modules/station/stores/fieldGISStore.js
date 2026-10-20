/**
 * fieldGISStore.js — Zustand store for Station GIS Field Management.
 *
 * Manages:
 * - Field data (loaded from API)
 * - Map viewport state
 * - Active tool (pan/draw/edit/measure)
 * - Drawing state (vertices, preview)
 * - Editing state (original boundary, modified vertices)
 * - Selection state
 * - Filter state
 * - Layer visibility
 * - Panel state (detail/create/edit drawers)
 */

import { create } from 'zustand';
import {
  INITIAL_CENTER,
  INITIAL_ZOOM,
  DEFAULT_LAYERS,
  DEFAULT_ADMIN_LAYERS,
  INITIAL_DRAW_STATE,
  INITIAL_EDIT_STATE,
  INITIAL_FILTERS,
  INITIAL_PANEL_STATE,
} from './fieldGISConstants';
import {
  selectSelectedField,
  selectFieldCounts,
  selectListFields,
  selectMapFields,
} from './fieldGISSelectors';
import {
  updateVertex,
  insertVertex,
  deleteVertex,
  popUndoVertex,
} from './vertexEditHelpers';

export {
  INITIAL_CENTER,
  INITIAL_ZOOM,
  selectSelectedField,
  selectFieldCounts,
  selectListFields,
  selectMapFields,
};

const useFieldGISStore = create((set, get) => ({
  // ── Field Data ──────────────────────────────────────────────
  fields: [],
  selectedFieldId: null,
  hoveredFieldId: null,
  isLoading: false,
  error: null,

  setFields: (fields) => set({ fields }),
  setSelectedField: (id) => {
    // Normalize to string for consistent MapLibre filter matching
    const normalizedId = id != null ? String(id) : null;
    set({ selectedFieldId: normalizedId });
  },
  setHoveredField: (id) => set({ hoveredFieldId: id }),
  clearSelection: () => set({ selectedFieldId: null, panelState: { isOpen: false, mode: 'detail' } }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addField: (field) => set((state) => ({ fields: [field, ...state.fields] })),
  updateField: (id, updates) =>
    set((state) => ({
      fields: state.fields.map((f) => (String(f.id) === String(id) ? { ...f, ...updates } : f)),
    })),
  removeField: (id) =>
    set((state) => ({
      fields: state.fields.filter((f) => String(f.id) !== String(id)),
      selectedFieldId: String(state.selectedFieldId) === String(id) ? null : state.selectedFieldId,
    })),

  // ── Map Viewport ────────────────────────────────────────────
  center: INITIAL_CENTER,
  zoom: INITIAL_ZOOM,

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setViewport: (center, zoom) => {
    const { center: prev, zoom: prevZoom } = get();
    // Use rounding to avoid float-precision micro-drift triggering re-renders
    const unchanged =
      Math.round(prev[0] * 1e6) === Math.round(center[0] * 1e6) &&
      Math.round(prev[1] * 1e6) === Math.round(center[1] * 1e6) &&
      prevZoom === zoom;
    if (unchanged) return;
    set({ center, zoom });
  },

  // ── Active Tool ─────────────────────────────────────────────
  activeTool: 'pan', // 'pan' | 'draw' | 'edit' | 'measure'

  setActiveTool: (tool) => {
    const state = get();
    // Reset draw/edit state when switching tools
    if (tool !== 'draw' && state.drawState.isDrawing) {
      set({ drawState: { vertices: [], isDrawing: false, previewPolygon: null } });
    }
    if (tool !== 'edit' && state.editState.isEditing) {
      set({
        editState: { fieldId: null, originalBoundary: null, currentVertices: [], isEditing: false },
      });
    }
    set({ activeTool: tool });
  },

  // ── Draw State ──────────────────────────────────────────────
  drawState: { ...INITIAL_DRAW_STATE },

  startDrawing: () =>
    set({
      activeTool: 'draw',
      drawState: { vertices: [], isDrawing: true, previewPolygon: null },
    }),

  addDrawVertex: (latlng) =>
    set((state) => ({
      drawState: {
        ...state.drawState,
        vertices: [...state.drawState.vertices, latlng],
      },
    })),

  undoDrawVertex: () =>
    set((state) => {
      const vertices = state.drawState.vertices.slice(0, -1);
      return {
        drawState: {
          ...state.drawState,
          vertices,
          isDrawing: vertices.length > 0,
        },
      };
    }),

  finishDrawing: () =>
    set((state) => ({
      drawState: { ...state.drawState, isDrawing: false },
    })),

  cancelDrawing: () =>
    set({
      activeTool: 'pan',
      drawState: { ...INITIAL_DRAW_STATE },
    }),

  // ── Edit State ──────────────────────────────────────────────
  editState: { ...INITIAL_EDIT_STATE },

  startEditing: (fieldId, vertices) =>
    set({
      activeTool: 'edit',
      editState: {
        fieldId,
        originalBoundary: vertices,
        currentVertices: [...vertices],
        isEditing: true,
        undoStack: [],
      },
    }),

  updateEditVertex: (index, latlng) =>
    set((state) => ({
      editState: updateVertex(state.editState, index, latlng),
    })),

  addEditVertex: (afterIndex, latlng) =>
    set((state) => ({
      editState: insertVertex(state.editState, afterIndex, latlng),
    })),

  removeEditVertex: (index) =>
    set((state) => ({
      editState: deleteVertex(state.editState, index),
    })),

  undoEdit: () =>
    set((state) => ({
      editState: popUndoVertex(state.editState),
    })),

  cancelEditing: () =>
    set({
      activeTool: 'pan',
      editState: { ...INITIAL_EDIT_STATE },
    }),

  finishEditing: () =>
    set((state) => ({
      editState: { ...state.editState, isEditing: false },
    })),

  // ── Explorer State ──────────────────────────────────────────
  searchQuery: '',
  explorerCollapsed: false,
  filteredFieldIds: [],

  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleExplorer: () => set((state) => ({ explorerCollapsed: !state.explorerCollapsed })),
  setExplorerCollapsed: (collapsed) => set({ explorerCollapsed: collapsed }),
  setFilteredFields: (ids) => set({ filteredFieldIds: ids }),

  // ── Filters ─────────────────────────────────────────────────
  filters: { ...INITIAL_FILTERS },

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  clearFilters: () =>
    set({
      filters: { ...INITIAL_FILTERS },
    }),

  // ── Layer Visibility ────────────────────────────────────────
  layers: { ...DEFAULT_LAYERS },

  setLayer: (key, value) =>
    set((state) => ({
      layers: { ...state.layers, [key]: value },
    })),

  // ── Admin Boundary Layer Visibility ─────────────────────────
  adminLayers: { ...DEFAULT_ADMIN_LAYERS },

  toggleAdminLayer: (layerKey) =>
    set((state) => ({
      adminLayers: { ...state.adminLayers, [layerKey]: !state.adminLayers[layerKey] },
    })),

  setAdminLayerVisibility: (layerKey, visible) =>
    set((state) => ({
      adminLayers: { ...state.adminLayers, [layerKey]: visible },
    })),

  // ── Panel State ─────────────────────────────────────────────
  panelState: { ...INITIAL_PANEL_STATE },

  openPanel: (mode, options = {}) =>
    set((state) => ({
      panelState: { ...state.panelState, isOpen: true, mode, ...options },
    })),

  closePanel: () =>
    set((state) => ({
      panelState: { ...state.panelState, isOpen: false },
    })),

  setCreateMethod: (method) =>
    set((state) => ({
      panelState: { ...state.panelState, createMethod: method },
    })),

  // ── Toast / Notifications ───────────────────────────────────
  toast: null,

  showToast: (message, type = 'info', duration = 3000) => {
    set({ toast: { message, type, id: Date.now() } });
    if (duration > 0) {
      setTimeout(() => set({ toast: null }), duration);
    }
  },

  clearToast: () => set({ toast: null }),

  // ── Reset ───────────────────────────────────────────────────
  reset: () =>
    set({
      fields: [],
      selectedFieldId: null,
      hoveredFieldId: null,
      isLoading: false,
      error: null,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      activeTool: 'pan',
      drawState: { ...INITIAL_DRAW_STATE },
      editState: { ...INITIAL_EDIT_STATE },
      searchQuery: '',
      explorerCollapsed: false,
      filteredFieldIds: [],
      filters: { ...INITIAL_FILTERS },
      layers: { ...DEFAULT_LAYERS },
      adminLayers: { ...DEFAULT_ADMIN_LAYERS },
      panelState: { ...INITIAL_PANEL_STATE },
      toast: null,
    }),
}));

export default useFieldGISStore;
