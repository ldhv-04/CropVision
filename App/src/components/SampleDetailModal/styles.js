import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../constants/theme';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // Màu nền tối mờ
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContainer: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  closeBtn: {
    padding: 5
  },
  closeBtnText: {
    fontSize: 20,
    color: COLORS.textSecondary,
    fontWeight: 'bold'
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#000'
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain'
  },
  infoSection: {
    padding: 20
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start'
  },
  iconBox: {
    width: 35,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconText: {
    fontSize: 22
  },
  textContainer: {
    flex: 1
  },
  label: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  value: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500'
  },
  diseaseValue: {
    fontSize: 18,
    color: '#ef4444', // Màu đỏ cảnh báo dịch bệnh
    fontWeight: 'bold'
  }
});

export default styles;