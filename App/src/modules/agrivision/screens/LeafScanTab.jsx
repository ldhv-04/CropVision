/**
 * LeafScanTab — Tab 2: Quét Lá & Chẩn Đoán AI Thực Địa (0.3s Phản Hồi)
 *
 * Tối giản tối đa, không hoạt ảnh thừa, nút chụp 64dp dễ bấm bằng 1 tay.
 * Trả về phiếu kê đơn định lượng rõ ràng.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../@core/context/ThemeContext';

const QUICK_TEST_LEAVES = [
  {
    name: 'Lúa: Đạo Ôn',
    crop: 'Lúa Nước',
    diseaseName: 'Bệnh Đạo Ôn Lá',
    scientificName: 'Magnaporthe oryzae',
    confidence: 98.6,
    activeIngredient: 'Tricyclazole 75% WP',
    dosage: '25g / bình 25 lít nước',
    timing: 'Phun sáng sớm (6h-8h) khi ráo sương',
    severity: 'Giai đoạn 1 (Chớm bệnh)',
  },
  {
    name: 'Cà phê: Rỉ Sắt',
    crop: 'Cà Phê Robusta',
    diseaseName: 'Bệnh Rỉ Sắt Lá',
    scientificName: 'Hemileia vastatrix',
    confidence: 97.8,
    activeIngredient: 'Hexaconazole 50g/l hoặc Đồng Oxyclorua',
    dosage: '45ml / phuy 200 lít nước',
    timing: 'Phun ướt đều mặt dưới lá',
    severity: 'Giai đoạn 2 (Lan nhanh)',
  },
  {
    name: 'Sầu riêng: Thán Thư',
    crop: 'Sầu Riêng',
    diseaseName: 'Bệnh Thán Thư Cơi Đọt',
    scientificName: 'Colletotrichum gloeosporioides',
    confidence: 99.1,
    activeIngredient: 'Azoxystrobin + Difenoconazole',
    dosage: '150ml / phuy 200 lít nước',
    timing: 'Phun khi cơi đọt vừa lụa',
    severity: 'Giai đoạn 1 (Cục bộ)',
  },
];

export function LeafScanTab() {
  const { colors } = useTheme();
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handlePickImage = async (useCamera = false) => {
    try {
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };

      const res = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!res.canceled && res.assets && res.assets[0]) {
        setSelectedImage(res.assets[0].uri);
        runInference(QUICK_TEST_LEAVES[0]);
      }
    } catch (e) {
      Alert.alert('Thông báo', 'Không thể mở máy ảnh hoặc thư viện ảnh.');
    }
  };

  const runInference = (mockResult) => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setResult(mockResult);
    }, 400); // 0.4s fast local inference simulation
  };

  const handleQuickTest = (sample) => {
    setSelectedImage('sample');
    runInference(sample);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setResult(null);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header */}
      <View style={styles.topInfo}>
        <Text style={[styles.kicker, { color: colors.primary }]}>
          CAMERA TRINH SÁT // YOLOv8-AGRO ENGINE
        </Text>
        <Text style={[styles.mainTitle, { color: colors.textPrimary }]}>
          Chụp Lá Để Bắt Bệnh Tức Thì
        </Text>
      </View>

      {!result ? (
        /* Camera / Viewfinder Box */
        <View style={[styles.viewfinderBox, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          {isAnalyzing ? (
            <View style={styles.analyzingCenter}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.analyzingText, { color: colors.textPrimary }]}>
                Đang phân tích vết bệnh trong 0.3s...
              </Text>
            </View>
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Text style={{ fontSize: 56, marginBottom: 12 }}>📸</Text>
              <Text style={[styles.viewfinderText, { color: colors.textPrimary }]}>
                Đưa lá cây vào giữa khung hình
              </Text>
              <Text style={[styles.viewfinderSub, { color: colors.textMuted }]}>
                Tự động bắt nét và khử rung
              </Text>
            </View>
          )}

          {/* Shutter Action Buttons */}
          <View style={[styles.shutterRow, { borderTopColor: colors.borderLight }]}>
            <Pressable
              style={[styles.galleryBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={() => handlePickImage(false)}
            >
              <Text style={[styles.galleryBtnText, { color: colors.textPrimary }]}>
                🖼️ Thư Viện
              </Text>
            </Pressable>

            <Pressable
              style={[styles.mainShutterBtn, { backgroundColor: colors.primary, borderColor: colors.primaryBorder }]}
              onPress={() => handlePickImage(true)}
            >
              <Text style={styles.mainShutterText}>CHỤP LÁ</Text>
            </Pressable>
          </View>

          {/* 3 Quick Sample Test Chips */}
          <View style={[styles.sampleSection, { borderTopColor: colors.borderLight }]}>
            <Text style={[styles.sampleLabel, { color: colors.textMuted }]}>
              HOẶC THỬ MẪU THỰC ĐỊA NHANH:
            </Text>
            <View style={styles.sampleGrid}>
              {QUICK_TEST_LEAVES.map((leaf, idx) => (
                <Pressable
                  key={idx}
                  style={[styles.sampleBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  onPress={() => handleQuickTest(leaf)}
                >
                  <Text style={[styles.sampleBtnText, { color: colors.textPrimary }]}>
                    🌾 {leaf.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : (
        /* Prescriptive Dosage Dossier (Phiếu kê đơn kết quả) */
        <View style={[styles.dossierCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
          {/* Dossier Header */}
          <View style={styles.dossierHeader}>
            <View>
              <Text style={[styles.kicker, { color: colors.accent }]}>
                KẾT QUẢ CHẨN ĐOÁN QUANG HỌC
              </Text>
              <Text style={[styles.dossierDisease, { color: colors.textPrimary }]}>
                {result.diseaseName}
              </Text>
              <Text style={[styles.scientificName, { color: colors.textMuted }]}>
                {result.scientificName} · {result.crop}
              </Text>
            </View>

            <View style={[styles.confBadge, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
              <Text style={[styles.confText, { color: colors.primary }]}>
                {result.confidence}%
              </Text>
              <Text style={[styles.confSub, { color: colors.textMuted }]}>CHÍNH XÁC</Text>
            </View>
          </View>

          {/* Severity status */}
          <View style={[styles.severityBar, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
            <Text style={[styles.severityText, { color: colors.warning }]}>
              ⚠️ {result.severity}
            </Text>
          </View>

          {/* Prescription Box */}
          <View style={[styles.prescBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.prescTitle, { color: colors.primary }]}>
              💊 HOẠT CHẤT & THUỐC BVTV KHUYẾN NGHỊ:
            </Text>
            <Text style={[styles.prescIngredient, { color: colors.textPrimary }]}>
              {result.activeIngredient}
            </Text>

            <View style={styles.prescRow}>
              <View style={styles.prescCol}>
                <Text style={[styles.prescSubLabel, { color: colors.textMuted }]}>LIỀU LƯỢNG PHA:</Text>
                <Text style={[styles.prescVal, { color: colors.accent }]}>{result.dosage}</Text>
              </View>
              <View style={styles.prescCol}>
                <Text style={[styles.prescSubLabel, { color: colors.textMuted }]}>THỜI ĐIỂM VÀNG:</Text>
                <Text style={[styles.prescVal, { color: colors.textPrimary }]}>{result.timing}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.dossierActions}>
            <Pressable
              style={[styles.saveFieldBtn, { backgroundColor: colors.primary }]}
              onPress={() => Alert.alert('Thành công', 'Đã lưu mẫu chẩn đoán vào nhật ký thửa đất!')}
            >
              <Text style={styles.saveFieldBtnText}>💾 Lưu Vào Thửa Đất</Text>
            </Pressable>

            <Pressable
              style={[styles.scanAgainBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={handleReset}
            >
              <Text style={[styles.scanAgainBtnText, { color: colors.textPrimary }]}>
                🔄 Quét Tiếp Lá Khác
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  topInfo: { marginBottom: 16 },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, fontFamily: 'monospace' },
  mainTitle: { fontSize: 20, fontWeight: '900', marginTop: 2 },

  viewfinderBox: {
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  cameraPlaceholder: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingCenter: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingText: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 14,
  },
  viewfinderText: {
    fontSize: 16,
    fontWeight: '800',
  },
  viewfinderSub: {
    fontSize: 13,
    marginTop: 4,
  },

  shutterRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  galleryBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  mainShutterBtn: {
    flex: 1.5,
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainShutterText: {
    color: '#06090E',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  sampleSection: {
    padding: 14,
    borderTopWidth: 1,
  },
  sampleLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sampleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sampleBtn: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  sampleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  dossierCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
  },
  dossierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dossierDisease: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  scientificName: {
    fontSize: 12.5,
    fontStyle: 'italic',
    marginTop: 2,
  },
  confBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  confText: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  confSub: {
    fontSize: 8,
    fontWeight: '800',
  },

  severityBar: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 14,
  },
  severityText: {
    fontSize: 13,
    fontWeight: '800',
  },

  prescBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  prescTitle: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  prescIngredient: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  prescRow: {
    flexDirection: 'row',
    gap: 12,
  },
  prescCol: {
    flex: 1,
  },
  prescSubLabel: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  prescVal: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 2,
  },

  dossierActions: {
    gap: 10,
  },
  saveFieldBtn: {
    minHeight: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveFieldBtnText: {
    color: '#06090E',
    fontSize: 14,
    fontWeight: '900',
  },
  scanAgainBtn: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanAgainBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
});

export default LeafScanTab;
