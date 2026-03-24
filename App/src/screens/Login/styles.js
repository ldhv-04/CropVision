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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  headerText: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: 15
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 8
  },
  input: {
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16
  },
  forgotText: {
    color: COLORS.primary,
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 20
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold'
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center'
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14
  },
  linkText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5
  }
});

export default styles;