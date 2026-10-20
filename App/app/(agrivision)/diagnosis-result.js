/**
 * DiagnosisResultScreen — AI Leaf Disease Diagnosis Result Display
 * Strictly adheres to Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, Pressable } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { useInferenceStore } from '../../src/modules/inference/store/useInferenceStore';
import { apiRequest } from '../../src/modules/@core/api/apiClient';
import { InferenceDebugPanel } from '../../src/modules/inference/components/InferenceDebugPanel';
import { markLatestInferenceDebugEvent } from '../../src/modules/inference/debug/inferenceDebug';
import { DiseaseDetailSection } from '../../src/modules/inference/components/DiseaseDetailSection';
import { styles, getNowMs, logDiagnosisTiming } from '../../src/modules/inference/components/DiagnosisResultStyles';
import { LIGHT_COLORS } from '../../src/modules/@core/constants/theme';

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
    setSelectedAsset,
  } = useInferenceStore();

  const [loadingDetails, setLoadingDetails] = useState(false);
  const [diseaseDetails, setDiseaseDetails] = useState(null);

  useEffect(() => {
    markLatestInferenceDebugEvent('screen-mounted', {
      screen: 'diagnosis-result',
      hasSelectedAsset: Boolean(selectedAsset),
      hasImageUri: Boolean(imageUri),
    });
  }, []);

  useEffect(() => {
    if (selectedAsset && !detections && !isAnalyzing) {
      runInference(token, null, null, {
        source: 'diagnosis-result',
        trigger: 'auto-run',
        imageSource: 'store',
      });
    }
  }, [selectedAsset]);

  useEffect(() => {
    if (detections && detections.length > 0) {
      const top = [...detections].sort((a, b) => b.confidence - a.confidence)[0];
      fetchDiseaseInfo(top.class_name);
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
        logDiagnosisTiming('disease-detail-fetch', { totalMs: getNowMs() - detailStart, className });
      }
    } catch (err) {
      console.warn('[DiagnosisResult] Fetch disease info failed:', err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleBackHome = () => {
    setSelectedAsset(null);
    router.replace('/(agrivision)');
  };

  if (!imageUri && !isAnalyzing) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>Chưa có hình ảnh nào được chọn.</Text>
        <Pressable style={styles.backBtn} onPress={handleBackHome}>
          <Text style={styles.backBtnText}>Quay lại trang chủ</Text>
        </Pressable>
        <InferenceDebugPanel compact />
      </View>
    );
  }

  if (isAnalyzing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loaderText}>AI đang phân tích mẫu bệnh...</Text>
        <Text style={styles.loaderSubtext}>YOLOv8 đang rà soát cấu trúc lá cây và nhận diện mầm bệnh</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorTitle}>Lỗi phân tích hình ảnh</Text>
        <Text style={styles.errorDesc}>{error}</Text>
        <Pressable
          style={styles.retryBtn}
          onPress={() => runInference(token, null, null, { source: 'diagnosis-result', trigger: 'retry-button', imageSource: 'store' })}
        >
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
      <View style={styles.header}>
        <Pressable style={styles.backLink} onPress={handleBackHome}>
          <Text style={styles.backLinkText}>← Bảng điều khiển</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Kết quả chẩn đoán</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.imageCard}>
        {resultImageBase64 ? (
          <Image source={{ uri: `data:image/jpeg;base64,${resultImageBase64}` }} style={styles.image} resizeMode="cover" />
        ) : (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.imageOverlay} />
        <View style={styles.imageMeta}>
          <View style={[styles.badge, { backgroundColor: topDetection ? C.danger : C.primary }]}>
            <Text style={styles.badgeText}>{topDetection ? 'PHÁT HIỆN BỆNH' : 'KHỎE MẠNH'}</Text>
          </View>
          <Text style={styles.imageName}>
            {topDetection ? (diseaseDetails?.disease_name_vi || topDetection.class_name.replace(/_/g, ' ')) : 'Cây sinh trưởng bình thường'}
          </Text>
        </View>
      </View>

      {topDetection ? (
        <DiseaseDetailSection
          diseaseDetails={diseaseDetails}
          topDetection={topDetection}
          loadingDetails={loadingDetails}
          onComplete={handleBackHome}
        />
      ) : (
        <View style={styles.detailsContainer}>
          <View style={styles.detailsCard}>
            <Text style={styles.healthyTitle}>Chúc mừng! 🌾</Text>
            <Text style={styles.healthyText}>Không phát hiện bất kỳ bệnh hại nào trên mẫu lá cây này.</Text>
            <Text style={styles.healthySubtext}>Tiếp tục duy trì lượng nước tưới hợp lý và bón phân đúng chu kỳ.</Text>
            <Pressable style={styles.actionButton} onPress={handleBackHome}>
              <Text style={styles.actionButtonText}>Xong</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
