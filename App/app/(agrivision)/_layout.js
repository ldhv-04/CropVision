/**
 * AgriVision Layout — Farmer Mobile App (5 Field-First Tabs)
 *
 * 1. index.js              🌾 Vườn của tôi (Khởi động mặc định)
 * 2. camera_placeholder.js 📸 Quét bệnh (Chẩn đoán quang học)
 * 3. encyclopedia.js       📖 Sổ tay bệnh (Tra cứu 58+ bệnh hại)
 * 4. chat.js               🤖 Trợ lý AI (Hỏi đáp nông học)
 * 5. settings.js           ⚙️ Cài đặt (Đổi 3 chế độ tương phản màu sắc)
 */

import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { useTheme } from '../../src/modules/@core/context/ThemeContext';

// AgrivisionShell for desktop web browser view
let AgrivisionShell = null;
if (Platform.OS === 'web') {
  try {
    AgrivisionShell = require('../../src/modules/agrivision/shell').AgrivisionShell;
  } catch (_) {}
}

export default function AgriVisionLayout() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  if (!token) return <Redirect href="/welcome" />;
  if (user?.role === 'admin') return <Redirect href="/(station)" />;

  if (Platform.OS === 'web' && AgrivisionShell && width > 768) {
    return <AgrivisionShell />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surfaceCard,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: colors.textPrimary,
          fontWeight: '900',
          fontSize: 17,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 1.5,
          borderTopColor: colors.tabBarBorder,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
        },
      }}
    >
      {/* Tab 1: Màn hình khởi động mặc định */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Vườn của tôi',
          headerTitle: '🌾 Vườn Của Tôi',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🌾</Text>,
        }}
      />

      {/* Tab 2: Quét lá camera */}
      <Tabs.Screen
        name="camera_placeholder"
        options={{
          title: 'Quét bệnh',
          headerTitle: '📸 Quét Bệnh Quang Học',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📸</Text>,
        }}
      />

      {/* Tab 3: Sổ tay bệnh hại */}
      <Tabs.Screen
        name="encyclopedia"
        options={{
          title: 'Sổ tay',
          headerTitle: '📖 Sổ Tay Bệnh Hại',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>📖</Text>,
        }}
      />

      {/* Tab 4: Trợ lý AI nông học */}
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Trợ lý AI',
          headerTitle: '🤖 Trợ Lý Bác Sĩ Cây',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🤖</Text>,
        }}
      />

      {/* Tab 5: Cài đặt tương phản & tài khoản */}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          headerTitle: '⚙️ Cài Đặt & Màn Hình',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>⚙️</Text>,
        }}
      />

      {/* Hidden Screens */}
      <Tabs.Screen name="fields" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="diagnosis-result" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="inference" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="field-map" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="fieldsLegacy" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="zone-detail" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="my-fields" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="field-detail/[fieldId]" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="field-detail/[fieldId]/cultivation/[zoneId]" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
