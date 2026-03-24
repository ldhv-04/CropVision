import React from 'react';
import { View, Text, Pressable } from 'react-native';
import styles from './styles';

export default function WelcomeScreen({ onNavigate }) {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.title}>CropVision AI</Text>
        <Text style={styles.subtitle}>
          Hệ thống nhận diện bệnh lý nông nghiệp độ chính xác cao dựa trên kiến trúc YOLOv8. 
          Phân tích nhanh chóng, lưu trữ an toàn.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable 
          style={styles.primaryBtn} 
          onPress={() => onNavigate('login')}
        >
          <Text style={styles.primaryBtnText}>Đăng nhập</Text>
        </Pressable>
        
        <Pressable 
          style={styles.secondaryBtn} 
          onPress={() => onNavigate('register')}
        >
          <Text style={styles.secondaryBtnText}>Tạo tài khoản mới</Text>
        </Pressable>
      </View>
    </View>
  );
}