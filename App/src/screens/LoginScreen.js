import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

export default function LoginScreen({ navigation, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>CropVision AI</Text>
        <Text style={styles.subtitle}>Đăng nhập hệ thống phân tích</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Mật khẩu"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable style={styles.button} onPress={onLogin}>
          <Text style={styles.buttonText}>Đăng nhập</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Register')} style={styles.linkContainer}>
          <Text style={styles.linkText}>Chưa có tài khoản? Đăng ký ngay</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  formContainer: { width: '100%', maxWidth: 400, backgroundColor: '#1e293b', padding: 30, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#22c55e', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#94a3b8', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', padding: 15, borderRadius: 6, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  button: { backgroundColor: '#16a34a', padding: 15, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  linkContainer: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#38bdf8', fontSize: 14 }
});