import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import styles from './styles';
import { COLORS } from '../../constants/theme';

export default function RegisterScreen({ onNavigate }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      alert('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    if (password !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        onNavigate('verifyEmail', { email: email });
      } else {
        alert('Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error(error);
      alert('Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
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
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.registerBtnText}>Đăng ký tài khoản</Text>
          )}
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Đã có tài khoản?</Text>
          <Pressable onPress={() => onNavigate('login')}>
            <Text style={styles.linkText}>Đăng nhập ngay</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}