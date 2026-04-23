import { router } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS } from '../../src/modules/@core/constants/theme';

/**
 * Welcome screen — entry point for unauthenticated users.
 * Uses router.push() instead of navigation.navigate() for Expo Router.
 */
export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.title}>CropVision AI</Text>
        <Text style={styles.subtitle}>
          Hệ thống nhận diện bệnh lý nông nghiệp độ chính xác cao dựa trên kiến trúc YOLOv8.{' '}
          Phân tích nhanh chóng, lưu trữ an toàn.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable style={styles.primaryBtn} onPress={() => router.push('/login')}>
          <Text style={styles.primaryBtnText}>Đăng nhập</Text>
        </Pressable>

        <Pressable style={styles.secondaryBtn} onPress={() => router.push('/register')}>
          <Text style={styles.secondaryBtnText}>Tạo tài khoản mới</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 340,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
