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

const INITIAL_CENTER = [10.8231, 106.6297]; // Ho Chi Minh City default
const INITIAL_ZOOM = 14;

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
    console.log('[Explorer] Field selected:', normalizedId);
    console.log('[MapSync] selected field changed:', normalizedId);
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
  drawState: {
    vertices: [], // Array of [lat, lng]
    isDrawing: false,
    previewPolygon: null, // GeoJSON preview
  },

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
      drawState: { vertices: [], isDrawing: false, previewPolygon: null },
    }),

  // ── Edit State ──────────────────────────────────────────────
  editState: {
    fieldId: null,
    originalBoundary: null,
    currentVertices: [], // Array of [lat, lng]
    isEditing: false,
    undoStack: [],
  },

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
    set((state) => {
      const vertices = [...state.editState.currentVertices];
      const undoStack = [...state.editState.undoStack, [...vertices]];
      vertices[index] = latlng;
      return {
        editState: { ...state.editState, currentVertices: vertices, undoStack },
      };
    }),

  addEditVertex: (afterIndex, latlng) =>
    set((state) => {
      const vertices = [...state.editState.currentVertices];
      const undoStack = [...state.editState.undoStack, [...vertices]];
      vertices.splice(afterIndex + 1, 0, latlng);
      return {
        editState: { ...state.editState, currentVertices: vertices, undoStack },
      };
    }),

  removeEditVertex: (index) =>
    set((state) => {
      if (state.editState.currentVertices.length <= 3) return state;
      const vertices = [...state.editState.currentVertices];
      const undoStack = [...state.editState.undoStack, [...vertices]];
      vertices.splice(index, 1);
      return {
        editState: { ...state.editState, currentVertices: vertices, undoStack },
      };
    }),

  undoEdit: () =>
    set((state) => {
      const undoStack = [...state.editState.undoStack];
      const previous = undoStack.pop();
      if (!previous) return state;
      return {
        editState: { ...state.editState, currentVertices: previous, undoStack },
      };
    }),

  cancelEditing: () =>
    set({
      activeTool: 'pan',
      editState: {
        fieldId: null,
        originalBoundary: null,
        currentVertices: [],
        isEditing: false,
        undoStack: [],
      },
    }),

  finishEditing: () =>
    set((state) => ({
      editState: { ...state.editState, isEditing: false },
    })),

  // ── Explorer State ──────────────────────────────────────────
  searchQuery: '',
  explorerCollapsed: false,
  filteredFieldIds: [],

  setSearchQuery: (query) => {
    console.log('[Explorer] Search changed:', query);
    set({ searchQuery: query });
  },
  toggleExplorer: () =>
    set((state) => {
      const collapsed = !state.explorerCollapsed;
      console.log(collapsed ? '[Explorer] Explorer collapsed' : '[Explorer] Explorer expanded');
      return { explorerCollapsed: collapsed };
    }),
  setExplorerCollapsed: (collapsed) => {
    console.log(collapsed ? '[Explorer] Explorer collapsed' : '[Explorer] Explorer expanded');
    set({ explorerCollapsed: collapsed });
  },
  setFilteredFields: (ids) => set({ filteredFieldIds: ids }),

  // ── Filters ─────────────────────────────────────────────────
  filters: {
    search: '',
    cropType: '',
    status: '',
    hasAlerts: false,
  },

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  clearFilters: () =>
    set({
      filters: { search: '', cropType: '', status: '', hasAlerts: false },
    }),

  // ── Layer Visibility ────────────────────────────────────────
  layers: {
    baseMap: 'satellite', // 'osm' | 'satellite' | 'terrain'
    fields: true,
    zones: false,
    sensors: false,
    heatmap: false,
    opacity: 0.7,
  },

  setLayer: (key, value) =>
    set((state) => ({
      layers: { ...state.layers, [key]: value },
    })),

  // ── Admin Boundary Layer Visibility ─────────────────────────
  // Stored separately from 'layers' to avoid conflicts.
  // Province is true by default — it will be lazy-loaded once the map mounts.
  // District and ward start false — user must explicitly enable them.
  adminLayers: {
    province: true,   // Enabled by default; loaded lazily on map init
    district: false,  // User-enabled; lazy-loaded on toggle
    ward: false,      // User-enabled; lazy-loaded on toggle (30MB — use with care)
  },

  toggleAdminLayer: (layerKey) =>
    set((state) => {
      const current = state.adminLayers[layerKey];
      console.log('[BOUNDARY_DEBUG] Toggle layer:', layerKey, !current);
      return {
        adminLayers: { ...state.adminLayers, [layerKey]: !current },
      };
    }),

  setAdminLayerVisibility: (layerKey, visible) =>
    set((state) => {
      console.log('[BOUNDARY_DEBUG] Set layer visibility:', layerKey, visible);
      return {
        adminLayers: { ...state.adminLayers, [layerKey]: visible },
      };
    }),

  // ── Panel State ─────────────────────────────────────────────
  panelState: {
    isOpen: false,
    mode: 'detail', // 'detail' | 'create' | 'edit'
    createMethod: 'draw', // 'draw' | 'coords' | 'radius'
  },

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
      drawState: { vertices: [], isDrawing: false, previewPolygon: null },
      editState: {
        fieldId: null,
        originalBoundary: null,
        currentVertices: [],
        isEditing: false,
        undoStack: [],
      },
      searchQuery: '',
      explorerCollapsed: false,
      filteredFieldIds: [],
      filters: { search: '', cropType: '', status: '', hasAlerts: false },
      layers: {
        baseMap: 'satellite',
        fields: true,
        zones: false,
        sensors: false,
        heatmap: false,
        opacity: 0.7,
      },
      adminLayers: {
        province: true,
        district: false,
        ward: false,
      },
      panelState: { isOpen: false, mode: 'detail', createMethod: 'draw' },
      toast: null,
    }),
}));

export default useFieldGISStore;