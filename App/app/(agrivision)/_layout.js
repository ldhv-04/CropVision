/**
 * AgriVision Layout — Farmer Mobile App
 *
 * Bottom Tabs navigator for mobile-first UX.
 * Light Mode theme, optimized for outdoor field usage.
 */

import { Tabs } from 'expo-router';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { Redirect } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Platform, useWindowDimensions } from 'react-native';
import { LIGHT_COLORS, SPACING, FONT_SIZE } from '../../src/modules/@core/constants/theme';
import { CameraModal } from '../../src/modules/agrivision/components/CameraModal';
import { useState } from 'react';

// AgrivisionShell — web-only owner shell boundary.
let AgrivisionShell = null;
if (Platform.OS === 'web') {
  AgrivisionShell = require('../../src/modules/agrivision/shell').AgrivisionShell;
}


const C = LIGHT_COLORS;

function CameraButton({ onPress, style }) {
  return (
    <View style={[style, styles.cameraContainer]}>
      <Pressable 
        style={({ pressed }) => [
          styles.cameraBtnOuter,
          pressed && { transform: [{ scale: 0.95 }] }
        ]}
        onPress={onPress}
      >
        <View style={styles.cameraBtnInner}>
          <Text style={styles.cameraBtnEmoji}>📸</Text>
        </View>
      </Pressable>
    </View>
  );
}

export default function AgriVisionLayout() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [modalVisible, setModalVisible] = useState(false);
  const { width } = useWindowDimensions();

  if (!token) return <Redirect href="/welcome" />;
  if (user?.role === 'admin') return <Redirect href="/(station)" />;

  // ── Web/Electron: render Agrivision-owned shell only on desktop screens ──
  if (Platform.OS === 'web' && AgrivisionShell && width > 768) {
    return <AgrivisionShell />;
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: C.surface },
          headerTintColor: C.primary,
          headerTitleStyle: { color: C.textPrimary, fontWeight: '700', fontSize: FONT_SIZE.md },
          tabBarActiveTintColor: C.primary,
          tabBarInactiveTintColor: C.textSecondary,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Trang chủ',
            headerTitle: 'AgriVision 🌾',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏠</Text>,
          }}
        />
        <Tabs.Screen
          name="fields"
          options={{
            title: 'Quản lý',
            headerTitle: 'Quản lý cánh đồng',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🌾</Text>,
          }}
        />
        <Tabs.Screen
          name="camera_placeholder"
          options={{
            title: '',
            headerShown: false,
            tabBarButton: (props) => (
              <CameraButton {...props} onPress={() => setModalVisible(true)} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Trợ lý AI',
            headerTitle: 'Chat với AI',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🤖</Text>,
          }}
        />
        <Tabs.Screen
          name="encyclopedia"
          options={{
            href: null, // Hidden from tab bar — accessed via homepage widget
            headerTitle: 'Bách khoa bệnh',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Cài đặt',
            headerTitle: 'Cài đặt hệ thống',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
          }}
        />
        <Tabs.Screen
          name="diagnosis-result"
          options={{
            href: null, // Hide from tab bar
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="inference"
          options={{
            href: null, // Hide from tab bar
            headerShown: false,
          }}
        />
        {/* Hidden screens: accessible via router.push() only, not as tabs */}
        <Tabs.Screen
          name="field-map"
          options={{
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="fieldsLegacy"
          options={{
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="zone-detail"
          options={{
            href: null,
            headerShown: false,
          }}
        />
        {/* Task 2: Mobile Field Manager — hidden routes */}
        <Tabs.Screen
          name="my-fields"
          options={{
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="field-detail/[fieldId]"
          options={{
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="field-detail/[fieldId]/cultivation/[zoneId]"
          options={{
            href: null,
            headerShown: false,
          }}
        />
      </Tabs>

      <CameraModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 65,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.border,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cameraContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtnOuter: {
    top: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.surface,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  cameraBtnInner: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtnEmoji: {
    fontSize: 24,
    color: '#fff',
  },
});
