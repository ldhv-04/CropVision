import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import styles from './styles';
import { COLORS } from '../../constants/theme';

export default function VerifyEmailScreen({ onNavigate, routeParams }) {
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const userEmail = routeParams?.email || '';

  const handleVerify = async () => {
    if (otpCode.length < 6) {
      alert('Vui lòng nhập đủ mã xác thực 6 số.');
      return;
    }

    if (!userEmail) {
      alert('Lỗi dữ liệu: Không tìm thấy email cần xác thực.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:3000/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, otpCode })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        onNavigate('login');
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
        <View style={styles.iconPlaceholder}>
          <Text style={styles.iconText}>OTP</Text>
        </View>

        <Text style={styles.headerText}>Kiểm tra Email</Text>
        <Text style={styles.subtitle}>
          Mã xác thực 6 chữ số đã được tạo cho: {userEmail}. Vui lòng kiểm tra Terminal của máy chủ Node.js để lấy mã.
        </Text>

        <TextInput
          style={styles.otpInput}
          placeholder="------"
          placeholderTextColor={COLORS.placeholder}
          keyboardType="numeric"
          maxLength={6}
          value={otpCode}
          onChangeText={setOtpCode}
        />

        <Pressable 
          style={styles.verifyBtn} 
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.verifyBtnText}>Xác thực tài khoản</Text>
          )}
        </Pressable>
        
        <Pressable style={{ marginTop: 20 }} onPress={() => onNavigate('login')}>
            <Text style={{ color: COLORS.textSecondary }}>Quay lại Đăng nhập</Text>
        </Pressable>
      </View>
    </View>
  );
}