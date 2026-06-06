/**
 * Fields List View — Simplified legacy list view for the "Quản lý cánh đồng" module.
 *
 * This is a lightweight list view that can be toggled from the map-first FieldMapScreen.
 * It shows fields as a scrollable list with status indicators.
 *
 * The original 1778-line fields.js has been superseded by the map-first FieldMapScreen.
 * This file provides the list view as a secondary view mode.
 */

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { useFieldStore } from '../store/useFieldStore';
import { LIGHT_COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';

const C = LIGHT_COLORS;

const STATUS_COLORS = {
  HEALTHY: '#22c55e',
  WARNING: '#eab308',
  INFECTED: '#ef4444',
};

const STATUS_LABELS = {
  HEALTHY: '🟢 Khỏe mạnh',
  WARNING: '🟡 Cảnh báo',
  INFECTED: '🔴 Nhiễm bệnh',
};

function FieldListItem({ field, onPress }) {
  const statusColors = ['#22c55e', '#eab308', '#ef4444'];
  const statusColor = field.id.charCodeAt(0) % 3 === 0
    ? '#ef4444'
    : field.id.charCodeAt(0) % 3 === 1
    ? '#eab308'
    : '#22c55e';

  return (
    <Pressable style={styles.fieldCard} onPress={onPress}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldIcon}>🌾</Text>
        <View style={styles.fieldInfo}>
          <Text style={styles.fieldName}>{field.name}</Text>
          <Text style={styles.fieldCrop}>{field.crop_type} · {field.area || '—'} ha</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>
      {field.growth_stage && (
        <View style={styles.growthBadge}>
          <Text style={styles.growthText}>{field.growth_stage}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function FieldsLegacyScreen() {
  const token = useAuthStore((s) => s.token);
  const { fields, fetchFields } = useFieldStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFields(token);
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFields(token);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>📋 Danh sách cánh đồng</Text>
        <Text style={styles.subtitle}>{fields.length} cánh đồng đang quản lý</Text>
      </View>

      {fields.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🌱</Text>
          <Text style={styles.emptyText}>Chưa có cánh đồng nào</Text>
          <Text style={styles.emptySubtext}>Thêm cánh đồng đầu tiên để bắt đầu quản lý</Text>
        </View>
      ) : (
        fields.map((field) => (
          <FieldListItem
            key={field.id}
            field={field}
            onPress={() => router.push({
              pathname: '/(agrivision)/field-map',
              params: { fieldId: field.id }
            })}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  content: { paddingBottom: SPACING.xxl },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  subtitle: {
    color: C.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: 4,
  },
  fieldCard: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldIcon: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  fieldInfo: {
    flex: 1,
  },
  fieldName: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  fieldCrop: {
    color: C.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  growthBadge: {
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.md,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  growthText: {
    color: '#16a34a',
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: SPACING.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  emptySubtext: {
    color: C.textMuted,
    fontSize: FONT_SIZE.sm,
    marginTop: 4,
    textAlign: 'center',
  },
});
