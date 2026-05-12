import { View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';
import { useLayoutMode } from '../../platform/hooks/useLayoutMode';

export function AdminSampleList({ samples, actionKey, onDelete }) {
  const { isCompact } = useLayoutMode();

  const handleDelete = (sample) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(`Xóa mẫu vật\n\nBạn có chắc muốn xóa mẫu ${sample.sample_name}?`)) {
          onDelete(sample.id);
      }
      return;
    }

    Alert.alert(
      'Xóa mẫu vật',
      `Bạn có chắc muốn xóa mẫu ${sample.sample_name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đồng ý', style: 'destructive', onPress: () => onDelete(sample.id) },
      ]
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Chưa có';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý mẫu vật</Text>
        <Text style={styles.meta}>{samples.length} bản ghi</Text>
      </View>

      {samples.length === 0 ? (
        <Text style={styles.empty}>Chưa có mẫu vật nào để quản lý.</Text>
      ) : (
        samples.map((sample) => (
          <View key={sample.id} style={styles.row}>
            <View style={[styles.rowHeader, isCompact && styles.col]}>
              <View>
                <Text style={styles.rowTitle}>{sample.sample_name}</Text>
                <Text style={styles.rowSub}>{sample.owner_email || 'Không gắn user'}</Text>
              </View>
              <View style={[styles.badge, isCompact && styles.badgeCompact]}>
                <Text style={styles.badgeText}>{sample.detection_count} detections</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Top Conf: {(sample.top_confidence * 100).toFixed(1)}%</Text>
              <Text style={styles.metaText}>Dung lượng: {Math.round(sample.file_size / 1024)} KB</Text>
              <Text style={styles.metaText}>Tạo: {formatDate(sample.created_at)}</Text>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                style={[styles.btn, styles.btnDanger]}
                onPress={() => handleDelete(sample)}
                disabled={actionKey === `delete-sample-${sample.id}`}
              >
                <Text style={styles.btnText}>
                  {actionKey === `delete-sample-${sample.id}` ? 'Đang xóa...' : 'Xóa mẫu vật'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, padding: SPACING.lg, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: SPACING.sm },
  title: { color: COLORS.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700' },
  meta: { color: COLORS.primary, fontSize: FONT_SIZE.sm },
  empty: { color: COLORS.textSecondary },
  row: { borderBottomWidth: 1, borderBottomColor: `${COLORS.border}50`, paddingVertical: SPACING.md },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  col: { flexDirection: 'column', alignItems: 'flex-start' },
  rowTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '600' },
  rowSub: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  badge: { backgroundColor: COLORS.secondary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.sm, minWidth: 80, alignItems: 'center' },
  badgeCompact: { marginTop: SPACING.xs },
  badgeText: { color: COLORS.white, fontSize: FONT_SIZE.xs, fontWeight: 'bold' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md, marginVertical: SPACING.sm },
  metaText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.xs },
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  btn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  btnDanger: { backgroundColor: `${COLORS.danger}20`, borderWidth: 1, borderColor: COLORS.danger },
  btnText: { color: COLORS.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
});
