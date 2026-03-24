import { StyleSheet } from 'react-native';
import {COLORS}  from '../../constants/theme';

// const styles = StyleSheet.create({
//   container: { 
//     ...StyleSheet.absoluteFillObject, // Lệnh này tương đương: position: 'absolute', top: 0, bottom: 0, left: 0, right: 0
//     flexDirection: 'row', 
//     backgroundColor: '#0f172a',
//     overflow: 'hidden' 
//   },
//   sidebar: { 
//     width: 250, 
//     backgroundColor: '#1e293b', 
//     padding: 20, 
//     justifyContent: 'space-between' 
//   },
//   title: { 
//     color: '#22c55e', 
//     fontSize: 24, 
//     fontWeight: 'bold', 
//     marginBottom: 40 
//   },
//   menuList: { 
//     flex: 1
//   },
//   menuItem: { 
//     paddingVertical: 15, 
//     borderBottomWidth: 1, 
//     borderColor: '#334155' 
//   },
//   menuText: { color: '#e2e8f0', fontSize: 16 },
//   logoutBtn: { paddingVertical: 15, borderTopWidth: 1, borderColor: '#334155', marginTop: 20 },
//   logoutText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
//   mainViewer: { flex: 1, backgroundColor: '#0f172a', padding: 20 },
//   header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
//   sampleName: { color: '#f8fafc', fontSize: 20, fontWeight: '600' },
//   actionBtn: { backgroundColor: '#334155', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6 },
//   actionText: { color: '#cbd5e1' },
//   imageContainer: { flex: 1, backgroundColor: '#000', borderRadius: 8, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
//   previewImage: { width: '100%', height: '100%' },
//   imagePlaceholder: { padding: 20, borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed' },
//   placeholderText: { color: '#94a3b8' },
//   aiPanel: { width: 350, backgroundColor: '#1e293b', padding: 20, borderLeftWidth: 1, borderColor: '#334155' },
//   tabContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
//   tab: { paddingBottom: 5, borderBottomWidth: 2, borderColor: '#22c55e' },
//   tabText: { color: '#22c55e', fontWeight: 'bold' },
//   btnAction: { backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, minWidth: 120, alignItems: 'center' },
//   btnText: { color: '#fff', fontWeight: 'bold' },
//   panelContent: { flex: 1 },
//   sectionTitle: { color: '#94a3b8', marginTop: 10, marginBottom: 15, fontSize: 16, fontWeight: '600' },
//   boxItem: { backgroundColor: '#334155', padding: 15, borderRadius: 8, marginBottom: 12 },
//   diseaseName: { color: '#f8fafc', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
//   boxText: { color: '#cbd5e1', fontSize: 14, marginBottom: 2 }
// });


