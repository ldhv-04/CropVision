/**
 * AlertsAdminStyles.js — Styles and helpers for AlertsAdminScreen
 */

import { Platform, Alert as RNAlert } from 'react-native';
import { SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';

export const SEVERITY_OPTIONS = [
  { value: 'info', label: 'Thông tin', icon: 'ℹ️', color: '#38bdf8' },
  { value: 'warning', label: 'Cảnh báo', icon: '⚠️', color: '#f59e0b' },
  { value: 'critical', label: 'Khẩn cấp', icon: '🚨', color: '#ef4444' },
];

export function getSeverityMap(C) {
  return {
    info: { label: 'Thông tin', color: '#38bdf8', bg: C.infoBg || '#0a1f2e' },
    warning: { label: 'Cảnh báo', color: '#f59e0b', bg: C.warningBg || '#261a00' },
    critical: { label: 'Khẩn cấp', color: '#ef4444', bg: C.dangerBg || '#250e0e' },
  };
}

/** Cross-platform confirm: window.confirm on web, RNAlert on native */
export function crossPlatformConfirm(title, message, onConfirm) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) {
      onConfirm();
    }
  } else {
    RNAlert.alert(title, message, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xác nhận', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

/** Cross-platform alert */
export function crossPlatformAlert(title, message) {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
  } else {
    RNAlert.alert(title, message);
  }
}

export function getStyles(C) {
  return {
    root: { flex: 1, backgroundColor: C.background },
    scrollContent: { paddingBottom: 100, paddingHorizontal: SPACING.md },
    summaryRow: { flexDirection: 'row', gap: SPACING.sm, paddingTop: SPACING.lg, marginBottom: SPACING.md },
    summaryCard: { flex: 1, backgroundColor: C.surface, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: C.border },
    summaryNumber: { color: C.primaryGlow, fontSize: FONT_SIZE.xl, fontWeight: '800' },
    summaryLabel: { color: C.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
    suggestionsSection: { marginBottom: SPACING.md },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.sm },
    sectionHeaderText: { color: C.primaryGlow, fontSize: FONT_SIZE.md, fontWeight: '700' },
    suggestionCard: { backgroundColor: C.surfaceAlt, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: `${C.warning}30` },
    suggestionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
    suggestionTitle: { color: C.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: '700', flex: 1 },
    suggestionCount: { color: C.warning, fontSize: FONT_SIZE.sm, fontWeight: '800' },
    suggestionMeta: { color: C.textMuted, fontSize: FONT_SIZE.xs, marginBottom: SPACING.sm },
    suggestionBtn: { backgroundColor: `${C.warning}20`, borderRadius: RADIUS.full, paddingVertical: SPACING.xs, alignItems: 'center', borderWidth: 1, borderColor: C.warning },
    suggestionBtnText: { color: C.warning, fontSize: FONT_SIZE.xs, fontWeight: '700' },
    alertCard: { backgroundColor: C.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: C.border },
    alertCardInactive: { opacity: 0.5 },
    alertCardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
    alertCardIcon: { fontSize: 24 },
    alertCardTitleGroup: { flex: 1 },
    alertCardTitle: { color: C.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700' },
    alertCardDate: { color: C.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
    severityBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
    severityBadgeText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
    alertCardMessage: { color: C.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20, marginBottom: SPACING.sm },
    geoInfo: { color: C.info, fontSize: FONT_SIZE.xs, marginBottom: SPACING.sm },
    alertCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    alertCardMeta: { flexDirection: 'row', gap: SPACING.md },
    metaText: { color: C.textMuted, fontSize: FONT_SIZE.xs },
    ackText: { color: C.primaryGlow, fontSize: FONT_SIZE.xs, fontWeight: '600' },
    alertCardActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
    metricsBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1, borderColor: C.info },
    metricsBtnText: { color: C.info, fontSize: FONT_SIZE.xs, fontWeight: '600' },
    deactivateBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, borderWidth: 1, borderColor: C.danger },
    deactivateBtnText: { color: C.danger, fontSize: FONT_SIZE.xs, fontWeight: '600' },
    emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl, paddingHorizontal: SPACING.xl, backgroundColor: C.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', marginTop: SPACING.md },
    emptyIcon: { fontSize: 56, marginBottom: SPACING.md },
    emptyTitle: { color: C.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.sm },
    emptyDesc: { color: C.textSecondary, fontSize: FONT_SIZE.sm, textAlign: 'center' },
    fab: { position: 'absolute', bottom: SPACING.xl, right: SPACING.lg, left: SPACING.lg, backgroundColor: C.danger, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.full, gap: SPACING.sm, shadowColor: C.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
    fabIcon: { color: '#fff', fontSize: 20, fontWeight: '800' },
    fabText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
    modalRoot: { flex: 1, backgroundColor: C.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
    modalTitle: { color: C.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700' },
    modalClose: { color: C.textMuted, fontSize: FONT_SIZE.xl, fontWeight: '300', padding: SPACING.sm },
    modalBody: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
    formLabel: { color: C.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600', marginBottom: SPACING.xs, marginTop: SPACING.md },
    input: { backgroundColor: C.surface, color: C.textPrimary, borderWidth: 1.5, borderColor: C.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 13, fontSize: FONT_SIZE.md },
    textArea: { minHeight: 100, textAlignVertical: 'top' },
    severityRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
    severityChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
    severityChipIcon: { fontSize: 16 },
    severityChipText: { color: C.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '600' },
    geoToggle: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, marginTop: SPACING.sm },
    geoToggleText: { color: C.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '600' },
    geoSection: { marginBottom: SPACING.md },
    mapPlaceholder: { height: 200, backgroundColor: C.surfaceAlt, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
    geoInputs: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
    submitBtn: { backgroundColor: C.danger, paddingVertical: SPACING.md, borderRadius: RADIUS.full, alignItems: 'center', marginTop: SPACING.xl },
    submitBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
    metricsTitle: { color: C.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.lg },
    metricsGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
    metricCard: { flex: 1, backgroundColor: C.surface, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: C.border },
    metricNumber: { color: C.primaryGlow, fontSize: FONT_SIZE.xl, fontWeight: '800' },
    metricLabel: { color: C.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },
    progressBarBg: { height: 8, backgroundColor: C.surfaceAlt, borderRadius: 4, overflow: 'hidden', marginBottom: SPACING.md },
    progressBarFill: { height: '100%', backgroundColor: C.primaryGlow, borderRadius: 4 },
    metricDetail: { color: C.textSecondary, fontSize: FONT_SIZE.sm, marginBottom: SPACING.xs },
  };
}
