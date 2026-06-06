/**
 * InferenceActionPanel — Inference Module Component
 *
 * Hiển thị 2 nút: "Chọn ảnh" (outline) và "Phân tích ngay" (primary).
 * Nút "Chọn ảnh" chiếm 1/3 chiều rộng, nút "Phân tích" chiếm 2/3.
 * Cả 2 nút có cùng chiều cao nhờ flex direction row.
 */

import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';
import { useInferenceStore } from '../store/useInferenceStore';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { ImagePickerService } from '../../platform/services/ImagePickerService';

// Lazy import — only available in AgriVision context (not in Station/Web admin)
let useFieldStore;
try {
  useFieldStore = require('../../agrivision/store/useFieldStore').useFieldStore;
} catch {
  useFieldStore = () => ({ selectedFieldId: null });
}

export function InferenceActionPanel() {
  const token = useAuthStore((s) => s.token);
  const { isAnalyzing, imageUri, setSelectedAsset, runInference } = useInferenceStore();
  const { selectedFieldId, fields } = useFieldStore();

  /** Mở image picker và lưu asset được chọn vào store */
  const handlePickImage = async () => {
    try {
      const asset = await ImagePickerService.pickImage();
      if (asset) {
        setSelectedAsset(asset);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  /** Gọi inference API nếu đã chọn ảnh và đang không phân tích */
  const handleAnalyze = () => {
    if (!imageUri || isAnalyzing) return;

    // Look up selected field's GPS coordinates to send with the scan
    let fieldCoords = null;
    if (selectedFieldId && fields?.length > 0) {
      const field = fields.find((f) => f.id === selectedFieldId);
      if (field?.latitude != null && field?.longitude != null) {
        fieldCoords = { latitude: field.latitude, longitude: field.longitude };
      }
    }

    runInference(token, selectedFieldId || null, fieldCoords);
  };


  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.btnOutline, isAnalyzing && styles.disabled]}
        onPress={handlePickImage}
        disabled={isAnalyzing}
      >
        <Text style={styles.btnOutlineText}>
          {imageUri ? 'Chọn ảnh khác' : 'Chọn ảnh'}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.btnPrimary, (!imageUri || isAnalyzing) && styles.disabled]}
        onPress={handleAnalyze}
        disabled={!imageUri || isAnalyzing}
      >
        {isAnalyzing ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.btnPrimaryText}>Phân tích ngay</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: SPACING.md,
    width: '100%',
    maxWidth: 500,
  },
  disabled: { opacity: 0.5 },
  btnOutline: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${COLORS.primary}10`,
  },
  btnOutlineText: { color: COLORS.primary, fontWeight: '600', fontSize: FONT_SIZE.md },
  btnPrimary: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZE.md },
});
