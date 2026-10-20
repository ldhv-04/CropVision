import { StyleSheet } from 'react-native';
import { LIGHT_COLORS, SPACING, RADIUS } from '../../../@core/constants/theme';

export const C = LIGHT_COLORS;

export const cultivationErrorCopy = {
  NO_PUBLISHED_MAP: {
    title: 'Map not published',
    message: 'Cultivation becomes available after a map is published.',
  },
  PUBLICATION_CONFLICT: {
    title: 'Publication conflict',
  },
  FIELD_NOT_FOUND: {
    title: 'Field unavailable',
    message: 'This field is unavailable.',
  },
};

export const LOG_TYPES = [
  'watering',
  'fertilizing',
  'pesticide',
  'harvesting',
  'planting',
  'observation',
  'other',
];

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  content: { padding: SPACING.md, paddingTop: 48, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, backgroundColor: C.background },
  loadingText: { marginTop: SPACING.sm, color: C.textSecondary, fontSize: 16 },
  backButton: { alignSelf: 'flex-start', paddingVertical: SPACING.sm, paddingHorizontal: SPACING.sm, marginBottom: SPACING.sm },
  backText: { color: C.primary, fontSize: 16, fontWeight: '700' },
  headerCard: { backgroundColor: C.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: C.border, marginBottom: SPACING.md },
  eyebrow: { color: C.textSecondary, fontSize: 13, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: C.textPrimary, fontSize: 28, fontWeight: '900', marginTop: SPACING.xs },
  subtitle: { color: C.textSecondary, fontSize: 16, marginTop: SPACING.xs },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.md },
  metaPill: { backgroundColor: C.successBg, color: C.primary, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, fontSize: 13, fontWeight: '800' },
  sectionCard: { backgroundColor: C.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: C.border, marginBottom: SPACING.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.sm },
  sectionTitle: { color: C.textPrimary, fontSize: 20, fontWeight: '900' },
  sectionHint: { color: C.textSecondary, fontSize: 13 },
  inputGroup: { marginBottom: SPACING.md },
  inputLabel: { color: C.textSecondary, fontSize: 13, fontWeight: '800', marginBottom: SPACING.xs },
  input: { minHeight: 48, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: C.textPrimary, fontSize: 16 },
  textArea: { minHeight: 92, textAlignVertical: 'top' },
  twoCol: { flexDirection: 'row', gap: SPACING.sm },
  col: { flex: 1 },
  typeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  typeChip: { borderRadius: RADIUS.full, borderWidth: 1, borderColor: C.border, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: C.surfaceAlt },
  typeChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  typeChipText: { color: C.textSecondary, fontSize: 14, fontWeight: '800' },
  typeChipTextActive: { color: C.white },
  primaryButton: { minHeight: 48, borderRadius: RADIUS.md, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.md },
  primaryButtonText: { color: C.white, fontSize: 16, fontWeight: '900' },
  secondaryButton: { minHeight: 44, borderRadius: RADIUS.md, backgroundColor: C.warningBg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.md, marginTop: SPACING.md },
  secondaryButtonText: { color: C.warning, fontSize: 16, fontWeight: '900' },
  conflictCard: { backgroundColor: C.warningBg, borderColor: C.warningBorder, borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  conflictTitle: { color: C.warning, fontSize: 18, fontWeight: '900', marginBottom: SPACING.xs },
  conflictText: { color: C.textPrimary, fontSize: 16, lineHeight: 22 },
  errorText: { color: C.danger, backgroundColor: C.dangerBg, borderColor: C.dangerBorder, borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, fontSize: 16 },
  emptyText: { color: C.textSecondary, fontSize: 16, lineHeight: 22 },
  linkText: { color: C.primary, fontSize: 14, fontWeight: '900' },
  logRow: { borderTopWidth: 1, borderTopColor: C.border, paddingVertical: SPACING.md },
  logMain: { gap: 2 },
  logType: { color: C.primary, fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  logDate: { color: C.textPrimary, fontSize: 16, fontWeight: '800' },
  logTitle: { color: C.textPrimary, fontSize: 16, fontWeight: '700' },
  logMeta: { color: C.textSecondary, fontSize: 15 },
  logNote: { color: C.textSecondary, fontSize: 15, lineHeight: 21, marginTop: SPACING.xs },
  logActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  smallButton: { borderRadius: RADIUS.md, backgroundColor: C.successBg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  smallButtonText: { color: C.primary, fontSize: 14, fontWeight: '900' },
  smallDangerButton: { borderRadius: RADIUS.md, backgroundColor: C.dangerBg, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  smallDangerText: { color: C.danger, fontSize: 14, fontWeight: '900' },
  deleteConfirmCard: { backgroundColor: C.dangerBg, borderColor: C.dangerBorder, borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.sm },
  deleteConfirmTitle: { color: C.danger, fontSize: 16, fontWeight: '900', marginBottom: SPACING.xs },
  deleteConfirmText: { color: C.textPrimary, fontSize: 15, lineHeight: 21 },
});
