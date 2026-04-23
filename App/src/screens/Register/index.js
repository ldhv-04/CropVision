import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import styles from './styles';
import { COLORS } from '../../constants/theme';
import { useAuthStore } from '../../modules/@core/auth/useAuthStore';

export default function RegisterScreen({ navigation }) {
  const { register, isLoading: authLoading } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      alert('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    const result = await register(fullName, email, password);
    
    if (result.success) {
      alert(result.message);
      navigation.navigate('VerifyEmail', { email });
    } else {
      alert('Lỗi: ' + result.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formBox}>
        <Text style={styles.headerText}>Tạo tài khoản mới</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Họ và tên</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập họ và tên"
            placeholderTextColor={COLORS.placeholder}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập email hợp lệ"
            placeholderTextColor={COLORS.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Tạo mật khẩu"
            placeholderTextColor={COLORS.placeholder}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Xác nhận mật khẩu</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập lại mật khẩu"
            placeholderTextColor={COLORS.placeholder}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <Pressable 
          style={styles.registerBtn} 
          onPress={handleRegister}
          disabled={authLoading}
        >
          {authLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.registerBtnText}>Đăng ký tài khoản</Text>
          )}
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Đã có tài khoản?</Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Đăng nhập ngay</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
