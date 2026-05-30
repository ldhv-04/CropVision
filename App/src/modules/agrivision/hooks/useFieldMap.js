import { useCallback, useEffect } from 'react';
import useFieldMapStore from '../stores/fieldMapStore';
import useFieldStore from '../stores/fieldStore';
import useMetricStore from '../stores/metricStore';
import { calculateFieldBounds } from '../utils/mapHelpers';

/**
 * useFieldMap — Orchestrates map interaction logic.
 *
 * Handles field/zone selection, map viewport fitting,
 * and data loading coordination.
 */
export default function useFieldMap() {
  const {
    selectedFieldId,
    selectedZoneId,
    activeLayer,
    mapCenter,
    mapZoom,
    drawerState,
    sidebarOpen,
    selectField,
    selectZone,
    deselectZone,
    setLayer,
    setViewport,
    setDrawerState,
    toggleDrawer,
    toggleSidebar,
  } = useFieldMapStore();

  const {
    fields,
    currentField,
    currentZones,
    loading: fieldsLoading,
    fetchFields,
    fetchField,
    fetchZones,
    fetchZonesSummary,
  } = useFieldStore();

  const {
    loading: metricsLoading,
    fetchZoneMetrics,
  } = useMetricStore();

  // ── Load fields on mount ──
  useEffect(() => {
    if (fields.length === 0) {
      fetchFields();
    }
  }, []);

  // ── When field is selected, load zones and fit map ──
  useEffect(() => {
    if (!selectedFieldId) return;

    const loadFieldData = async () => {
      await fetchField(selectedFieldId);
      // Try the aggregated summary endpoint first (M2), fall back to basic zones
      const summary = await fetchZonesSummary(selectedFieldId);
      if (!summary) {
        await fetchZones(selectedFieldId);
      }
    };
    loadFieldData();
  }, [selectedFieldId]);

  // ── Fit map to field bounds when zones load ──
  useEffect(() => {
    if (currentZones.length > 0) {
      const bounds = calculateFieldBounds(currentZones);
      if (bounds) {
        // Calculate center from bounds
        const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
        const centerLng = (bounds[0][1] + bounds[1][1]) / 2;
        setViewport([centerLat, centerLng], 15);
      }
    }
  }, [currentZones]);

  // ── When zone is selected, fetch its metrics ──
  useEffect(() => {
    if (selectedZoneId) {
      fetchZoneMetrics(selectedZoneId);
    }
  }, [selectedZoneId]);

  // ── Handlers ──
  const handleFieldSelect = useCallback((fieldId) => {
    selectField(fieldId);
  }, [selectField]);

  const handleZonePress = useCallback((zoneId) => {
    selectZone(zoneId);
  }, [selectZone]);

  const handleZoneDeselect = useCallback(() => {
    deselectZone();
  }, [deselectZone]);

  const handleLayerChange = useCallback((layer) => {
    setLayer(layer);
  }, [setLayer]);

  const handleMapMove = useCallback((center, zoom) => {
    setViewport(center, zoom);
  }, [setViewport]);

  const getSelectedZone = useCallback(() => {
    if (!selectedZoneId || !currentZones.length) return null;
    return currentZones.find((z) => z.id === selectedZoneId) || null;
  }, [selectedZoneId, currentZones]);

  const getZoneCountByStatus = useCallback(() => {
    const counts = { HEALTHY: 0, WARNING: 0, INFECTED: 0 };
    currentZones.forEach((z) => {
      if (counts[z.status] !== undefined) counts[z.status]++;
    });
    return counts;
  }, [currentZones]);

  return {
    // State
    selectedFieldId,
    selectedZoneId,
    activeLayer,
    mapCenter,
    mapZoom,
    drawerState,
    sidebarOpen,
    fields,
    currentField,
    currentZones,
    loading: fieldsLoading || metricsLoading,

    // Actions
    handleFieldSelect,
    handleZonePress,
    handleZoneDeselect,
    handleLayerChange,
    handleMapMove,
    toggleDrawer,
    setDrawerState,
    toggleSidebar,

    // Derived
    getSelectedZone,
    getZoneCountByStatus,
  };
}