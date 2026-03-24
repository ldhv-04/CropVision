import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, Pressable } from 'react-native';
import { COLORS } from '../../constants/theme';
import styles from './styles';
import SampleDetailModal from '../../components/SampleDetailModal';

export default function SampleList({ authToken, currentUser }) {
  const [samples, setSamples] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSample, setSelectedSample] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [authToken, currentUser?.role]);

  const fetchHistory = async () => {
    if (!authToken) return;

    try {
      const response = await fetch('http://localhost:3000/api/samples', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        setSamples(data.data);
      }
    } catch (error) {
      console.error('Loi khi tai lich su:', error);
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
    const ownerLabel = item.owner_email || currentUser?.email || 'Khong ro chu so huu';

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        ]}
        onPress={() => handleCardPress(item)}
      >
        <Image
          source={{ uri: `http://127.0.0.1:3000${item.image_url}` }}
          style={styles.thumbnailImage}
          resizeMode="cover"
        />

        <View style={styles.cardBody}>
          <Text style={styles.sampleName} numberOfLines={1} ellipsizeMode="tail">
            {item.sample_name}
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngay quet:</Text>
            <Text style={styles.infoValue}>{formatDate(item.created_at)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>So vet benh:</Text>
            <Text style={diseaseCount > 0 ? styles.diseaseValue : styles.infoValue}>
              {diseaseCount} phat hien
            </Text>
          </View>

          {currentUser?.role === 'admin' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Chu so huu:</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{ownerLabel}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.textSecondary, marginTop: 10 }}>Dang tai du lieu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Danh sach Mau vat</Text>
        <Text style={styles.subTitle}>
          {currentUser?.role === 'admin'
            ? 'Admin dang xem lich su phan tich toan he thong'
            : 'Lich su phan tich YOLOv8 cua tai khoan hien tai'}
        </Text>
      </View>

      {samples.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chua co mau phan tich nao trong pham vi truy cap hien tai.</Text>
        </View>
      ) : (
        <FlatList
          data={samples}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={3}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
