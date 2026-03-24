import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Đăng ký tài khoản</Text>

        <TextInput
          style={styles.input}
          placeholder="Họ và tên"
          placeholderTextColor="#94a3b8"
          value={name}
          onChangeText={setName}
        />
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

        <Pressable style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Xác nhận đăng ký</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
          <Text style={styles.linkText}>Đã có tài khoản? Quay lại đăng nhập</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  formContainer: { width: '100%', maxWidth: 400, backgroundColor: '#1e293b', padding: 30, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc', textAlign: 'center', marginBottom: 30 },
  input: { backgroundColor: '#0f172a', color: '#f8fafc', padding: 15, borderRadius: 6, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  button: { backgroundColor: '#0ea5e9', padding: 15, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  linkContainer: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#94a3b8', fontSize: 14 }
});