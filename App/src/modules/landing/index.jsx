/**
 * index.jsx (Practical Agronomic Intelligence Landing for Mobile)
 *
 * Tối ưu hóa trải nghiệm trên Android/iOS:
 * - Thông điệp thực chứng, rõ ràng, dễ đọc cho mọi lứa tuổi
 * - Số liệu thực tế: 98.4% độ chính xác, 58+ chủng bệnh, cắt giảm 35% chi phí
 * - 3 bước thao tác dễ hiểu
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const SAMPLE_CASES = [
  {
    crop: 'Lúa Nước',
    disease: 'Bệnh Đạo Ôn Lá',
    conf: '98.6%',
    treatment: 'Tricyclazole 75% WP (25g/bình 25L)',
    timing: 'Phun sáng sớm 6h-8h hoặc chiều mát',
  },
  {
    crop: 'Cà Phê',
    disease: 'Bệnh Rỉ Sắt Lá',
    conf: '97.8%',
    treatment: 'Hexaconazole 50g/l (45ml/phuy 200L)',
    timing: 'Phun tập trung mặt dưới lá',
  },
  {
    crop: 'Sầu Riêng',
    disease: 'Bệnh Thán Thư',
    conf: '99.1%',
    treatment: 'Azoxystrobin + Difenoconazole',
    timing: 'Phun khi cơi đọt vừa lụa',
  },
];

export function LandingLayout() {
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);
  const currentCase = SAMPLE_CASES[activeCaseIdx];

  return (
    <ScrollView 
      style={styles.scrollView} 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Brand Header */}
      <View style={styles.topBrandRow}>
        <View style={styles.brandBadge}>
          <Text style={{ fontSize: 18 }}>🌿</Text>
          <View>
            <Text style={styles.brandTitle}>CROPVISION</Text>
            <Text style={styles.brandSub}>AI NÔNG NGHIỆP THỰC CHỨNG</Text>
          </View>
        </View>
        <Pressable 
          style={styles.navLoginBtn}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.navLoginText}>Đăng nhập</Text>
        </Pressable>
      </View>

      {/* Main Headline */}
      <View style={styles.heroBlock}>
        <View style={styles.tagPill}>
          <View style={styles.tagDot} />
          <Text style={styles.tagText}>CHUẨN HÓA NÔNG HỌC 2026</Text>
        </View>

        <Text style={styles.mainHeading}>
          Bắt Đúng Bệnh Cây Trong <Text style={styles.greenText}>0.3 Giây.</Text>
        </Text>
        <Text style={styles.subHeadingLine}>
          Cắt Giảm 35% Chi Phí Phân Thuốc.
        </Text>

        <Text style={styles.heroDesc}>
          Không còn đoán mò dịch hại. Quét lá qua camera điện thoại, nhận diện bệnh tức thì và chỉ định đúng loại thuốc với liều lượng chuẩn xác.
        </Text>
      </View>

      {/* 4 Proof Metrics */}
      <View style={styles.metricsGrid}>
        {[
          { num: '98.4%', label: 'Độ chính xác AI', sub: 'YOLOv8-Agro' },
          { num: '58+', label: 'Chủng bệnh nhiệt đới', sub: 'Lúa, cà phê, sầu riêng' },
          { num: '35%', label: 'Tiết kiệm chi phí', sub: 'Khoanh vùng điểm nóng' },
          { num: '0.3s', label: 'Tốc độ phản hồi', sub: 'Chạy cả khi mất mạng' },
        ].map((m, i) => (
          <View key={i} style={styles.metricCard}>
            <Text style={styles.metricNum}>{m.num}</Text>
            <Text style={styles.metricLabel}>{m.label}</Text>
            <Text style={styles.metricSub}>{m.sub}</Text>
          </View>
        ))}
      </View>

      {/* Primary Action Buttons */}
      <View style={styles.actionRow}>
        <Pressable 
          testID="cta-start"
          style={({ pressed }) => [styles.primaryCta, pressed && styles.btnPressed]}
          onPress={() => router.push('/register')}
        >
          <Text style={styles.primaryCtaText}>⚡ Bắt Đầu Khảo Sát Ngay</Text>
        </Pressable>

        <Pressable 
          style={({ pressed }) => [styles.secondaryCta, pressed && styles.btnPressed]}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.secondaryCtaText}>🔐 Đăng Nhập Trạm Station</Text>
        </Pressable>
      </View>

      {/* Interactive Mobile Case Preview */}
      <View style={styles.caseContainer}>
        <View style={styles.caseHeader}>
          <Text style={styles.caseKicker}>MẪU CHẨN ĐOÁN THỰC ĐỊA</Text>
          <View style={styles.tabRow}>
            {SAMPLE_CASES.map((c, i) => (
              <Pressable
                key={i}
                style={[styles.caseTab, activeCaseIdx === i && styles.caseTabActive]}
                onPress={() => setActiveCaseIdx(i)}
              >
                <Text style={[styles.caseTabText, activeCaseIdx === i && styles.caseTabTextActive]}>
                  {c.crop}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.caseCard}>
          <View style={styles.caseRowBetween}>
            <Text style={styles.diseaseName}>{currentCase.disease}</Text>
            <Text style={styles.confBadge}>{currentCase.conf} CHÍNH XÁC</Text>
          </View>

          <View style={styles.prescBox}>
            <Text style={styles.prescLabel}>💊 PHÁC ĐỒ HOẠT CHẤT & LIỀU LƯỢNG:</Text>
            <Text style={styles.prescValue}>{currentCase.treatment}</Text>
            <Text style={styles.prescTiming}>🕒 {currentCase.timing}</Text>
          </View>
        </View>
      </View>

      {/* 3 Step Practical Workflow */}
      <View style={styles.workflowSection}>
        <Text style={styles.sectionTitle}>3 Bước Vận Hành Đơn Giản</Text>
        <Text style={styles.sectionDesc}>Thiết kế tối ưu để người lớn tuổi và nông dân thao tác thành thạo ngay.</Text>

        {[
          { step: '01', icon: '📸', title: 'Chụp ảnh chiếc lá có biểu hiện bệnh', desc: 'Dùng bất kỳ điện thoại thông minh nào, tự động lấy nét và khử rung.' },
          { step: '02', icon: '⚡', title: 'Nhận ngay tên bệnh & đơn thuốc', desc: 'AI khoanh vùng nấm bệnh trong 0.3 giây, hướng dẫn liều pha chuẩn xác.' },
          { step: '03', icon: '🗺️', title: 'Khoanh vùng xử lý trên bản đồ', desc: 'Chỉ xịt đúng luống bị nhiễm thay vì phun bừa bãi toàn bộ rẫy vườn.' },
        ].map((s, i) => (
          <View key={i} style={styles.stepCard}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepIcon}>{s.icon}</Text>
              <Text style={styles.stepBadge}>BƯỚC {s.step}</Text>
            </View>
            <Text style={styles.stepTitle}>{s.title}</Text>
            <Text style={styles.stepDesc}>{s.desc}</Text>
          </View>
        ))}
      </View>

      {/* Offline & Trust Guarantee */}
      <View style={styles.trustSection}>
        <Text style={styles.trustTitle}>📶 Hoạt Động Mượt Cả Khi Mất Sóng</Text>
        <Text style={styles.trustDesc}>
          Mô hình AI nhúng trực tiếp trên ứng dụng. Bạn có thể đứng giữa rẫy xa không có 4G/Wifi vẫn chụp và nhận diện bệnh bình thường.
        </Text>
        <Text style={styles.trustSub}>
          🔒 100% dữ liệu nông trường được bảo mật & thuộc quyền sở hữu của bạn.
        </Text>
      </View>

      {/* Bottom Footer */}
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>© 2026 CropVision AI · Chuẩn hóa Nông học Thực chứng</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: '#06090E' },
  container: { padding: 20, paddingBottom: 48 },
  topBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1B2537',
    marginBottom: 24,
  },
  brandBadge: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandTitle: { fontSize: 16, fontWeight: '900', color: '#F8FAFC', letterSpacing: 0.5 },
  brandSub: { fontSize: 8.5, color: '#00F5A0', fontWeight: '800' },
  navLoginBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1B2537',
  },
  navLoginText: { color: '#F8FAFC', fontSize: 12, fontWeight: '700' },

  heroBlock: { alignItems: 'center', textAlign: 'center', marginBottom: 24 },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 245, 160, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 160, 0.3)',
    marginBottom: 16,
  },
  tagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00F5A0' },
  tagText: { color: '#00F5A0', fontSize: 10, fontWeight: '800' },
  mainHeading: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F8FAFC',
    textAlign: 'center',
    lineHeight: 34,
  },
  greenText: { color: '#00F5A0' },
  subHeadingLine: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  heroDesc: {
    fontSize: 13.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },

  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 60) / 2,
    backgroundColor: '#0D1320',
    borderWidth: 1,
    borderColor: '#1B2537',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  metricNum: { fontSize: 22, fontWeight: '900', color: '#00F5A0' },
  metricLabel: { fontSize: 11, fontWeight: '700', color: '#F8FAFC', marginTop: 2 },
  metricSub: { fontSize: 9.5, color: '#64748B', marginTop: 1 },

  actionRow: { gap: 10, marginBottom: 28 },
  primaryCta: {
    backgroundColor: '#00F5A0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryCtaText: { color: '#06090E', fontSize: 14, fontWeight: '900' },
  secondaryCta: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryCtaText: { color: '#F8FAFC', fontSize: 13, fontWeight: '700' },
  btnPressed: { opacity: 0.8 },

  caseContainer: {
    backgroundColor: '#0D1320',
    borderWidth: 1,
    borderColor: '#1B2537',
    borderRadius: 10,
    padding: 16,
    marginBottom: 28,
  },
  caseHeader: { marginBottom: 12 },
  caseKicker: { fontSize: 9.5, fontWeight: '800', color: '#00D2FF', marginBottom: 8 },
  tabRow: { flexDirection: 'row', gap: 6 },
  caseTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1B2537',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  caseTabActive: { borderColor: '#00F5A0', backgroundColor: 'rgba(0, 245, 160, 0.1)' },
  caseTabText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  caseTabTextActive: { color: '#00F5A0', fontWeight: '800' },

  caseCard: {
    backgroundColor: '#06090E',
    borderRadius: 6,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1B2537',
  },
  caseRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  diseaseName: { fontSize: 15, fontWeight: '800', color: '#F8FAFC' },
  confBadge: { fontSize: 9, fontWeight: '800', color: '#00F5A0', backgroundColor: 'rgba(0, 245, 160, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  prescBox: {
    backgroundColor: 'rgba(0, 245, 160, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 245, 160, 0.15)',
    borderRadius: 6,
    padding: 10,
  },
  prescLabel: { fontSize: 9, fontWeight: '800', color: '#00F5A0', marginBottom: 4 },
  prescValue: { fontSize: 12, fontWeight: '700', color: '#F8FAFC', marginBottom: 4 },
  prescTiming: { fontSize: 10.5, color: '#94A3B8' },

  workflowSection: { marginBottom: 28 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', marginBottom: 6 },
  sectionDesc: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginBottom: 16 },
  stepCard: {
    backgroundColor: '#0D1320',
    borderWidth: 1,
    borderColor: '#1B2537',
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  stepIcon: { fontSize: 22 },
  stepBadge: { fontSize: 10, fontWeight: '800', color: '#00F5A0' },
  stepTitle: { fontSize: 14, fontWeight: '700', color: '#F8FAFC', marginBottom: 6 },
  stepDesc: { fontSize: 12, color: '#94A3B8', lineHeight: 18 },

  trustSection: {
    backgroundColor: 'rgba(0, 210, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.2)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  trustTitle: { fontSize: 14, fontWeight: '800', color: '#00D2FF', marginBottom: 6 },
  trustDesc: { fontSize: 12, color: '#94A3B8', lineHeight: 18, marginBottom: 8 },
  trustSub: { fontSize: 11, color: '#F8FAFC', fontWeight: '600' },

  footerRow: { alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#1B2537' },
  footerText: { fontSize: 10, color: '#64748B' },
});

export default LandingLayout;
