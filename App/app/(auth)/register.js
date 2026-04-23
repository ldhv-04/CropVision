import { useState } from 'react';
import { router } from 'expo-router';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, Alert, Platform } from 'react-native';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/modules/@core/constants/theme';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp!');
      return;
    }

    const result = await register(fullName.trim(), email.trim(), password);
    if (result.success) {
      if (Platform.OS === 'web') {
        alert(result.message);
        router.push({ pathname: '/verify-email', params: { email: email.trim() } });
      } else {
        Alert.alert('Thành công', result.message, [
          { 
            text: 'OK', 
            onPress: () => router.push({ pathname: '/verify-email', params: { email: email.trim() } }) 
          },
        ]);
      }
    } else {
      if (Platform.OS === 'web') {
        alert('Đăng ký thất bại: ' + result.message);
      } else {
        Alert.alert('Đăng ký thất bại', result.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formBox}>
        <Text style={styles.title}>Tạo tài khoản mới</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            id="register-fullname"
            style={styles.input}
            placeholder="Nhập họ và tên"
            placeholderTextColor={COLORS.placeholder}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            id="register-email"
            style={styles.input}
            placeholder="Nhập email hợp lệ"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            id="register-password"
            style={styles.input}
            placeholder="Tạo mật khẩu"
            placeholderTextColor={COLORS.placeholder}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Xác nhận mật khẩu</Text>
          <TextInput
            id="register-confirm-password"
            style={styles.input}
            placeholder="Nhập lại mật khẩu"
            placeholderTextColor={COLORS.placeholder}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <Pressable
          id="register-submit"
          style={[styles.btn, isLoading && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.btnText}>Đăng ký tài khoản</Text>
          }
        </Pressable>

        <Pressable style={styles.linkRow} onPress={() => router.push('/login')}>
          <Text style={styles.linkText}>Đã có tài khoản? <Text style={styles.linkHighlight}>Đăng nhập ngay</Text></Text>
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
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  field: { marginBottom: SPACING.md },
  label: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, marginBottom: SPACING.sm },
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
  btnDisabled: { opacity: 0.6 },
  btnText: { color: COLORS.white, fontSize: FONT_SIZE.md, fontWeight: '700' },
  linkRow: { alignItems: 'center' },
  linkText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  linkHighlight: { color: COLORS.primary, fontWeight: '700' },
});
