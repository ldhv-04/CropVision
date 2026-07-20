/**
 * MobileFieldsScreen — Task 2: Mobile Field Manager
 *
 * Displays all fields assigned to the authenticated mobile user.
 * Each field card shows name, code, area, zones count, and published info.
 *
 * DEPENDENCY NOTE:
 * - Does NOT import station/admin components.
 * - Does NOT import MapLibre or satellite tile renderers.
 * - Uses only mobile-specific store (useMobileFieldStore).
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMobileFieldStore } from '../store/useMobileFieldStore';

const publicationPresentation = {
  available: { label: 'Available' },
  unpublished: {
    label: 'Not published',
    message: 'A station must publish this field before its map is available.',
  },
  conflict: {
    label: 'Publication conflict',
    message: 'Refresh after the station resolves the publication conflict.',
  },
};

const refreshRequired = {
  label: 'Refresh required',
  message: 'Refresh fields to check the latest publication state.',
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

const buildFieldCardViewModel = (field) => ({
  fieldName: field.name || 'Unnamed Field',
  isAvailable: field.publicationState === 'available',
  state: publicationPresentation[field.publicationState] || refreshRequired,
});

function MobileFieldCard({ field, onPress }) {
  const { fieldName, isAvailable, state } = buildFieldCardViewModel(field);

  return (
    <TouchableOpacity
      testID={`mobile-field-card-${field.id}`}
      accessibilityRole="button"
      accessibilityLabel={
        isAvailable
          ? `Open map for ${fieldName}`
          : `Map unavailable for ${fieldName}`
      }
      accessibilityState={{ disabled: !isAvailable }}
      style={[styles.card, !isAvailable && styles.cardDisabled]}
      onPress={() => onPress(field)}
      activeOpacity={0.7}
      disabled={!isAvailable}
    >
      <View style={styles.cardRow}>
        <Text style={styles.fieldName}>{fieldName}</Text>
        {field.code ? <View style={styles.badge}><Text style={styles.badgeText}>{field.code}</Text></View> : null}
      </View>
      <View style={[
        styles.publicationBadge,
        isAvailable ? styles.availableBadge : styles.unavailableBadge,
      ]}>
        <Text style={[
          styles.publicationBadgeText,
          isAvailable ? styles.availableText : styles.unavailableText,
        ]}>
          {state.label}
        </Text>
      </View>
      <View style={styles.metaRow}>
        {field.area != null ? <Text style={styles.meta}>📐 {field.area.toFixed(2)} ha</Text> : null}
        {isAvailable && field.zonesCount != null ? (
          <Text style={styles.meta}>
            🗺️ {field.zonesCount} zone{field.zonesCount !== 1 ? 's' : ''}
          </Text>
        ) : null}
      </View>
      {isAvailable ? (
        <View style={styles.footerRow}>
          {field.latestMapVersion != null ? <Text style={styles.version}>Map v{field.latestMapVersion}</Text> : null}
          {field.publishedAt ? <Text style={styles.date}>Published: {formatDate(field.publishedAt)}</Text> : null}
        </View>
      ) : (
        <Text style={styles.stateMessage}>{state.message}</Text>
      )}
      <View style={[styles.openBtn, !isAvailable && styles.openBtnDisabled]}>
        <Text style={[styles.openBtnText, !isAvailable && styles.openBtnTextDisabled]}>
          {isAvailable ? 'View Map →' : 'Map unavailable'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MobileFieldsScreen() {
  const router = useRouter();
  const {
    fields,
    isLoadingFields,
    fieldsError,
    fetchFields,
    selectField,
  } = useMobileFieldStore();

  useEffect(() => {
    fetchFields();
  }, []);

  const handleFieldPress = (field) => {
    if (!field?.id || field.publicationState !== 'available') return;

    const href = `/(agrivision)/field-detail/${field?.id}`;
    selectField(field.id);
    router.push(href);
  };

  // Loading
  if (isLoadingFields && fields.length === 0) {
    return (
      <View testID="fields-screen" style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your fields...</Text>
      </View>
    );
  }

  // Error
  if (fieldsError && fields.length === 0) {
    return (
      <View testID="fields-screen" style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{fieldsError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchFields}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty
  if (!isLoadingFields && fields.length === 0) {
    return (
      <View testID="fields-screen" style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>🌾</Text>
        <Text style={styles.emptyTitle}>No fields assigned yet</Text>
        <Text style={styles.emptySubtitle}>
          When a station publishes a field for your account, it will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View testID="fields-screen" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Fields</Text>
        <Text style={styles.headerSubtitle}>View fields assigned to you</Text>
      </View>
      <FlatList
        data={fields}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <MobileFieldCard field={item} onPress={handleFieldPress} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoadingFields} onRefresh={fetchFields} colors={['#4CAF50']} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#4CAF50', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  list: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  cardDisabled: { opacity: 0.8 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  fieldName: { fontSize: 18, fontWeight: '600', color: '#212121', flex: 1 },
  badge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },
  publicationBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  availableBadge: { backgroundColor: '#E8F5E9' },
  unavailableBadge: { backgroundColor: '#FFF3E0' },
  publicationBadgeText: { fontSize: 12, fontWeight: '600' },
  availableText: { color: '#2E7D32' },
  unavailableText: { color: '#E65100' },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  meta: { fontSize: 14, color: '#616161' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  version: { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },
  date: { fontSize: 12, color: '#9E9E9E' },
  stateMessage: { fontSize: 13, color: '#616161', lineHeight: 18, marginBottom: 8 },
  openBtn: { backgroundColor: '#E8F5E9', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  openBtnDisabled: { backgroundColor: '#EEEEEE' },
  openBtnText: { fontSize: 14, fontWeight: '600', color: '#2E7D32' },
  openBtnTextDisabled: { color: '#757575' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#757575' },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { fontSize: 15, color: '#D32F2F', textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#424242', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#757575', textAlign: 'center', lineHeight: 20 },
});
