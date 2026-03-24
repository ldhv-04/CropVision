import React from 'react';
import { Modal, View, Text, Image, Pressable } from 'react-native';
import styles from './styles';
import { resolveAssetUrl } from '../../config/api';

const parseDetections = (detections) => {
  if (!detections) return [];

  if (Array.isArray(detections)) {
    return detections;
  }

  if (typeof detections === 'string') {
    try {
      const parsedDetections = JSON.parse(detections);
      return Array.isArray(parsedDetections) ? parsedDetections : [];
    } catch (error) {
      console.warn('Không parse được detections trong SampleDetailModal:', error);
    }
  }

  return [];
};

const normalizeImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  return resolveAssetUrl(imageUrl);
};

export default function SampleDetailModal({ visible, sample, onClose }) {
  if (!sample) return null;

  const detections = parseDetections(sample.detections);
  const finalImageUrl = normalizeImageUrl(sample.imageUrl || sample.image_url);
  const rawDate = sample.createdAt || sample.created_at;
  const finalDate = rawDate
    ? new Date(rawDate).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Đang cập nhật...';
  const finalLocation = sample.location || 'Chưa lưu vị trí phân tích';

  const bestDetection = detections.reduce((bestMatch, detection) => {
    const parsedConfidence = parseFloat(detection?.confidence);

    if (Number.isNaN(parsedConfidence)) {
      return bestMatch;
    }

    if (!bestMatch || parsedConfidence > bestMatch.confidence) {
      return {
        confidence: parsedConfidence,
        diseaseName: detection.disease_class || detection.class_name || null,
      };
    }

    return bestMatch;
  }, null);

  const fallbackConfidence = parseFloat(sample.confidence);
  const resolvedConfidence = bestDetection?.confidence;
  const finalConfidence = !Number.isNaN(resolvedConfidence)
    ? `${(resolvedConfidence * 100).toFixed(1)}%`
    : !Number.isNaN(fallbackConfidence)
      ? `${(fallbackConfidence * 100).toFixed(1)}%`
      : 'Chưa có dữ liệu độ tin cậy';

  const finalDiseaseName = sample.diseaseName
    || sample.cropType
    || (sample.crop_type && sample.crop_type !== 'unknown' ? sample.crop_type : null)
    || bestDetection?.diseaseName
    || 'Chưa xác định bệnh lý';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Hồ sơ Mẫu vật</Text>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.imageContainer}>
            {finalImageUrl ? (
              <Image
                source={{ uri: finalImageUrl }}
                style={styles.image}
              />
            ) : (
              <View style={[styles.image, { backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#94a3b8' }}>Không tải được ảnh</Text>
              </View>
            )}
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.iconBox}><Text style={styles.iconText}>🦠</Text></View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>Kết quả phân tích YOLOv8</Text>
                <Text style={styles.diseaseValue}>{finalDiseaseName}</Text>
                <Text style={styles.value}>Độ tin cậy: {finalConfidence}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}><Text style={styles.iconText}>🕒</Text></View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>Thời gian thu thập</Text>
                <Text style={styles.value}>{finalDate}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.iconBox}><Text style={styles.iconText}>📍</Text></View>
              <View style={styles.textContainer}>
                <Text style={styles.label}>Vị trí địa lý</Text>
                <Text style={styles.value}>{finalLocation}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
