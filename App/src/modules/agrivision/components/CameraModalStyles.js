import { StyleSheet, Dimensions } from 'react-native';
import { LIGHT_COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';

const { height } = Dimensions.get('window');
const C = LIGHT_COLORS;

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  overlayDismiss: {
    flex: 1,
  },
  sheetContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: 14,
    paddingHorizontal: SPACING.lg,
    maxHeight: height * 0.8,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  sheetSubtitle: {
    color: C.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: C.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionText: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  albumHeaderTitle: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 12,
  },
  albumList: {
    maxHeight: 260,
  },
  emptyAlbum: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    marginBottom: 20,
  },
  emptyAlbumText: {
    color: C.textMuted,
    fontSize: FONT_SIZE.sm,
  },
  photoListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  photoThumb: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.sm,
    backgroundColor: C.border,
  },
  photoMeta: {
    flex: 1,
    marginLeft: SPACING.sm,
    gap: 2,
  },
  photoName: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  photoPath: {
    color: C.textMuted,
    fontSize: FONT_SIZE.xs,
  },
  selectArrow: {
    fontSize: 18,
    color: C.primary,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  closeBtn: {
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: 24,
  },
  closeBtnText: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});
