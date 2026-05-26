/**
 * Fields Screen — AgriVision
 *
 * Shows the user's list of fields with weather data.
 * Allows creating new fields via a modal form.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, Modal, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { useFieldStore } from '../../src/modules/agrivision/store/useFieldStore';
import { FieldCard } from '../../src/modules/agrivision/components/FieldCard';
import { LIGHT_COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/modules/@core/constants/theme';

const C = LIGHT_COLORS;

const CROP_TYPES = ['Lúa', 'Ngô', 'Cà chua', 'Khoai tây', 'Ớt', 'Đậu', 'Cải', 'Dưa hấu', 'Mía', 'Khác'];

function FormField({ label, children }) {
  return (
    <View style={styles.formField}>
      <Text style={styles.formLabel}>{label}</Text>
      {children}
    </View>
  );
}

function CreateFieldModal({ visible, onClose, onSubmit, isLoading }) {
  const [name, setName] = useState('');
  const [cropType, setCropType] = useState('Lúa');
  const [area, setArea] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập tên cánh đồng.');
    if (!latitude || !longitude) return Alert.alert('Lỗi', 'Vui lòng nhập tọa độ GPS.');

    const latNum = parseFloat(latitude);
    const lonNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lonNum)) return Alert.alert('Lỗi', 'Tọa độ không hợp lệ.');

    onSubmit({ name: name.trim(), crop_type: cropType, area: area ? parseFloat(area) : null, latitude: latNum, longitude: lonNum });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Thêm cánh đồng mới</Text>
          <Pressable onPress={onClose} id="btn-close-modal">
            <Text style={styles.modalClose}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 40 }}>
          <FormField label="Tên cánh đồng *">
            <TextInput
              testID="field-name-input"
              style={styles.input}
              placeholder="Ví dụ: Ruộng nhà A, Khu B3..."
              placeholderTextColor={C.placeholder}
              value={name}
              onChangeText={setName}
            />
          </FormField>

          <FormField label="Loại cây trồng *">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropScroll}>
              {CROP_TYPES.map(ct => (
                <Pressable
                  key={ct}
                  style={[styles.cropChip, cropType === ct && styles.cropChipActive]}
                  onPress={() => setCropType(ct)}
                >
                  <Text style={[styles.cropChipText, cropType === ct && styles.cropChipTextActive]}>{ct}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </FormField>

          <FormField label="Diện tích (ha)">
            <TextInput
              id="field-area-input"
              style={styles.input}
              placeholder="Ví dụ: 1.5"
              placeholderTextColor={C.placeholder}
              keyboardType="decimal-pad"
              value={area}
              onChangeText={setArea}
            />
          </FormField>

          <View style={styles.rowFields}>
            <View style={{ flex: 1 }}>
              <FormField label="Vĩ độ (Latitude) *">
                <TextInput
                  id="field-lat-input"
                  style={styles.input}
                  placeholder="10.7769"
                  placeholderTextColor={C.placeholder}
                  keyboardType="decimal-pad"
                  value={latitude}
                  onChangeText={setLatitude}
                />
              </FormField>
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="Kinh độ (Longitude) *">
                <TextInput
                  id="field-lon-input"
                  style={styles.input}
                  placeholder="106.7009"
                  placeholderTextColor={C.placeholder}
                  keyboardType="decimal-pad"
                  value={longitude}
                  onChangeText={setLongitude}
                />
              </FormField>
            </View>
          </View>

          <View style={styles.coordHint}>
            <Text style={styles.coordHintText}>
              💡 Bạn có thể lấy tọa độ GPS từ Google Maps: nhấn giữ vị trí → sao chép tọa độ
            </Text>
          </View>

          <Pressable
            id="btn-submit-field"
            style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>✓ Lưu cánh đồng</Text>
            }
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function FieldsScreen() {
  const token = useAuthStore((s) => s.token);
  const { fields, selectedFieldId, weatherByField, isLoading, isCreating, fetchFields, createField, fetchWeatherForField, selectField } = useFieldStore();
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFields(token);
  }, []);

  // Fetch weather for all fields on load
  useEffect(() => {
    fields.forEach(f => {
      if (!weatherByField[f.id]) {
        fetchWeatherForField(token, f);
      }
    });
  }, [fields.length]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFields(token);
    setRefreshing(false);
  };

  const handleCreate = async (fieldData) => {
    const result = await createField(token, fieldData);
    if (result.success) {
      setShowModal(false);
      Alert.alert('Thành công', `Đã tạo cánh đồng "${result.field.name}"`);
      fetchWeatherForField(token, result.field);
    } else {
      Alert.alert('Lỗi', result.message);
    }
  };

  const handleSelectField = (field) => {
    selectField(field.id);
    Alert.alert('Đã chọn', `Cánh đồng "${field.name}" đang được dùng cho AI`, [{ text: 'OK' }]);
  };

  return (
    <View testID="fields-screen" style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Cánh đồng của tôi</Text>
          <Text style={styles.pageSubtitle}>
            {fields.length > 0 ? `${fields.length} cánh đồng đang quản lý` : 'Chưa có cánh đồng nào'}
          </Text>
        </View>

        {/* Loading */}
        {isLoading && fields.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={C.primary} size="large" />
            <Text style={styles.loadingText}>Đang tải danh sách...</Text>
          </View>
        )}

        {/* Field list */}
        <View style={styles.listContainer}>
          {fields.map(field => (
            <FieldCard
              key={field.id}
              field={field}
              weather={weatherByField[field.id]}
              isSelected={selectedFieldId === field.id}
              onPress={handleSelectField}
            />
          ))}
        </View>

        {/* Empty state */}
        {!isLoading && fields.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🌾</Text>
            <Text style={styles.emptyTitle}>Chưa có cánh đồng</Text>
            <Text style={styles.emptyDesc}>
              Thêm cánh đồng để AI tư vấn chính xác hơn theo thời tiết và loại cây trồng của bạn.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        testID="fab-add-field"
        style={styles.fab}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.fabIcon}>＋</Text>
        <Text style={styles.fabText}>Thêm cánh đồng</Text>
      </Pressable>

      {/* Create modal */}
      <CreateFieldModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
        isLoading={isCreating}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingBottom: 100 },

  pageHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  pageTitle: { color: C.textPrimary, fontSize: FONT_SIZE.xxl, fontWeight: '800' },
  pageSubtitle: { color: C.textSecondary, fontSize: FONT_SIZE.sm, marginTop: 4 },

  loadingContainer: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.md },
  loadingText: { color: C.textMuted, fontSize: FONT_SIZE.sm },

  listContainer: { paddingHorizontal: SPACING.md },

  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    marginHorizontal: SPACING.md,
    backgroundColor: C.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: 'dashed',
  },
  emptyIcon: { fontSize: 56, marginBottom: SPACING.md },
  emptyTitle: { color: C.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.sm },
  emptyDesc: { color: C.textSecondary, fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20 },

  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.lg,
    left: SPACING.lg,
    backgroundColor: C.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    gap: SPACING.sm,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  fabIcon: { color: '#fff', fontSize: 20, fontWeight: '800' },
  fabText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },

  // Modal
  modalRoot: { flex: 1, backgroundColor: C.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  modalTitle: { color: C.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  modalClose: { color: C.textMuted, fontSize: FONT_SIZE.xl, fontWeight: '300', padding: SPACING.sm },
  modalBody: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },

  formField: { marginBottom: SPACING.md },
  formLabel: { color: C.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.xs },
  input: {
    backgroundColor: C.surface,
    color: C.textPrimary,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    fontSize: FONT_SIZE.md,
  },

  cropScroll: { marginTop: 4 },
  cropChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: C.border,
    marginRight: SPACING.sm,
    backgroundColor: C.surface,
  },
  cropChipActive: { borderColor: C.primary, backgroundColor: `${C.primary}12` },
  cropChipText: { color: C.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  cropChipTextActive: { color: C.primary },

  rowFields: { flexDirection: 'row', gap: SPACING.sm },

  coordHint: {
    backgroundColor: C.infoBg,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: `${C.info}30`,
  },
  coordHintText: { color: C.info, fontSize: FONT_SIZE.xs, lineHeight: 18 },

  submitBtn: {
    backgroundColor: C.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
});
