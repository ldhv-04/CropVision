import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function MobileApp({ onLogout }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CropVision AI</Text>
      <Text style={styles.subtitle}>Chụp ảnh lá cây để phân tích</Text>
      
      <Pressable style={styles.cameraBtn}>
        <Text style={styles.btnText}>Mở Camera</Text>
      </Pressable>

      <Pressable style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#16a34a' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 10, marginBottom: 30 },
  cameraBtn: { backgroundColor: '#22c55e', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, marginBottom: 20 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  logoutBtn: { paddingHorizontal: 20, paddingVertical: 12 },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' }
});