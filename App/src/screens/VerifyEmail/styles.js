import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  formBox: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    padding: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    elevation: 5
  },
  iconPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 20
  },
  iconText: {
    fontSize: 24,
    color: COLORS.primary
  },
  headerText: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20
  },
  otpInput: {
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    width: '100%',
    marginBottom: 20
  },
  verifyBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20
  },
  verifyBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold'
  },
  resendText: {
    color: COLORS.textSecondary,
    fontSize: 14
  },
  resendLink: {
    color: COLORS.primary,
    fontWeight: 'bold'
  }
});

export default styles;