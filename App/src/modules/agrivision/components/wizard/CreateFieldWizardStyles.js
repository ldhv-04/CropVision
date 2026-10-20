/**
 * CreateFieldWizardStyles.js — Styles for CreateFieldWizard
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.15)',
  },
  closeText: { color: '#94a3b8', fontSize: 18 },
  headerTitle: { color: '#e2e8f0', fontSize: 16, fontWeight: '600' },
  stepIndicator: {
    flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16,
    paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.1)',
  },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(148,163,184,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: { backgroundColor: '#6366f1' },
  stepDotText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  stepDotTextActive: { color: '#ffffff' },
  stepLabel: { color: '#64748b', fontSize: 9 },
  stepLabelActive: { color: '#818cf8' },
  body: { flex: 1, paddingHorizontal: 16 },
  stepContent: { paddingVertical: 16 },
  stepTitle: { color: '#e2e8f0', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12,
    backgroundColor: 'rgba(30,41,59,0.8)', marginBottom: 10, gap: 14,
    borderWidth: 1, borderColor: 'transparent',
  },
  methodCardActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)' },
  methodIcon: { fontSize: 28 },
  methodInfo: { flex: 1 },
  methodLabel: { color: '#e2e8f0', fontSize: 15, fontWeight: '600' },
  methodDesc: { color: '#64748b', fontSize: 12, marginTop: 2 },
  placeholder: {
    alignItems: 'center', justifyContent: 'center', padding: 40, borderRadius: 12,
    backgroundColor: 'rgba(30,41,59,0.5)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.15)',
    borderStyle: 'dashed',
  },
  placeholderIcon: { fontSize: 40, marginBottom: 12 },
  placeholderText: { color: '#94a3b8', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  skipBtn: { marginTop: 16, alignItems: 'center' },
  skipText: { color: '#818cf8', fontSize: 13 },
  formGroup: { marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '500', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(30,41,59,0.8)', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, color: '#e2e8f0', fontSize: 14, borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stageChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
    backgroundColor: 'rgba(148,163,184,0.1)', borderWidth: 1, borderColor: 'transparent',
  },
  stageChipActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.15)' },
  stageChipText: { color: '#94a3b8', fontSize: 12 },
  stageChipTextActive: { color: '#818cf8' },
  reviewCard: {
    backgroundColor: 'rgba(30,41,59,0.8)', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.15)',
  },
  reviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(148,163,184,0.08)',
  },
  reviewLabel: { color: '#64748b', fontSize: 13 },
  reviewValue: { color: '#e2e8f0', fontSize: 13, fontWeight: '500' },
  footer: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16, gap: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(148,163,184,0.15)',
  },
  backBtn: {
    paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10,
    backgroundColor: 'rgba(148,163,184,0.1)',
  },
  backBtnText: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  nextBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#6366f1',
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },
});
