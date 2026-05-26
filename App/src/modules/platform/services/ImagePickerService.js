/**
 * ImagePickerService — Platform Module
 *
 * Unified image selection handling across native apps, web browsers, and Electron.
 */

import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export const ImagePickerService = {
  /**
   * Request permissions and open the native/web image picker.
   * Returns a standard asset object or null if cancelled.
   */
  pickImage: async () => {
    // 1. Request permissions (required on iOS/Android)
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Cần quyền truy cập thư viện ảnh để tiếp tục.');
      }
    }

    // 2. Launch picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Let user send full res
      quality: 1,
      // Pass base64 on web to allow blob conversion if needed, but modern Expo
      // returns a File object in `result.assets[0].file` on web.
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0];
  },

  /**
   * Request camera permissions and take a photo using the device camera.
   * Returns a standard asset object or null if cancelled.
   */
  takePhoto: async () => {
    // 1. Request camera permissions (required on iOS/Android)
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Cần quyền truy cập camera để tiếp tục.');
      }
    }

    // 2. Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0];
  },
};

