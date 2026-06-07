import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text } from 'react-native';
import useFieldMap from '../hooks/useFieldMap';
import useFieldSelector from '../hooks/useFieldSelector';
import FieldMapCanvas from '../components/map/FieldMapCanvas';
import MapColorLegend from '../components/map/MapColorLegend';
import TopBar from '../components/controls/TopBar';
import BottomDrawer from '../components/panels/BottomDrawer';
import FieldsLegacyScreen from './FieldsLegacyScreen';

/**
 * FieldMapScreen — Primary map-first field management screen.
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │ TopBar (field selector + layers)│
 * ├─────────────────────────────────┤
 * │                                 │
 * │     MapCanvas (70%+ screen)     │
 * │                                 │
 * │              [Legend]            │
 * ├─────────────────────────────────┤
 * │    BottomDrawer (M4)            │
 * └─────────────────────────────────┘
 */
export default function FieldMapScreen() {
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'

  const {
    selectedFieldId,
    selectedZoneId,
    activeLayer,
    mapCenter,
    mapZoom,
    currentZones,
    currentField,
    loading,
    handleFieldSelect,
    handleZonePress,
    handleLayerChange,
    handleMapMove,
    getSelectedZone,
  } = useFieldMap();

  const {
    fieldOptions,
    selectedField,
    statusCounts,
  } = useFieldSelector();

  const LegacyFieldsScreen = FieldsLegacyScreen;

  // Auto-select first field if none selected
  useEffect(() => {
    if (!selectedFieldId && fieldOptions.length > 0) {
      handleFieldSelect(fieldOptions[0].value);
    }
  }, [fieldOptions, selectedFieldId]);

  if (loading && currentZones.length === 0) {
    return (
      <View testID="field-map-screen" style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading fields...</Text>
      </View>
    );
  }

  return (
    <View testID="field-map-screen" style={styles.container}>
      {/* Top Bar: Field Selector + Layer Switcher + View Toggle + Actions */}
      <TopBar
        fieldOptions={fieldOptions}
        selectedFieldId={selectedFieldId}
        onFieldSelect={handleFieldSelect}
        activeLayer={activeLayer}
        onLayerChange={handleLayerChange}
        statusCounts={statusCounts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Content: Map or List view */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          <FieldMapCanvas
            zones={currentZones}
            selectedZoneId={selectedZoneId}
            activeLayer={activeLayer}
            center={mapCenter}
            zoom={mapZoom}
            onZonePress={handleZonePress}
            onMapMove={handleMapMove}
          />
          <MapColorLegend layer={activeLayer} />
        </View>
      ) : (
        <View style={styles.listContainer}>
          {LegacyFieldsScreen ? (
            <LegacyFieldsScreen />
          ) : (
            <View style={styles.listPlaceholder}>
              <Text style={styles.listPlaceholderText}>📋 Field list view</Text>
              <Text style={styles.listPlaceholderSubtext}>
                Switch to map view for the full field management experience
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Bottom Drawer — zone details on tap (map view only) */}
      {viewMode === 'map' && <BottomDrawer zone={getSelectedZone()} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // dark background
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  listPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  listPlaceholderText: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  listPlaceholderSubtext: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
});
