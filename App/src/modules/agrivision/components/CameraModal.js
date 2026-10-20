import React, { useState, useEffect } from 'react';
import {
  View, Text, Pressable, Image, Modal,
  FlatList, ActivityIndicator, Alert, Platform
} from 'react-native';
import { router } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { ImagePickerService } from '../../platform/services/ImagePickerService';
import { useInferenceStore } from '../../inference/store/useInferenceStore';
import { markLatestInferenceDebugEvent } from '../../inference/debug/inferenceDebug';
import { LIGHT_COLORS } from '../../@core/constants/theme';
import { styles } from './CameraModalStyles';

const C = LIGHT_COLORS;

export function CameraModal({ visible, onClose }) {
  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  
  const setSelectedAsset = useInferenceStore((s) => s.setSelectedAsset);

  useEffect(() => {
    if (visible) {
      loadMediaLibrary();
    }
  }, [visible]);

  const loadMediaLibrary = async () => {
    if (Platform.OS === 'web') return;
    setLoadingPhotos(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        const media = await MediaLibrary.getAssetsAsync({
          first: 20,
          mediaType: MediaLibrary.MediaType.photo,
          sortBy: [MediaLibrary.SortBy.creationTime]
        });
        setPhotos(media.assets);
      }
    } catch (error) {
      console.warn('[CameraModal] Media library access failed:', error.message);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const startedAt = getNowMs();
      const asset = await ImagePickerService.takePhoto();
      if (asset) {
        setSelectedAsset(asset, {
          source: 'camera-modal',
          imageSource: 'camera',
        });
        markLatestInferenceDebugEvent('image-picker-done', {
          screen: 'camera-modal',
          imageSource: 'camera',
          durationMs: getNowMs() - startedAt,
          asset,
        });
        markLatestInferenceDebugEvent('route-transition-start', {
          from: 'camera-modal',
          to: '/(agrivision)/diagnosis-result',
        });
        onClose();
        router.push('/(agrivision)/diagnosis-result');
      }
    } catch (error) {
      Alert.alert('Lỗi truy cập Camera', error.message);
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const startedAt = getNowMs();
      const asset = await ImagePickerService.pickImage();
      if (asset) {
        setSelectedAsset(asset, {
          source: 'camera-modal',
          imageSource: 'gallery',
        });
        markLatestInferenceDebugEvent('image-picker-done', {
          screen: 'camera-modal',
          imageSource: 'gallery',
          durationMs: getNowMs() - startedAt,
          asset,
        });
        markLatestInferenceDebugEvent('route-transition-start', {
          from: 'camera-modal',
          to: '/(agrivision)/diagnosis-result',
        });
        onClose();
        router.push('/(agrivision)/diagnosis-result');
      }
    } catch (error) {
      Alert.alert('Lỗi chọn ảnh', error.message);
    }
  };

  const handleSelectLocalPhoto = (asset) => {
    const mappedAsset = {
      uri: asset.uri,
      fileName: asset.filename,
      mimeType: 'image/jpeg',
      width: asset.width,
      height: asset.height
    };
    setSelectedAsset(mappedAsset, {
      source: 'camera-modal',
      imageSource: 'recent-gallery',
    });
    markLatestInferenceDebugEvent('route-transition-start', {
      from: 'camera-modal-recent-gallery',
      to: '/(agrivision)/diagnosis-result',
    });
    onClose();
    router.push('/(agrivision)/diagnosis-result');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.overlayDismiss} onPress={onClose} />
        
        <View style={styles.sheetContent}>
          <View style={styles.sheetHandle} />
          
          <Text style={styles.sheetTitle}>Chẩn đoán bệnh cây trồng</Text>
          <Text style={styles.sheetSubtitle}>Chụp ảnh hoặc chọn từ Album trên thiết bị</Text>

          <View style={styles.quickActions}>
            <Pressable style={styles.actionCard} onPress={handleTakePhoto}>
              <View style={[styles.actionIconContainer, { backgroundColor: `${C.primary}12` }]}>
                <Text style={styles.actionEmoji}>📸</Text>
              </View>
              <Text style={styles.actionText}>Chụp ảnh mới</Text>
            </Pressable>

            <Pressable style={styles.actionCard} onPress={handlePickFromGallery}>
              <View style={[styles.actionIconContainer, { backgroundColor: '#e0f2fe' }]}>
                <Text style={styles.actionEmoji}>🖼️</Text>
              </View>
              <Text style={styles.actionText}>Chọn từ thư viện</Text>
            </Pressable>
          </View>

          <Text style={styles.albumHeaderTitle}>Ảnh gần đây trên điện thoại</Text>
          
          {loadingPhotos ? (
            <ActivityIndicator color={C.primary} style={{ marginVertical: 30 }} />
          ) : hasPermission === false ? (
            <View style={styles.emptyAlbum}>
              <Text style={styles.emptyAlbumText}>Chưa được cấp quyền truy cập album ảnh</Text>
            </View>
          ) : photos.length === 0 ? (
            <View style={styles.emptyAlbum}>
              <Text style={styles.emptyAlbumText}>Không tìm thấy ảnh nào trên thiết bị</Text>
            </View>
          ) : (
            <FlatList
              data={photos}
              keyExtractor={(item) => item.id}
              horizontal={false}
              numColumns={1}
              style={styles.albumList}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <Pressable 
                  style={({ pressed }) => [
                    styles.photoListItem,
                    pressed && { backgroundColor: `${C.border}40` }
                  ]}
                  onPress={() => handleSelectLocalPhoto(item)}
                >
                  <Image source={{ uri: item.uri }} style={styles.photoThumb} />
                  <View style={styles.photoMeta}>
                    <Text style={styles.photoName} numberOfLines={1}>{item.filename}</Text>
                    <Text style={styles.photoPath} numberOfLines={2}>{item.uri}</Text>
                  </View>
                  <Text style={styles.selectArrow}>→</Text>
                </Pressable>
              )}
            />
          )}
          
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Hủy bỏ</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function getNowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}
