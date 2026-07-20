import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, Modal,
  FlatList, ActivityIndicator, Alert, Platform, Dimensions
} from 'react-native';
import { router } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { ImagePickerService } from '../../platform/services/ImagePickerService';
import { useInferenceStore } from '../../inference/store/useInferenceStore';
import { markLatestInferenceDebugEvent } from '../../inference/debug/inferenceDebug';
import { LIGHT_COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';

const { width, height } = Dimensions.get('window');
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  overlayDismiss: {
    flex: 1,
  },
  sheetContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: 14,
    paddingHorizontal: SPACING.lg,
    maxHeight: height * 0.8,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  sheetSubtitle: {
    color: C.textSecondary,
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: C.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionText: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  albumHeaderTitle: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 12,
  },
  albumList: {
    maxHeight: 260,
  },
  emptyAlbum: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    marginBottom: 20,
  },
  emptyAlbumText: {
    color: C.textMuted,
    fontSize: FONT_SIZE.sm,
  },
  photoListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  photoThumb: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.sm,
    backgroundColor: C.border,
  },
  photoMeta: {
    flex: 1,
    marginLeft: SPACING.sm,
    gap: 2,
  },
  photoName: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  photoPath: {
    color: C.textMuted,
    fontSize: FONT_SIZE.xs,
  },
  selectArrow: {
    fontSize: 18,
    color: C.primary,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  closeBtn: {
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: 24,
  },
  closeBtnText: {
    color: C.textPrimary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
});

function getNowMs() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}
