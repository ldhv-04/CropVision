import { StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';

// [L1] All magic numbers replaced with design tokens from theme.js.
//      This ensures visual consistency across all modules.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,           // was: 20
  },
  header: {
    marginBottom: SPACING.lg,      // was: 20
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,        // was: 24
    fontWeight: 'bold',
  },
  subTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,        // was: 14
    marginTop: SPACING.xs,         // was: 5
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: SPACING.lg,     // was: 20
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    margin: SPACING.sm,            // was: 10
    borderRadius: RADIUS.sm,       // was: 8
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    maxWidth: '31%',               // 3-column grid on Web/Electron
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    cursor: 'pointer',
  },
  thumbnailImage: {
    height: 150,
    width: '100%',
    backgroundColor: COLORS.black,
  },
  cardBody: {
    padding: SPACING.md,           // was: 15
  },
  sampleName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.lg,        // was: 16
    fontWeight: 'bold',
    marginBottom: SPACING.sm,      // was: 8
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,      // was: 4
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.xs,        // was: 12
  },
  infoValue: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xs,        // was: 12
    fontWeight: 'bold',
  },
  diseaseValue: {
    color: COLORS.danger,
    fontSize: FONT_SIZE.xs,        // was: 12
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xxl,        // was: 50
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.lg,        // was: 16
    fontStyle: 'italic',
  },
});

export default styles;
