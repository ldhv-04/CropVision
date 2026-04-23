/**
 * InferenceActionPanel — Inference Module Component
 * Buttons for selecting image and running analysis.
 */

import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, RADIUS, FONT_SIZE } from '../../@core/constants/theme';
import { useInferenceStore } from '../store/useInferenceStore';
import { useAuthStore } from '../../@core/auth/useAuthStore';
import { ImagePickerService } from '../../platform/services/ImagePickerService';

export function InferenceActionPanel() {
  const token = useAuthStore((s) => s.token);
  const { isAnalyzing, imageUri, setSelectedAsset, runInference } = useInferenceStore();

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

  const handleAnalyze = () => {
    if (!imageUri || isAnalyzing) return;
    runInference(token);
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
    marginTop: SPACING.md,
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
