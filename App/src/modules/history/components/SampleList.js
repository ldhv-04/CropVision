import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, Pressable, useWindowDimensions } from 'react-native';
import { COLORS } from '../../@core/constants/theme';
import styles from './styles';
import { resolveAssetUrl, apiRequest } from '../../@core/api/apiClient';
import { ENDPOINTS } from '../../@core/api/endpoints';
import SampleDetailModal from './SampleDetailModal';

export default function SampleList({ authToken, currentUser }) {
  const { width } = useWindowDimensions();
  const [samples, setSamples] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSample, setSelectedSample] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [authToken, currentUser?.role]);

  const numColumns = width < 720 ? 1 : width < 1120 ? 2 : 3;
  const cardMaxWidth = numColumns === 1 ? '100%' : numColumns === 2 ? '48%' : '31%';

  const fetchHistory = async () => {
    if (!authToken) return;

    try {
      const data = await apiRequest(ENDPOINTS.inference.samples, {}, authToken);

      if (data.success) {
        setSamples(data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch sử:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleCardPress = (item) => {
    setSelectedSample(item);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => {
    const detections = typeof item.detections === 'string'
      ? JSON.parse(item.detections)
      : item.detections;

    const diseaseCount = detections.length;
    const ownerLabel = item.owner_email || currentUser?.email || 'Không rõ chủ sở hữu';

    return (
      <Pressable
        style={({ pressed, hovered }) => [
          styles.card,
          { maxWidth: cardMaxWidth },
          hovered && { transform: [{ scale: 1.02 }], boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        ]}
        onPress={() => handleCardPress(item)}
      >
        <Image
          source={{ uri: resolveAssetUrl(item.image_url) }}
          style={styles.thumbnailImage}
          resizeMode="cover"
        />

        <View style={styles.cardBody}>
          <Text style={styles.sampleName} numberOfLines={1} ellipsizeMode="tail">
            {item.sample_name}
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày quét:</Text>
            <Text style={styles.infoValue}>{formatDate(item.created_at)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Số vết bệnh:</Text>
            <Text style={diseaseCount > 0 ? styles.diseaseValue : styles.infoValue}>
              {diseaseCount} phát hiện
            </Text>
          </View>

          {currentUser?.role === 'admin' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Chủ sở hữu:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{ownerLabel}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View testID="sample-history-screen" style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View testID="sample-history-screen" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh sách Mẫu vật</Text>
        <Text style={styles.subTitle}>
          {currentUser?.role === 'admin'
            ? 'Admin đang xem lịch sử phân tích toàn hệ thống'
            : 'Lịch sử phân tích YOLOv8 của tài khoản hiện tại'}
        </Text>
      </View>

      {samples.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chưa có mẫu phân tích nào trong phạm vi truy cập hiện tại.</Text>
        </View>
      ) : (
        <FlatList
          key={`sample-grid-${numColumns}`}
          data={samples}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={numColumns}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={numColumns > 1 ? { justifyContent: 'space-between' } : null}
        />
      )}

      <SampleDetailModal
        visible={isModalVisible}
        sample={selectedSample}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}
