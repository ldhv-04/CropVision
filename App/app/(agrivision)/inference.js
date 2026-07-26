/**
 * Inference Screen — AgriVision
 *
 * Wraps the existing InferenceLayout with a field selector
 * so AI recommendations become context-aware (weather + crop type).
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { useFieldStore } from '../../src/modules/agrivision';
import { InferenceLayout, markLatestInferenceDebugEvent } from '../../src/modules/inference';
import { LIGHT_COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/modules/@core/constants/theme';

const C = LIGHT_COLORS;

export default function InferenceScreen() {
  const { fields, selectedFieldId, selectField } = useFieldStore();
  const selectedField = fields.find(f => f.id === selectedFieldId);

  useEffect(() => {
    markLatestInferenceDebugEvent('screen-mounted', {
      screen: 'inference-screen',
      selectedFieldId,
    });
    markLatestInferenceDebugEvent('route-param-received', {
      screen: 'inference-screen',
      hasRouteParams: false,
    });
  }, []);

  return (
    <View testID="inference-screen" style={styles.root}>
      {/* Field Context Banner */}
      {fields.length > 0 && (
        <View style={styles.contextBanner}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerLabel}>Cánh đồng AI</Text>
            <Text style={styles.bannerField}>
              {selectedField ? `🌾 ${selectedField.name} (${selectedField.crop_type})` : 'Chưa chọn cánh đồng'}
            </Text>
          </View>
          {!selectedField && (
            <View style={styles.bannerAlert}>
              <Text style={styles.bannerAlertText}>
                ⚠️ Chọn cánh đồng để AI tư vấn chính xác hơn
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Field Quick Selector */}
      {fields.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fieldSelector} contentContainerStyle={styles.fieldSelectorContent}>
          <Pressable
            style={[styles.chip, !selectedFieldId && styles.chipActive]}
            onPress={() => selectField(null)}
          >
            <Text style={[styles.chipText, !selectedFieldId && styles.chipTextActive]}>Không chọn</Text>
          </Pressable>
          {fields.map(f => (
            <Pressable
              key={f.id}
              style={[styles.chip, selectedFieldId === f.id && styles.chipActive]}
              onPress={() => selectField(f.id)}
            >
              <Text style={[styles.chipText, selectedFieldId === f.id && styles.chipTextActive]}>
                {f.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Reuse existing InferenceLayout */}
      <View style={styles.inferenceContainer}>
        <InferenceLayout fieldContext={{ selectedFieldId, fields }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },

  contextBanner: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: `${C.primary}08`,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: `${C.primary}25`,
    gap: SPACING.xs,
  },
  bannerLeft: {},
  bannerLabel: { color: C.textMuted, fontSize: FONT_SIZE.xs, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  bannerField: { color: C.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '700', marginTop: 2 },
  bannerAlert: {
    backgroundColor: C.warningBg,
    borderRadius: RADIUS.sm,
    padding: SPACING.xs,
    borderWidth: 1,
    borderColor: C.warningBorder,
  },
  bannerAlertText: { color: C.warning, fontSize: FONT_SIZE.xs },

  fieldSelector: { maxHeight: 44, marginTop: SPACING.sm },
  fieldSelectorContent: { paddingHorizontal: SPACING.md, gap: SPACING.xs },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  chipActive: { borderColor: C.primary, backgroundColor: `${C.primary}12` },
  chipText: { color: C.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  chipTextActive: { color: C.primary },

  inferenceContainer: { flex: 1 },
});
