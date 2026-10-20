/**
 * fieldGISConstants.js — Default constants for Station GIS Store
 */

export const INITIAL_CENTER = [10.8231, 106.6297]; // Ho Chi Minh City default
export const INITIAL_ZOOM = 14;

export const INITIAL_DRAW_STATE = {
  vertices: [],
  isDrawing: false,
  previewPolygon: null,
};

export const INITIAL_EDIT_STATE = {
  fieldId: null,
  originalBoundary: null,
  currentVertices: [],
  isEditing: false,
  undoStack: [],
};

export const INITIAL_FILTERS = {
  search: '',
  cropType: '',
  status: '',
  hasAlerts: false,
};

export const DEFAULT_LAYERS = {
  baseMap: 'satellite',
  fields: true,
  zones: false,
  sensors: false,
  heatmap: false,
  opacity: 0.7,
};

export const DEFAULT_ADMIN_LAYERS = {
  province: true,
  district: false,
  ward: false,
};

export const INITIAL_PANEL_STATE = {
  isOpen: false,
  mode: 'detail',
  createMethod: 'draw',
};
