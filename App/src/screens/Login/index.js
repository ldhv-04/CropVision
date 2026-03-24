import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import styles from './styles';
import { COLORS } from '../../constants/theme';
import { buildApiUrl } from '../../config/api';

export default function LoginScreen({ onNavigate, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Gui thong tin dang nhap va tra ve session user/admin cho App.
  const handleLogin = async () => {
    if (!email || !password) {
      alert('Vui lòng nhập email và mật khẩu.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        onLoginSuccess(data.data);
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
        <Text style={styles.headerText}>Đăng nhập</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập email của bạn"
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
            placeholder="Nhập mật khẩu"
            placeholderTextColor={COLORS.placeholder}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <Pressable>
          <Text style={styles.forgotText}>Quên mật khẩu?</Text>
        </Pressable>

        <Pressable
          style={styles.loginBtn}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.loginBtnText}>Đăng nhập</Text>
          )}
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Chưa có tài khoản?</Text>
          <Pressable onPress={() => onNavigate('register')}>
            <Text style={styles.linkText}>Đăng ký ngay</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
