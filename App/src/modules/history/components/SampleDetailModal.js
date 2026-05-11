import React from 'react';
import { View, Text, Modal, Image, ScrollView, Pressable } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';
import { resolveAssetUrl } from '../../@core/api/apiClient';

/**
 * SampleDetailModal — displays full sample details when a history card is tapped.
 * Shows the original image, all detections with confidence scores, and metadata.
 *
 * @param {boolean}  visible  — controls modal visibility
 * @param {object}   sample   — a single sample row from getSamplesHistory
 * @param {function} onClose  — callback to dismiss the modal
 */
export default function SampleDetailModal({ visible, sample, onClose }) {
  if (!sample) return null;

  const detections = typeof sample.detections === 'string'
    ? JSON.parse(sample.detections)
    : sample.detections ?? [];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Header */}
          <View style={s.header}>
            <Text style={s.title} numberOfLines={1}>
              {sample.sample_name}
            </Text>
            <Pressable onPress={onClose} hitSlop={12} style={s.closeBtn}>
              <Text style={s.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Image */}
            <Image
              source={{ uri: resolveAssetUrl(sample.image_url) }}
              style={s.image}
              resizeMode="contain"
            />

            {/* Metadata */}
            <View style={s.metaSection}>
              <MetaRow label="Loại cây" value={sample.crop_type || '—'} />
              <MetaRow label="Ngày quét" value={formatDate(sample.created_at)} />
              {sample.owner_email && (
                <MetaRow label="Chủ sở hữu" value={sample.owner_email} />
              )}
              <MetaRow
                label="Số phát hiện"
                value={`${detections.length} vết bệnh`}
                highlight={detections.length > 0}
              />
            </View>

            {/* Detections */}
            {detections.length > 0 && (
              <View style={s.detectionSection}>
                <Text style={s.sectionTitle}>Chi tiết phát hiện</Text>
                {detections.map((det, idx) => (
                  <View key={idx} style={s.detectionCard}>
                    <View style={s.detHeader}>
                      <View style={[s.dot, { backgroundColor: colorForClass(det.disease_class) }]} />
                      <Text style={s.detClassName}>{det.disease_class}</Text>
                    </View>
                    <Text style={s.detConfidence}>
                      Độ tin cậy: {(det.confidence * 100).toFixed(1)}%
                    </Text>
                    {det.bounding_boxes && det.bounding_boxes.length > 0 && (
                      <Text style={s.detBbox}>
                        {det.bounding_boxes.length} vùng phát hiện
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────
function MetaRow({ label, value, highlight }) {
  return (
    <View style={s.metaRow}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={[s.metaValue, highlight && s.metaHighlight]}>{value}</Text>
    </View>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────
const CLASS_COLORS = {
  'Bệnh đạo ôn': '#E74C3C',
  'Bệnh cháy lá': '#E67E22',
  'Bệnh đốm nâu': '#F39C12',
  'Bệnh khô vằn': '#8E44AD',
  'Bệnh lem lép hạt': '#2ECC71',
  'Đạo ôn': '#E74C3C',
  'Cháy lá': '#E67E22',
  'Đốm nâu': '#F39C12',
  'Khô vằn': '#8E44AD',
  'Lem lép hạt': '#2ECC71',
};

function colorForClass(className) {
  return CLASS_COLORS[className] || COLORS.primary;
}

// ─── Styles ──────────────────────────────────────────────────────────────
const s = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '85%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginRight: SPACING.sm,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  image: {
    width: '100%',
    height: 280,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.black,
    marginBottom: SPACING.md,
  },
  // ─ metadata
  metaSection: {
    marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  metaLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  metaValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  metaHighlight: {
    color: COLORS.danger,
  },
  // ─ detections
  detectionSection: {
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  detectionCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  detHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  detClassName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  detConfidence: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginLeft: 18,
  },
  detBbox: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,
    marginLeft: 18,
    marginTop: 2,
  },
};
