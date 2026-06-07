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

const shouldLogMobileFieldReview = process.env.EXPO_PUBLIC_MOBILE_FIELD_REVIEW === '1';

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

  useEffect(() => {
    if (!shouldLogMobileFieldReview) return;
    console.log('[MobileFieldReview] fields loaded', {
      count: fields?.length,
      firstFieldId: fields?.[0]?.id,
      firstFieldName: fields?.[0]?.name,
    });
  }, [fields]);

  const handleFieldPress = (field) => {
    const href = `/(agrivision)/field-detail/${field?.id}`;
    if (shouldLogMobileFieldReview) {
      console.log('[MobileFieldReview] open field detail', {
        fieldId: field?.id,
        href,
      });
    }

    if (!field?.id) return;
    selectField(field.id);
    router.push(href);
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
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`mobile-field-card-${item.id}`}
            style={styles.card}
            onPress={() => handleFieldPress(item)}
            activeOpacity={0.7}
          >
            <View style={styles.cardRow}>
              <Text style={styles.fieldName}>{item.name || 'Unnamed Field'}</Text>
              {item.code ? <View style={styles.badge}><Text style={styles.badgeText}>{item.code}</Text></View> : null}
            </View>
            <View style={styles.metaRow}>
              {item.area != null ? <Text style={styles.meta}>📐 {item.area.toFixed(2)} ha</Text> : null}
              <Text style={styles.meta}>🗺️ {item.zonesCount || 0} zone{(item.zonesCount || 0) !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.footerRow}>
              <Text style={styles.version}>Map v{item.latestMapVersion || '?'}</Text>
              {item.publishedAt ? <Text style={styles.date}>Published: {formatDate(item.publishedAt)}</Text> : null}
            </View>
            <View style={styles.openBtn}><Text style={styles.openBtnText}>View Map →</Text></View>
          </TouchableOpacity>
        )}
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
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  fieldName: { fontSize: 18, fontWeight: '600', color: '#212121', flex: 1 },
  badge: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#2E7D32' },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  meta: { fontSize: 14, color: '#616161' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  version: { fontSize: 12, color: '#9E9E9E', fontWeight: '500' },
  date: { fontSize: 12, color: '#9E9E9E' },
  openBtn: { backgroundColor: '#E8F5E9', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  openBtnText: { fontSize: 14, fontWeight: '600', color: '#2E7D32' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#757575' },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { fontSize: 15, color: '#D32F2F', textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#4CAF50', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#424242', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#757575', textAlign: 'center', lineHeight: 20 },
});
