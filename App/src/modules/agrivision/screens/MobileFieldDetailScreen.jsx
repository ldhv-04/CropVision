/**
 * MobileFieldDetailScreen — Task 2: Mobile Field Manager
 *
 * Displays the polygon-only zone map for one published field.
 * Shows field header, polygon map, selected zone card, and zone list.
 *
 * DEPENDENCY NOTE:
 * - Does NOT import station/admin components.
 * - Does NOT import MapLibre or satellite tile renderers.
 * - Uses PolygonFieldMap which renders SVG only.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMobileFieldStore } from '../store/useMobileFieldStore';
import PolygonFieldMap from '../components/PolygonFieldMap';

export default function MobileFieldDetailScreen() {
  const { fieldId } = useLocalSearchParams();
  const router = useRouter();
  const [selectedZone, setSelectedZone] = useState(null);

  const {
    zoneMap,
    isLoadingMap,
    mapError,
    fetchZoneMap,
    clearZoneMap,
  } = useMobileFieldStore();

  useEffect(() => {
    if (fieldId) fetchZoneMap(fieldId);
    return () => clearZoneMap();
  }, [fieldId]);

  const handleZonePress = useCallback((zone) => {
    setSelectedZone((prev) => (prev?.id === zone.id ? null : zone));
  }, []);

  const handleZoneRowPress = useCallback((zone) => {
    setSelectedZone((prev) => (prev?.id === zone.id ? null : zone));
  }, []);

  const handleRetry = () => {
    if (fieldId) fetchZoneMap(fieldId);
  };

  // Loading
  if (isLoadingMap) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading zone map...</Text>
      </View>
    );
  }

  // Error
  if (mapError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{mapError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!zoneMap) return null;

  const { field, map } = zoneMap;
  const zones = map?.zones || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back */}
      <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {/* Field Header */}
      <View style={styles.header}>
        <Text style={styles.fieldName}>{field?.name || 'Field'}</Text>
        <View style={styles.headerMeta}>
          {field?.code ? <Text style={styles.metaBadge}>Code: {field.code}</Text> : null}
          {field?.area != null ? <Text style={styles.metaBadge}>{field.area.toFixed(2)} ha</Text> : null}
          <Text style={styles.metaBadge}>v{map?.version || '?'}</Text>
          <Text style={styles.metaBadge}>{zones.length} zone{zones.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Polygon Map */}
      <View style={styles.mapSection}>
        <Text style={styles.sectionTitle}>Zone Map</Text>
        <PolygonFieldMap
          boundary={map?.boundary}
          zones={zones}
          selectedZoneId={selectedZone?.id}
          onZonePress={handleZonePress}
          height={300}
        />
      </View>

      {/* Selected Zone Card */}
      {selectedZone && (
        <View style={styles.selectedCard}>
          <Text style={styles.selectedTitle}>Selected Zone</Text>
          <Text style={styles.zoneName}>{selectedZone.code || 'Zone'}</Text>
          {selectedZone.name ? <Text style={styles.zoneSubtitle}>{selectedZone.name}</Text> : null}
          {selectedZone.area != null ? (
            <Text style={styles.zoneMeta}>Area: {typeof selectedZone.area === 'number' ? selectedZone.area.toFixed(4) : selectedZone.area} ha</Text>
          ) : null}
          <Text style={styles.zoneMeta}>
            Geometry: {selectedZone.geometry ? '✓ Available' : '✗ Missing'}
          </Text>
        </View>
      )}

      {/* Zone List */}
      <View style={styles.zoneListSection}>
        <Text style={styles.sectionTitle}>Zone List</Text>
        {zones.length === 0 ? (
          <Text style={styles.emptyZones}>No zones in this map.</Text>
        ) : (
          zones.map((zone, index) => {
            const isSelected = selectedZone?.id === zone.id;
            return (
              <TouchableOpacity
                key={zone.id || index}
                style={[styles.zoneRow, isSelected && styles.zoneRowSelected]}
                onPress={() => handleZoneRowPress(zone)}
              >
                <Text style={[styles.zoneRowCode, isSelected && styles.zoneRowCodeSelected]}>
                  {zone.code || `Zone ${index + 1}`}
                </Text>
                <Text style={styles.zoneRowName}>{zone.name || ''}</Text>
                <Text style={styles.zoneRowArea}>
                  {zone.area != null ? `${typeof zone.area === 'number' ? zone.area.toFixed(4) : zone.area} ha` : ''}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F5F5F5' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#757575' },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { fontSize: 15, color: '#D32F2F', textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8, marginBottom: 12 },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  backBtn: { paddingVertical: 8 },
  backBtnText: { fontSize: 15, color: '#1976D2' },
  backRow: { paddingTop: 48, paddingHorizontal: 16, paddingBottom: 8 },
  backText: { fontSize: 16, color: '#1976D2', fontWeight: '500' },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  fieldName: { fontSize: 24, fontWeight: 'bold', color: '#212121' },
  headerMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  metaBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, fontSize: 13, color: '#2E7D32', fontWeight: '500' },
  mapSection: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#424242', marginBottom: 8 },
  selectedCard: { marginHorizontal: 16, backgroundColor: '#FFF8E1', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FFD54F' },
  selectedTitle: { fontSize: 12, fontWeight: '600', color: '#F57C00', marginBottom: 4, textTransform: 'uppercase' },
  zoneName: { fontSize: 20, fontWeight: 'bold', color: '#212121' },
  zoneSubtitle: { fontSize: 14, color: '#616161', marginTop: 2 },
  zoneMeta: { fontSize: 14, color: '#757575', marginTop: 4 },
  zoneListSection: { paddingHorizontal: 16, marginBottom: 16 },
  emptyZones: { fontSize: 14, color: '#9E9E9E', textAlign: 'center', paddingVertical: 16 },
  zoneRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 6, borderWidth: 1, borderColor: '#E0E0E0' },
  zoneRowSelected: { borderColor: '#FFD54F', backgroundColor: '#FFFDE7' },
  zoneRowCode: { fontSize: 15, fontWeight: '700', color: '#2E7D32', width: 50 },
  zoneRowCodeSelected: { color: '#E65100' },
  zoneRowName: { fontSize: 14, color: '#424242', flex: 1 },
  zoneRowArea: { fontSize: 13, color: '#757575' },
});