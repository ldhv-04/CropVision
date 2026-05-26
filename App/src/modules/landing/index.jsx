/**
 * index.jsx (Premium Landing Layout for Mobile)
 * 
 * Renders a gorgeous, fluid, dark/light-compatible onboarding layout
 * using standard React Native elements to run safely on Android & iOS.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../@core/context/ThemeContext';

const { width } = Dimensions.get('window');

export function LandingLayout() {
  const { colors, isDark } = useTheme();

  // Set the base background color based on theme (dark mode defaults to #050505 for premium glow look)
  const bgMain = isDark ? '#050505' : colors.background;
  const cardBg = isDark ? 'rgba(20, 20, 20, 0.7)' : colors.surface;
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border;
  const textColor = isDark ? '#ffffff' : colors.textPrimary;
  const subTextColor = isDark ? '#a1a1aa' : colors.textSecondary;

  return (
    <ScrollView 
      style={[styles.scrollView, { backgroundColor: bgMain }]} 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Mesh Glow Background */}
      <View style={styles.glowBgContainer}>
        <LinearGradient
          colors={[
            isDark ? 'rgba(74, 222, 128, 0.15)' : 'rgba(44, 94, 67, 0.12)',
            'transparent'
          ]}
          style={styles.glowGrad}
        />
      </View>

      {/* Pill Badge */}
      <View style={[styles.badgeContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
        <View style={[styles.badgeDot, { backgroundColor: colors.primaryGlow || '#4ade80' }]} />
        <Text style={[styles.badgeText, { color: textColor }]}>
          CropVision v2.0 - Kỷ nguyên Nông nghiệp mới
        </Text>
      </View>

      {/* Giant Typography */}
      <View style={styles.headerTextContainer}>
        <Text style={[styles.titleLine, { color: textColor }]}>
          Tương lai của
        </Text>
        <Text style={[styles.titleHighlight, { color: colors.primaryGlow || '#4ade80' }]}>
          Nông Nghiệp Thông Minh.
        </Text>
      </View>

      {/* Subtitle */}
      <Text style={[styles.subtitle, { color: subTextColor }]}>
        Đưa sức mạnh của trí tuệ nhân tạo (YOLO) và vạn vật kết nối (IoT) vào từng luống cây. Phân tích, cảnh báo và tự động hóa trong nháy mắt.
      </Text>

      {/* CTA Buttons */}
      <View style={styles.ctaContainer}>
        <Pressable 
          testID="cta-start"
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: isDark ? '#ffffff' : colors.primary },
            pressed && styles.btnPressed
          ]}
          onPress={() => router.push('/login')}
        >
          <Text style={[styles.primaryBtnText, { color: isDark ? '#000000' : '#ffffff' }]}>
            Bắt đầu miễn phí
          </Text>
        </Pressable>

        <Pressable 
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : colors.border },
            pressed && styles.btnPressed
          ]}
          onPress={() => router.push('/register')}
        >
          <Text style={[styles.secondaryButtonText, { color: textColor }]}>
            Tạo tài khoản mới
          </Text>
        </Pressable>
      </View>

      {/* Floating Dashboard Mockup */}
      <View style={[styles.mockupContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        {/* macOS like window controls */}
        <View style={[styles.mockupHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
          <View style={[styles.windowDot, { backgroundColor: '#ef4444' }]} />
          <View style={[styles.windowDot, { backgroundColor: '#eab308' }]} />
          <View style={[styles.windowDot, { backgroundColor: '#22c55e' }]} />
        </View>
        
        {/* Abstract UI content inside mockup */}
        <View style={styles.mockupBody}>
          <View style={[styles.mockupSidebar, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]} />
          <View style={styles.mockupMain}>
            <View style={styles.mockupWidgets}>
              <View style={[styles.mockupWidget, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]} />
              <View style={[styles.mockupWidget, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]} />
              <View style={[styles.mockupWidget, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]} />
            </View>
            <View style={[styles.mockupChart, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
              <LinearGradient
                colors={[
                  isDark ? 'rgba(74, 222, 128, 0.12)' : 'rgba(44, 94, 67, 0.08)',
                  'transparent'
                ]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0.5, y: 1 }}
                end={{ x: 0.5, y: 0 }}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Feature Cards (Bento-style list) */}
      <View style={styles.featuresSection}>
        <Text style={[styles.featuresTitle, { color: textColor }]}>Tính năng nổi bật</Text>
        
        {/* Card 1 */}
        <View style={[styles.featureCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.surface, borderColor: cardBorder }]}>
          <View style={styles.featureHeader}>
            <Text style={[styles.featureBadge, { color: colors.primaryGlow || '#4ade80', backgroundColor: isDark ? 'rgba(74, 222, 128, 0.1)' : 'rgba(44, 94, 67, 0.1)' }]}>
              AI Detection
            </Text>
          </View>
          <Text style={[styles.featureCardTitle, { color: textColor }]}>Nhận diện YOLOv8</Text>
          <Text style={[styles.featureCardDesc, { color: subTextColor }]}>
            Phát hiện tức thì các loại bệnh và sâu hại trên lá cây qua camera với độ chính xác cao.
          </Text>
        </View>

        {/* Card 2 */}
        <View style={[styles.featureCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.surface, borderColor: cardBorder }]}>
          <View style={styles.featureHeader}>
            <Text style={[styles.featureBadge, { color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
              IoT Monitoring
            </Text>
          </View>
          <Text style={[styles.featureCardTitle, { color: textColor }]}>Giám sát IoT thời gian thực</Text>
          <Text style={[styles.featureCardDesc, { color: subTextColor }]}>
            Kết nối và hiển thị dữ liệu đo cảm biến từ các trạm vi khí hậu ngoài đồng ruộng trực tiếp.
          </Text>
        </View>

        {/* Card 3 */}
        <View style={[styles.featureCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : colors.surface, borderColor: cardBorder }]}>
          <View style={styles.featureHeader}>
            <Text style={[styles.featureBadge, { color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              Analytics
            </Text>
          </View>
          <Text style={[styles.featureCardTitle, { color: textColor }]}>Thống kê & Cảnh báo</Text>
          <Text style={[styles.featureCardDesc, { color: subTextColor }]}>
            Hệ thống đồ thị trực quan, cảnh báo sớm các nguy cơ biến đổi thời tiết hoặc mầm bệnh phát sinh.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: isDark ? '#52525b' : colors.textMuted }]}>
          © 2026 CropVision AI. Bảo lưu mọi quyền.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  glowBgContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    overflow: 'hidden',
  },
  glowGrad: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 99,
    borderWidth: 1,
    marginBottom: 32,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerTextContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleLine: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 38,
  },
  titleHighlight: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 38,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 40,
    fontWeight: '400',
  },
  ctaContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    marginBottom: 50,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  mockupContainer: {
    width: '100%',
    maxWidth: 360,
    height: 220,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 8,
  },
  mockupHeader: {
    flexDirection: 'row',
    gap: 6,
    padding: 12,
    borderBottomWidth: 1,
  },
  windowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mockupBody: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    gap: 12,
  },
  mockupSidebar: {
    width: 60,
    height: '100%',
    borderRadius: 8,
  },
  mockupMain: {
    flex: 1,
    gap: 12,
  },
  mockupWidgets: {
    flexDirection: 'row',
    gap: 8,
    height: 40,
  },
  mockupWidget: {
    flex: 1,
    borderRadius: 6,
  },
  mockupChart: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  featuresSection: {
    width: '100%',
    maxWidth: 340,
    gap: 16,
    marginBottom: 50,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  featureHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  featureBadge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  featureCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  featureCardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 11,
  },
});