export const styles = StyleSheet.create({
  container: { 
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row', 
    backgroundColor: COLORS.background,
    overflow: 'hidden' 
  },
  sidebar: { 
    width: 250, 
    backgroundColor: COLORS.surface, 
    padding: 20, 
    justifyContent: 'space-between' 
  },
  title: { 
    color: COLORS.primary, 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 40 
  },
  menuList: { flex: 1 },
  menuItem: { 
    paddingVertical: 15, 
    borderBottomWidth: 1, 
    borderColor: COLORS.border 
  },
  menuText: { color: '#e2e8f0', fontSize: 16 },
  logoutBtn: { 
    paddingVertical: 15, 
    borderTopWidth: 1, 
    borderColor: COLORS.border, 
    marginTop: 20 
  },
  logoutText: { 
    color: COLORS.danger, 
    fontSize: 16, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  mainViewer: { 
    flex: 1, 
    backgroundColor: COLORS.background, 
    padding: 20 
  },
  adminViewer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20, 
    alignItems: 'center' 
  },
  sampleName: { 
    color: COLORS.textPrimary, 
    fontSize: 20, 
    fontWeight: '600' 
  },
  actionBtn: { 
    backgroundColor: COLORS.border, 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 6 
  },
  actionText: { color: COLORS.placeholder },
  imageContainer: { 
    flex: 1, 
    backgroundColor: COLORS.black, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    overflow: 'hidden',
    position: 'relative'
  },
  imageLegend: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  imageLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  imageLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  imageLegendText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  previewImage: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    bottom: 0, 
    right: 0, 
    width: '100%', 
    height: '100%', 
    resizeMode: 'contain' 
  },
  overlayHotspot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(248, 113, 113, 0.7)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  overlayHotspotActive: {
    borderColor: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#ffffff',
    shadowOpacity: 0.45,
    shadowRadius: 12,
    transform: [{ scale: 1.02 }],
  },
  imagePlaceholder: { 
    padding: 20, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderStyle: 'dashed' 
  },
  focusPreviewCard: {
    marginTop: 16,
    backgroundColor: '#172033',
    borderWidth: 1,
    borderColor: '#2f4569',
    borderRadius: 12,
    padding: 12,
    alignSelf: 'flex-start',
  },
  focusPreviewTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  focusPreviewViewport: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.black,
    borderWidth: 1,
    borderColor: '#30435e',
  },
  focusPreviewImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  placeholderText: { color: COLORS.textSecondary },
  aiPanel: { 
    width: 350, 
    backgroundColor: COLORS.surface, 
    padding: 20, 
    borderLeftWidth: 1, 
    borderColor: COLORS.border 
  },
  tabContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20, 
    alignItems: 'center' 
  },
  tab: { 
    paddingBottom: 5, 
    borderBottomWidth: 2, 
    borderColor: COLORS.primary 
  },
  tabText: { color: COLORS.primary, fontWeight: 'bold' },
  btnAction: { 
    backgroundColor: COLORS.secondary, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 4, 
    minWidth: 120, 
    alignItems: 'center' 
  },
  btnText: { color: COLORS.white, fontWeight: 'bold' },
  panelContent: { flex: 1 },
  detailPanel: {
    backgroundColor: '#172033',
    borderWidth: 1,
    borderColor: '#2f4569',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  summaryHero: {
    backgroundColor: '#101827',
    borderWidth: 1,
    borderColor: '#2f4569',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  summaryHeroLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  summaryHeroValue: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  summaryChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  focusModeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  focusModeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: '#182233',
    marginRight: 8,
  },
  focusModeBtnActive: {
    backgroundColor: '#22314a',
    borderColor: COLORS.primary,
  },
  focusModeBtnDisabled: {
    opacity: 0.45,
  },
  focusModeText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#182233',
  },
  filterChipActive: {
    backgroundColor: '#22314a',
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  summaryChip: {
    backgroundColor: '#243248',
    borderWidth: 1,
    borderColor: '#355070',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  summaryChipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  summaryChipText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  detailPanelMuted: {
    backgroundColor: '#121a29',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  selectedDetailBlock: {
    backgroundColor: '#1b2436',
    borderWidth: 1,
    borderColor: '#3b4c6a',
    borderRadius: 12,
    padding: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  detailClearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.border,
  },
  detailStatePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#243248',
  },
  detailClearText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  detailStateText: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '700',
  },
  selectedDetailTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  detailDisease: {
    color: '#7dd3fc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  detailText: {
    color: COLORS.placeholder,
    fontSize: 13,
    marginBottom: 4,
  },
  detailHintTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  detailHintText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  emptyFilterText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  sectionTitle: { 
    color: COLORS.textSecondary, 
    marginTop: 10, 
    marginBottom: 15, 
    fontSize: 16, 
    fontWeight: '600' 
  },
  boxItem: { 
    backgroundColor: COLORS.border, 
    padding: 15, 
    borderRadius: 8, 
    marginBottom: 12 
  },
  boxItemActive: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: '#41212a',
    transform: [{ scale: 1.01 }],
  },
  diseaseName: { 
    color: COLORS.textPrimary, 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 6 
  },
  boxText: { color: COLORS.placeholder, fontSize: 14, marginBottom: 2 }
});

export default styles;
