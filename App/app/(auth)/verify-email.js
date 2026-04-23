import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/modules/@core/constants/theme';

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams();
  const [otpCode, setOtpCode] = useState('');

  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const isLoading = useAuthStore((s) => s.isLoading);

  const handleVerify = async () => {
    if (otpCode.length < 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập đủ mã xác thực 6 số.');
      return;
    }
    if (!email) {
      Alert.alert('Lỗi dữ liệu', 'Không tìm thấy email cần xác thực.');
      return;
    }

    const result = await verifyEmail(email, otpCode);
    if (result.success) {
      if (Platform.OS === 'web') {
        alert(result.message);
        router.replace('/login');
      } else {
        Alert.alert('Thành công', result.message, [
          { text: 'OK', onPress: () => router.replace('/login') },
        ]);
      }
    } else {
      if (Platform.OS === 'web') {
        alert('Xác thực thất bại: ' + result.message);
      } else {
        Alert.alert('Xác thực thất bại', result.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formBox}>
        <View style={styles.iconBadge}>
          <Text style={styles.iconText}>OTP</Text>
        </View>

        <Text style={styles.title}>Kiểm tra Email</Text>
        <Text style={styles.subtitle}>
          Mã xác thực 6 chữ số đã được gửi đến:{'\n'}
          <Text style={styles.emailHighlight}>{email}</Text>
        </Text>

        <TextInput
          id="verify-otp-input"
          style={styles.otpInput}
          placeholder="──────"
          placeholderTextColor={COLORS.placeholder}
          keyboardType="numeric"
          maxLength={6}
          value={otpCode}
          onChangeText={setOtpCode}
          textAlign="center"
        />

        <Pressable
          id="verify-submit"
          style={[styles.btn, isLoading && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.btnText}>Xác thực tài khoản</Text>
          }
        </Pressable>

        <Pressable style={styles.backLink} onPress={() => router.push('/login')}>
          <Text style={styles.backText}>← Quay lại Đăng nhập</Text>
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
    padding: SPACING.lg,
  },
  formBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconText: { color: COLORS.white, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  emailHighlight: { color: COLORS.primary, fontWeight: '600' },
  otpInput: {
    width: '100%',
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    fontSize: 28,
    letterSpacing: 8,
    marginBottom: SPACING.lg,
  },
  btn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '700' },
  backLink: { marginTop: SPACING.sm },
  backText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
});
