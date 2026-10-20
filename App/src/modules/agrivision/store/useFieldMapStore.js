import { create } from 'zustand';

/**
 * fieldMapStore — Map-level UI state for the Field Management module.
 *
 * Controls: selected field/zone, active data layer, map viewport,
 * drawer state, and sidebar visibility.
 */
const useFieldMapStore = create((set, get) => ({
  // ── Selection ──
  selectedFieldId: null,
  selectedZoneId: null,

  // ── Active data layer ──
  // 'disease' | 'moisture' | 'ph' | 'nitrogen' | 'temperature'
  activeLayer: 'disease',

  // ── Map viewport ──
  mapCenter: [10.7769, 106.7009], // Default: Ho Chi Minh City
  mapZoom: 13,

  // ── Drawer ──
  // 'collapsed' | 'peek' | 'expanded'
  drawerState: 'collapsed',

  // ── Sidebar (desktop only) ──
  sidebarOpen: true,

  // ── Actions ──
  selectField: (fieldId) =>
    set({
      selectedFieldId: fieldId,
      selectedZoneId: null,
      drawerState: 'collapsed',
    }),

  selectZone: (zoneId) =>
    set({
      selectedZoneId: zoneId,
      drawerState: 'peek',
    }),

  deselectZone: () =>
    set({
      selectedZoneId: null,
      drawerState: 'collapsed',
    }),

  setLayer: (layer) =>
    set({ activeLayer: layer }),

  setMapCenter: (center) =>
    set({ mapCenter: center }),

  setMapZoom: (zoom) =>
    set({ mapZoom: zoom }),

  setViewport: (center, zoom) =>
    set({ mapCenter: center, mapZoom: zoom }),

  setDrawerState: (state) =>
    set({ drawerState: state }),

  toggleDrawer: () => {
    const { drawerState } = get();
    if (drawerState === 'collapsed') set({ drawerState: 'peek' });
    else if (drawerState === 'peek') set({ drawerState: 'expanded' });
    else set({ drawerState: 'collapsed' });
  },

  toggleSidebar: () =>
    set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // ── Reset ──
  reset: () =>
    set({
      selectedFieldId: null,
      selectedZoneId: null,
      activeLayer: 'disease',
      drawerState: 'collapsed',
    }),
}));

export default useFieldMapStore;