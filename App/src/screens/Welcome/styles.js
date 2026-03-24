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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50
  },
  title: {
    color: COLORS.primary,
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 10
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 24
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 350
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold'
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default styles;