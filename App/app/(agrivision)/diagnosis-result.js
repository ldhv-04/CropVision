import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  ActivityIndicator, Pressable, Dimensions, Alert
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { useInferenceStore } from '../../src/modules/inference/store/useInferenceStore';
import { apiRequest } from '../../src/modules/@core/api/apiClient';
import { LIGHT_COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/modules/@core/constants/theme';

const { width } = Dimensions.get('window');
const C = LIGHT_COLORS;

export default function DiagnosisResultScreen() {
  const token = useAuthStore((s) => s.token);
  
  const {
    imageUri,
    selectedAsset,
    detections,
    resultImageBase64,
    isAnalyzing,
    error,
    runInference,
    setSelectedAsset
  } = useInferenceStore();

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [diseaseDetails, setDiseaseDetails] = useState(null);

  // 1. Run inference on mount if an image is selected but not analyzed yet
  useEffect(() => {
    if (selectedAsset && !detections && !isAnalyzing) {
      runInference(token);
    }
  }, [selectedAsset]);

  // 2. Fetch disease details from backend once detections are ready
  useEffect(() => {
    if (detections && detections.length > 0) {
      // Sort detections by confidence and pick the top one
      const topDetection = [...detections].sort((a, b) => b.confidence - a.confidence)[0];
      fetchDiseaseInfo(topDetection.class_name);
    } else {
      setDiseaseDetails(null);
    }
  }, [detections]);

  const fetchDiseaseInfo = async (className) => {
    const detailStart = getNowMs();
    setLoadingDetails(true);
    try {
      const res = await apiRequest(`/api/chat/diseases/class/${className}`, {}, token);
      if (res.success) {
        setDiseaseDetails(res.data);
        logDiagnosisTiming('disease-detail-fetch', {
          totalMs: getNowMs() - detailStart,
          className,
          hasDetails: Boolean(res.data),
        });
      } else {
        console.warn('[DiagnosisResult] Fetch disease info unsuccessful:', res.message);
        logDiagnosisTiming('disease-detail-fetch-unsuccessful', {
          totalMs: getNowMs() - detailStart,
          className,
        });
      }
    } catch (err) {
      console.warn('[DiagnosisResult] Fetch disease info failed:', err.message);
      logDiagnosisTiming('disease-detail-fetch-error', {
        totalMs: getNowMs() - detailStart,
        className,
        message: err?.message,
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Safe back navigation helper
  const handleBackHome = () => {
    // Clear current store state
    setSelectedAsset(null);
    router.replace('/(agrivision)');
  };

  // If no image is selected, direct back to home
  if (!imageUri && !isAnalyzing) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Chưa có hình ảnh nào được chọn.</Text>
        <Pressable style={styles.backBtn} onPress={handleBackHome}>
          <Text style={styles.backBtnText}>Quay lại trang chủ</Text>
        </Pressable>
      </View>
    );
  }

  // Loading State for AI Analysis
  if (isAnalyzing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loaderText}>AI đang phân tích mẫu bệnh...</Text>
        <Text style={styles.loaderSubtext}>YOLOv8 đang rà soát cấu trúc lá cây và nhận diện các mầm bệnh nguy hại</Text>
      </View>
    );
  }

  // Error State
  if (error) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Lỗi phân tích hình ảnh</Text>
        <Text style={styles.errorDesc}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={() => runInference(token)}>
          <Text style={styles.retryBtnText}>Thử lại chẩn đoán</Text>
        </Pressable>
        <Pressable style={styles.backBtn} onPress={handleBackHome}>
          <Text style={styles.backBtnText}>Quay lại trang chủ</Text>
        </Pressable>
      </View>
    );
  }

  const topDetection = detections && detections.length > 0 
    ? [...detections].sort((a, b) => b.confidence - a.confidence)[0]
    : null;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* 1. Header with back option */}
      <View style={styles.header}>
        <Pressable style={styles.backLink} onPress={handleBackHome}>
          <Text style={styles.backLinkText}>← Bảng điều khiển</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Kết quả chẩn đoán</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* 2. Annotated/Selected Image View */}
      <View style={styles.imageCard}>
        {resultImageBase64 ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${resultImageBase64}` }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.imageOverlay}
        />
        <View style={styles.imageMeta}>
          {topDetection ? (
            <View style={[styles.badge, { backgroundColor: C.danger }]}>
              <Text style={styles.badgeText}>PHÁT HIỆN BỆNH</Text>
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: C.success }]}>
              <Text style={styles.badgeText}>KHỎE MẠNH</Text>
            </View>
          )}
          <Text style={styles.imageName} numberOfLines={1}>
            {topDetection ? topDetection.class_name.replace(/_/g, ' ') : 'Mẫu lá khỏe mạnh'}
          </Text>
        </View>
      </View>

      {/* 3. Detailed Diagnosis Info Area */}
      {!topDetection ? (
        // Healthy state details
        <View style={styles.detailsCard}>
          <Text style={styles.healthyTitle}>Chúc mừng! 🌾</Text>
          <Text style={styles.healthyText}>
            Hệ thống trí tuệ nhân tạo CropVision AI không phát hiện bất kỳ bệnh hại hay sâu bệnh nào đáng ngại trên mẫu lá cây này.
          </Text>
          <Text style={styles.healthySubtext}>
            Hãy tiếp tục theo dõi trạm khí hậu, duy trì lượng nước tưới hợp lý và bón phân đúng chu kỳ để cây trồng phát triển tốt nhất.
          </Text>
          <Pressable style={styles.actionButton} onPress={handleBackHome}>
            <Text style={styles.actionButtonText}>Xong</Text>
          </Pressable>
        </View>
      ) : (
        // Disease details state
        <View style={styles.detailsContainer}>
          {/* Main info card */}
          <View style={styles.detailsCard}>
            <View style={styles.diseaseHeader}>
              <Text style={styles.diseaseNameVi}>
                {diseaseDetails ? diseaseDetails.disease_name_vi : topDetection.class_name.replace(/_/g, ' ')}
              </Text>
              {diseaseDetails?.disease_name_en && (
                <Text style={styles.diseaseNameEn}>{diseaseDetails.disease_name_en}</Text>
              )}
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Cây trồng</Text>
                <Text style={styles.metaValue}>{diseaseDetails?.crop_type || 'Không xác định'}</Text>
              </View>
              <View style={[styles.metaItem, { borderLeftWidth: 1, borderLeftColor: C.border }]}>
                <Text style={styles.metaLabel}>Độ tin cậy AI</Text>
                <Text style={[styles.metaValue, { color: C.danger, fontWeight: '700' }]}>
                  {Math.round(topDetection.confidence * 100)}%
                </Text>
              </View>
              <View style={[styles.metaItem, { borderLeftWidth: 1, borderLeftColor: C.border }]}>
                <Text style={styles.metaLabel}>Mức độ nguy hại</Text>
                <Text style={[styles.metaValue, { color: diseaseDetails?.severity === 'High' ? C.danger : C.warning }]}>
                  {diseaseDetails?.severity === 'High' ? 'Nghiêm trọng' : 'Trung bình'}
                </Text>
              </View>
            </View>

            {loadingDetails ? (
              <ActivityIndicator color={C.primary} style={{ marginVertical: 20 }} />
            ) : (
              <>
                <Text style={styles.sectionHeading}>Mô tả chi tiết</Text>
                <Text style={styles.descriptionText}>
                  {diseaseDetails?.description || 'Không có mô tả chi tiết có sẵn trong cơ sở dữ liệu.'}
                </Text>

                {diseaseDetails?.symptoms && diseaseDetails.symptoms.length > 0 && (
                  <>
                    <Text style={styles.sectionHeading}>Triệu chứng nhận biết</Text>
                    {diseaseDetails.symptoms.map((item, idx) => (
                      <Text key={idx} style={styles.bulletItem}>• {item}</Text>
                    ))}
                  </>
                )}

                {diseaseDetails?.causes && diseaseDetails.causes.length > 0 && (
                  <>
                    <Text style={styles.sectionHeading}>Nguyên nhân phát bệnh</Text>
                    {diseaseDetails.causes.map((item, idx) => (
                      <Text key={idx} style={styles.bulletItem}>• {item}</Text>
                    ))}
                  </>
                )}
              </>
            )}
          </View>

          {/* 4. Treatment and prevention section */}
          {!loadingDetails && diseaseDetails && (
            <View style={styles.treatmentContainer}>
              <Text style={styles.mainTitle}>Phác đồ điều trị đề xuất</Text>

              {/* Biological / organic treatment */}
              {diseaseDetails.treatments && diseaseDetails.treatments.length > 0 && (
                <View style={styles.treatmentSection}>
                  <Text style={styles.treatmentTypeTitle}>🌿 Biện pháp cơ học & Sinh học</Text>
                  {diseaseDetails.treatments
                    .filter(t => t.method_type === 'Biological' || t.method_type === 'Cultural')
                    .map((t, idx) => (
                      <View key={idx} style={styles.treatmentCard}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardTitle}>{t.method_name}</Text>
                          <Text style={styles.cardStars}>{'⭐'.repeat(t.effectiveness || 0)}</Text>
                        </View>
                        {t.description && <Text style={styles.cardDesc}>{t.description}</Text>}
                        {t.application_guide && (
                          <Text style={styles.cardGuide}><Text style={{ fontWeight: '600' }}>Hướng dẫn:</Text> {t.application_guide}</Text>
                        )}
                      </View>
                    ))}
                </View>
              )}

              {/* Chemical treatment */}
              {diseaseDetails.treatments && diseaseDetails.treatments.length > 0 && (
                <View style={styles.treatmentSection}>
                  <Text style={styles.treatmentTypeTitle}>🧪 Thuốc bảo vệ thực vật (BVTV)</Text>
                  {diseaseDetails.treatments
                    .filter(t => t.method_type === 'Chemical')
                    .map((t, idx) => (
                      <View key={idx} style={[styles.treatmentCard, { borderLeftColor: C.danger }]}>
                        <View style={styles.cardHeader}>
                          <Text style={styles.cardTitle}>{t.method_name}</Text>
                          <Text style={styles.cardStars}>{'⭐'.repeat(t.effectiveness || 0)}</Text>
                        </View>
                        {t.description && <Text style={styles.cardDesc}>{t.description}</Text>}
                        {t.application_guide && (
                          <Text style={styles.cardGuide}><Text style={{ fontWeight: '600' }}>Hướng dẫn:</Text> {t.application_guide}</Text>
                        )}
                        {t.frequency && (
                          <Text style={styles.cardGuide}><Text style={{ fontWeight: '600' }}>Chu kỳ bón:</Text> {t.frequency}</Text>
                        )}
                      </View>
                    ))}
                </View>
              )}

              {/* Suggested Pesticide Products */}
              {diseaseDetails.pesticides && diseaseDetails.pesticides.length > 0 && (
                <View style={styles.treatmentSection}>
                  <Text style={styles.treatmentTypeTitle}>📦 Thuốc gợi ý trên thị trường</Text>
                  {diseaseDetails.pesticides.map((p, idx) => (
                    <View key={idx} style={styles.pesticideCard}>
                      <View style={styles.pesticideHeader}>
                        <Text style={styles.pesticideName}>{p.trade_name}</Text>
                        <Text style={styles.pesticideActive}>{p.active_ingredient}</Text>
                      </View>
                      <View style={styles.pesticideMetaRow}>
                        {p.dosage && (
                          <Text style={styles.pesticideMeta}><Text style={{ fontWeight: '600' }}>Liều lượng:</Text> {p.dosage}</Text>
                        )}
                        {p.pre_harvest_interval > 0 && (
                          <Text style={[styles.pesticideMeta, { color: C.danger }]}>
                            <Text style={{ fontWeight: '600' }}>Cách ly thu hoạch:</Text> {p.pre_harvest_interval} ngày
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}

          {/* Local expert disclaimer */}
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              ⚠️ Lưu ý: Các đề xuất thuốc bảo vệ thực vật chỉ mang tính chất tham khảo. Luôn tuân thủ quy tắc 4 đúng (đúng thuốc, đúng liều lượng, đúng lúc, đúng cách) và xin tham vấn ý kiến kỹ sư nông nghiệp hoặc cán bộ BVTV địa phương trước khi phun xịt diện rộng.
            </Text>
          </View>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        {topDetection && (
          <Pressable 
            style={[styles.actionButton, { backgroundColor: C.secondary, marginBottom: SPACING.md }]} 
            onPress={() => {
              router.push({
                pathname: '/(agrivision)/chat',
                params: { 
                  initialContext: diseaseDetails ? `Tôi vừa quét một mẫu lá bị bệnh ${diseaseDetails.disease_name_vi}. Bạn có thể cho tôi thêm lời khuyên không?` : `Tôi vừa quét một mẫu lá và phát hiện ${topDetection.class_name}. Bạn có thể tư vấn thêm không?`
                }
              });
            }}
          >
            <Text style={[styles.actionButtonText, { color: C.primary }]}>💬 Hỏi AI về bệnh này</Text>
          </Pressable>
        )}
        <Pressable style={styles.actionButton} onPress={handleBackHome}>
          <Text style={styles.actionButtonText}>Hoàn thành chẩn đoán</Text>
        </Pressable>
      </View>
    </View>
  )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backLink: {
    paddingVertical: 6,
    width: 120,
  },
  backLinkText: {
    color: C.primary,
    fontWeight: '600',
    fontSize: FONT_SIZE.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: C.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: C.background,
  },
  loaderText: {
    marginTop: 16,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: C.textPrimary,
  },
  loaderSubtext: {
    marginTop: 8,
    fontSize: FONT_SIZE.sm,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: C.background,
  },
  fallbackText: {
    color: C.textSecondary,
    fontSize: FONT_SIZE.md,
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 8,
  },
  errorDesc: {
    color: C.danger,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 300,
  },
  retryBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    marginBottom: 12,
    width: 200,
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT_SIZE.md,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    width: 200,
    alignItems: 'center',
  },
  backBtnText: {
    color: C.textPrimary,
    fontWeight: '600',
    fontSize: FONT_SIZE.md,
  },
  imageCard: {
    width: '100%',
    height: 260,
    position: 'relative',
    backgroundColor: C.black,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  imageMeta: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    gap: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  imageName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  detailsContainer: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  detailsCard: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  healthyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: C.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  healthyText: {
    fontSize: 15,
    color: C.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  healthySubtext: {
    fontSize: 13,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  diseaseHeader: {
    marginBottom: 16,
  },
  diseaseNameVi: {
    fontSize: 22,
    fontWeight: '800',
    color: C.textPrimary,
    textTransform: 'capitalize',
  },
  diseaseNameEn: {
    fontSize: 14,
    color: C.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.border,
    paddingVertical: SPACING.md,
    marginBottom: 16,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  metaLabel: {
    fontSize: 10,
    color: C.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    color: C.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: C.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: C.primary,
    paddingLeft: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: C.textSecondary,
  },
  bulletItem: {
    fontSize: 14,
    lineHeight: 22,
    color: C.textSecondary,
    marginBottom: 4,
    paddingLeft: 8,
  },
  treatmentContainer: {
    gap: SPACING.md,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  treatmentSection: {
    gap: SPACING.sm,
  },
  treatmentTypeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.textPrimary,
    marginTop: 8,
  },
  treatmentCard: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: C.border,
    borderLeftWidth: 4,
    borderLeftColor: C.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
    flex: 1,
  },
  cardStars: {
    fontSize: 12,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: C.textSecondary,
    marginBottom: 6,
  },
  cardGuide: {
    fontSize: 13,
    lineHeight: 18,
    color: C.textPrimary,
    marginTop: 4,
  },
  pesticideCard: {
    backgroundColor: C.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  pesticideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  pesticideName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textPrimary,
  },
  pesticideActive: {
    fontSize: 12,
    color: C.textSecondary,
    fontStyle: 'italic',
  },
  pesticideMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  pesticideMeta: {
    fontSize: 12,
    color: C.textSecondary,
  },
  disclaimerBox: {
    backgroundColor: '#fffbeb',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginTop: 8,
  },
  disclaimerText: {
    color: '#b45309',
    fontSize: 12,
    lineHeight: 18,
  },
  buttonRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    width: '100%',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

function getNowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function isDevRuntime() {
  if (typeof __DEV__ !== 'undefined') return Boolean(__DEV__);
  return process.env.NODE_ENV !== 'production';
}

function logDiagnosisTiming(label, metrics) {
  if (!isDevRuntime()) return;
  const rounded = Object.fromEntries(
    Object.entries(metrics).map(([key, value]) => [
      key,
      typeof value === 'number' ? Math.round(value) : value,
    ])
  );
  console.info(`[InferenceTiming] ${label}`, rounded);
}
