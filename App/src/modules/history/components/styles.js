import { StyleSheet } from 'react-native';
import { COLORS } from '../../@core/constants/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 20
  },
  header: {
    marginBottom: 20
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold'
  },
  subTitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 5
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContainer: {
    paddingBottom: 20
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    margin: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    maxWidth: '31%' // Đảm bảo chia đều 3 cột trên Web/Electron
  },
  thumbnailImage: {
    height: 150,
    width: '100%',
    //resizeMode: 'cover', // Cắt cúp ảnh cho đầy khung mà không làm méo tỷ lệ
    backgroundColor: COLORS.black
  },
  cardBody: {
    padding: 15
  },
  sampleName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: 12
  },
  infoValue: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold'
  },
  diseaseValue: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: 'bold'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontStyle: 'italic'
  }
});

export default styles;