import React from 'react';
import { View, Text, Pressable } from 'react-native';
import styles from './styles';

export default function WelcomeScreen({ navigation }) {
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
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.primaryBtnText}>Đăng nhập</Text>
        </Pressable>
        
        <Pressable 
          style={styles.secondaryBtn} 
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.secondaryBtnText}>Tạo tài khoản mới</Text>
        </Pressable>
      </View>
    </View>
  );
}