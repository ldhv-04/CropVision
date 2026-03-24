import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  toolbarTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  toolbarSubTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  refreshBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  refreshText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 20,
  },
  summaryCard: {
    width: '23%',
    minWidth: 170,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 8,
    marginBottom: 12,
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 10,
  },
  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  panelCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionMeta: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  row: {
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 14,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rowTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  rowSubTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  metaText: {
    color: COLORS.placeholder,
    fontSize: 12,
    marginRight: 16,
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  primaryAction: {
    backgroundColor: COLORS.primary,
  },
  dangerAction: {
    backgroundColor: COLORS.danger,
  },
  mutedAction: {
    backgroundColor: COLORS.border,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});

export default styles;
