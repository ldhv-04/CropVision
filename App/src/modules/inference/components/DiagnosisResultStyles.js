import { StyleSheet, Dimensions } from 'react-native';
import { LIGHT_COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';

const { width } = Dimensions.get('window');
const C = LIGHT_COLORS;

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  contentContainer: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backLink: { paddingVertical: 8, paddingRight: 16 },
  backLinkText: { color: C.primary, fontWeight: '600', fontSize: FONT_SIZE.md },
  headerTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: C.textPrimary, flex: 1, textAlign: 'center' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, backgroundColor: C.background },
  loaderText: { marginTop: 16, fontSize: FONT_SIZE.lg, fontWeight: '700', color: C.textPrimary },
  loaderSubtext: { marginTop: 8, fontSize: FONT_SIZE.sm, color: C.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  fallbackContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, backgroundColor: C.background },
  fallbackText: { color: C.textSecondary, fontSize: FONT_SIZE.md, marginBottom: 20 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: C.textPrimary, marginBottom: 8 },
  errorDesc: { color: C.danger, fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20, marginBottom: 24, maxWidth: 300 },
  retryBtn: { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: RADIUS.md, marginBottom: 12, width: 200, alignItems: 'center' },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.md },
  backBtn: { borderWidth: 1, borderColor: C.border, paddingHorizontal: 24, paddingVertical: 14, borderRadius: RADIUS.md, width: 200, alignItems: 'center' },
  backBtnText: { color: C.textPrimary, fontWeight: '600', fontSize: FONT_SIZE.md },
  imageCard: { width: '100%', height: 260, position: 'relative', backgroundColor: C.black },
  image: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 100 },
  imageMeta: { position: 'absolute', bottom: 16, left: 16, right: 16, gap: 4 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  imageName: { color: '#fff', fontSize: 20, fontWeight: '700', textTransform: 'capitalize' },
  detailsContainer: { padding: SPACING.md, gap: SPACING.md },
  detailsCard: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  healthyTitle: { fontSize: 22, fontWeight: '800', color: C.primary, textAlign: 'center', marginBottom: 12 },
  healthyText: { fontSize: 15, color: C.textPrimary, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  healthySubtext: { fontSize: 13, color: C.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 24 },
  diseaseHeader: { marginBottom: 16 },
  diseaseNameVi: { fontSize: 22, fontWeight: '800', color: C.textPrimary, textTransform: 'capitalize' },
  diseaseNameEn: { fontSize: 14, color: C.textSecondary, fontStyle: 'italic', marginTop: 2 },
  metaRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border, paddingVertical: SPACING.md, marginBottom: 16 },
  metaItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  metaLabel: { fontSize: 10, color: C.textMuted, textTransform: 'uppercase', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  metaValue: { fontSize: 14, color: C.textPrimary, fontWeight: '600', textAlign: 'center' },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: C.textPrimary, marginTop: 16, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: C.primary, paddingLeft: 8 },
  descriptionText: { fontSize: 14, lineHeight: 22, color: C.textSecondary },
  bulletItem: { fontSize: 14, lineHeight: 22, color: C.textSecondary, marginBottom: 4, paddingLeft: 8 },
  treatmentContainer: { gap: SPACING.md },
  mainTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary, marginTop: 12, marginBottom: 4 },
  treatmentSection: { gap: SPACING.sm },
  treatmentTypeTitle: { fontSize: 15, fontWeight: '700', color: C.textPrimary, marginTop: 8 },
  treatmentCard: { backgroundColor: C.surface, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: C.border, borderLeftWidth: 4, borderLeftColor: C.primary },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: C.textPrimary, flex: 1 },
  cardStars: { fontSize: 12 },
  cardDesc: { fontSize: 13, lineHeight: 18, color: C.textSecondary, marginBottom: 6 },
  cardGuide: { fontSize: 13, lineHeight: 18, color: C.textPrimary, marginTop: 4 },
  pesticideCard: { backgroundColor: C.surface, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: C.border },
  pesticideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  pesticideName: { fontSize: 14, fontWeight: '700', color: C.textPrimary },
  pesticideActive: { fontSize: 12, color: C.textSecondary, fontStyle: 'italic' },
  pesticideMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  pesticideMeta: { fontSize: 12, color: C.textSecondary },
  disclaimerBox: { backgroundColor: '#fffbeb', borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: '#fef3c7', marginTop: 8 },
  disclaimerText: { color: '#b45309', fontSize: 12, lineHeight: 18 },
  buttonRow: { marginTop: 12, alignItems: 'center' },
  actionButton: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    width: '100%',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export function getNowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now();
}

export function isDevRuntime() {
  if (typeof __DEV__ !== 'undefined') return Boolean(__DEV__);
  return process.env.NODE_ENV !== 'production';
}

export function logDiagnosisTiming(label, metrics) {
  if (!isDevRuntime()) return;
  const rounded = Object.fromEntries(
    Object.entries(metrics).map(([key, value]) => [
      key,
      typeof value === 'number' ? Math.round(value) : value,
    ])
  );
  console.info(`[InferenceTiming] ${label}`, rounded);
}
