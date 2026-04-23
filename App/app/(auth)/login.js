import { useState } from 'react';
import { router } from 'expo-router';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/modules/@core/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu.');
      return;
    }

    const result = await login(email.trim(), password);
    if (!result.success) {
      Alert.alert('Đăng nhập thất bại', result.message);
    }
    // On success, root index.js will auto-redirect to (main)/inference via store state
  };

  return (
    <View style={styles.container}>
      <View style={styles.formBox}>
        <Text style={styles.title}>CropVision AI</Text>
        <Text style={styles.subtitle}>Đăng nhập hệ thống phân tích</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            id="login-email"
            style={styles.input}
            placeholder="Nhập email"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            id="login-password"
            style={styles.input}
            placeholder="Nhập mật khẩu"
            placeholderTextColor={COLORS.placeholder}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />
        </View>

        <Pressable
          id="login-submit"
          style={[styles.btn, isLoading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.btnText}>Đăng nhập</Text>
          }
        </Pressable>

        <Pressable
          style={styles.linkRow}
          onPress={() => router.push('/register')}
        >
          <Text style={styles.linkText}>Chưa có tài khoản? <Text style={styles.linkHighlight}>Đăng ký ngay</Text></Text>
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
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  field: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.background,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 13,
    fontSize: FONT_SIZE.md,
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  linkRow: {
    alignItems: 'center',
  },
  linkText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  linkHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
