/**
 * index.jsx (Practical Agronomic Intelligence Landing for Mobile)
 *
 * Tối ưu hóa trải nghiệm trên Android/iOS:
 * - Thông điệp thực chứng, rõ ràng, dễ đọc cho mọi lứa tuổi
 * - Số liệu thực tế: 98.4% độ chính xác, 58+ chủng bệnh, cắt giảm 35% chi phí
 * - 3 bước thao tác dễ hiểu
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { landingStyles as styles } from './landingStyles';

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

export default LandingLayout;
