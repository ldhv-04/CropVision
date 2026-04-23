/**
 * DetectionList — Inference Module Component
 * Scrollable list of YOLO detection results with highlight interaction.
 */

import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRef } from 'react';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';

export function DetectionList({
  detections,
  visibleIndexes,
  focusedIndex,
  selectedIndex,
  diseaseColorMap,
  onPress,
}) {
  const scrollRef = useRef(null);
  const layouts   = useRef({});

  if (!detections?.length) {
    return (
      <Text style={styles.empty}>Chưa có dữ liệu phân tích.</Text>
    );
  }

  return (
    <ScrollView ref={scrollRef} style={styles.scroll} showsVerticalScrollIndicator={false}>
      {visibleIndexes.map((idx) => {
        const box   = detections[idx];
        const color = diseaseColorMap[box.class_name] || '#facc15';
        const isActive = focusedIndex === idx;

        return (
          <Pressable
            key={idx}
            onLayout={(e) => { layouts.current[idx] = e.nativeEvent.layout.y; }}
            style={[styles.item, { borderLeftColor: color }, isActive && styles.itemActive]}
            onPress={() => onPress(idx)}
          >
            <Text style={[styles.name, { color }]}>{box.class_name}</Text>
            <Text style={styles.meta}>
              #{idx + 1}
              {selectedIndex === idx ? ' · Đang khoá chọn' : isActive ? ' · Đang xem' : ''}
            </Text>
            <Text style={styles.conf}>Độ tin cậy: {(box.confidence * 100).toFixed(1)}%</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:    { flex: 1 },
  empty:     { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, padding: SPACING.md },
  item: {
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.border,
    padding:         SPACING.sm,
    marginBottom:    SPACING.xs,
  },
  itemActive: { backgroundColor: `${COLORS.primary}12` },
  name:       { fontSize: FONT_SIZE.sm, fontWeight: '700', marginBottom: 2 },
  meta:       { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, marginBottom: 2 },
  conf:       { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary },
});
