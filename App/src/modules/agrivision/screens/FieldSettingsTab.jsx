/**
 * FieldSettingsTab — Tab 5: Cài Đặt Tương Phản Màu Sắc & Tài Khoản
 *
 * Cho phép nông dân tùy chọn chế độ hiển thị phù hợp với điều kiện thực địa
 * (Nắng gắt ngoài đồng / Tối OLED tiết kiệm pin / Tự nhiên dịu mát).
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../@core/context/ThemeContext';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { THEME_MODES, MOBILE_PALETTES } from '../constants/mobileTheme';

export function FieldSettingsTab() {
  const { colors, themeMode, setThemeMode } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bác có chắc chắn muốn đăng xuất tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/welcome');
        },
      },
    ]);
  };

  const themeOptions = [
    {
      id: THEME_MODES.SUNLIGHT,
      name: 'Chế Độ Nắng Gắt (Khuyên dùng ngoài trời)',
      icon: '☀️',
      desc: 'Nền trắng tuyết, tương phản đen-trắng tuyệt đối chống chói mắt dưới ánh nắng 12h trưa.',
      badge: 'CHỐNG CHÓI',
    },
    {
      id: THEME_MODES.DARK,
      name: 'Chế Độ Tối OLED (Tiết kiệm pin & Mát máy)',
      icon: '🌑',
      desc: 'Nền đen sâu obsidian, giảm tối đa nhiệt độ chip xử lý và mức ngốn pin màn hình.',
      badge: 'TIẾT KIỆM PIN',
    },
    {
      id: THEME_MODES.NATURAL,
      name: 'Chế Độ Tự Nhiên (Xem trong nhà)',
      icon: '🌿',
      desc: 'Sắc xanh nông nghiệp nhẹ nhàng, dịu mắt khi nghỉ ngơi hoặc xem báo cáo trong nhà.',
      badge: 'DỊU MẮT',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* User Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
        <View style={styles.profileRow}>
          <View style={[styles.avatarBox, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
            <Text style={{ fontSize: 24 }}>👨‍🌾</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>
              {user?.fullName || user?.name || 'Chủ Nông Hộ'}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
              {user?.email || 'nongdan@cropvision.local'} · Nông Hộ Thực Địa
            </Text>
          </View>
        </View>
      </View>

      {/* Contrast Mode Selector Section */}
      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          🎨 Chế Độ Tương Phản Màn Hình
        </Text>
        <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
          Tự động điều chỉnh để nhìn rõ nhất dưới mọi điều kiện ánh sáng
        </Text>
      </View>

      <View style={styles.themeList}>
        {themeOptions.map((opt) => {
          const isSelected = themeMode === opt.id;
          return (
            <Pressable
              key={opt.id}
              style={[
                styles.themeCard,
                {
                  backgroundColor: isSelected ? colors.primaryBg : colors.surfaceCard,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setThemeMode(opt.id)}
            >
              <View style={styles.themeHeader}>
                <View style={styles.themeTitleRow}>
                  <Text style={styles.themeIcon}>{opt.icon}</Text>
                  <Text style={[styles.themeName, { color: colors.textPrimary }]}>
                    {opt.name}
                  </Text>
                </View>

                <View style={[styles.badge, { backgroundColor: isSelected ? colors.primary : colors.surfaceElevated, borderColor: colors.border }]}>
                  <Text style={[styles.badgeText, { color: isSelected ? '#06090E' : colors.textMuted }]}>
                    {isSelected ? '✓ ĐANG CHỌN' : opt.badge}
                  </Text>
                </View>
              </View>

              <Text style={[styles.themeDesc, { color: colors.textSecondary }]}>
                {opt.desc}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Offline Storage Status */}
      <View style={[styles.offlineCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
        <Text style={[styles.offlineTitle, { color: colors.accent }]}>
          💾 DỮ LIỆU NGOẠI TUYẾN TRÊN MÁY
        </Text>
        <View style={styles.offlineRow}>
          <Text style={[styles.offlineItem, { color: colors.textPrimary }]}>
            ● Sổ tay bệnh học: <Text style={{ fontWeight: '900' }}>58 chủng bệnh</Text>
          </Text>
          <Text style={[styles.offlineItem, { color: colors.textPrimary }]}>
            ● Thửa đất đã lưu: <Text style={{ fontWeight: '900' }}>4 khu rẫy</Text>
          </Text>
        </View>
      </View>

      {/* Logout Action */}
      <Pressable
        style={[styles.logoutBtn, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]}
        onPress={handleLogout}
      >
        <Text style={[styles.logoutText, { color: colors.danger }]}>
          🚪 Đăng Xuất Khỏi Thiết Bị
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  profileCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 17,
    fontWeight: '900',
  },
  profileEmail: {
    fontSize: 12.5,
    marginTop: 2,
  },

  sectionHeading: { marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '900' },
  sectionSub: { fontSize: 12, marginTop: 2 },

  themeList: { gap: 12, marginBottom: 20 },
  themeCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 14,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  themeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  themeIcon: { fontSize: 20 },
  themeName: { fontSize: 14, fontWeight: '900' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  badgeText: { fontSize: 9.5, fontWeight: '900' },
  themeDesc: { fontSize: 12.5, lineHeight: 18 },

  offlineCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 24,
  },
  offlineTitle: { fontSize: 10.5, fontWeight: '900', letterSpacing: 0.5, marginBottom: 8 },
  offlineRow: { gap: 4 },
  offlineItem: { fontSize: 13 },

  logoutBtn: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '900',
  },
});

export default FieldSettingsTab;
