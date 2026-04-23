/**
 * InferencePreview — Inference Module Component
 * Displays the selected image or base64 result with YOLO bounding boxes.
 */

import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useInferenceStore } from '../store/useInferenceStore';
import { useOverlayBoxes } from '../hooks/useOverlayBoxes';
import { COLORS, RADIUS } from '../../@core/constants/theme';

export function InferencePreview({
  visibleIndexes,
  diseaseColorMap,
  focusedIndex,
  onHover,
  onPressBox
}) {
  const {
    imageUri,
    resultImageBase64,
    detections,
    imageMetadata,
    previewFrame,
    setPreviewFrame,
  } = useInferenceStore();

  const boxes = useOverlayBoxes({ detections, previewFrame, imageMetadata });

  // Use base64 if available, otherwise original picked image
  const displaySource = resultImageBase64
    ? { uri: `data:image/jpeg;base64,${resultImageBase64}` }
    : imageUri
      ? { uri: imageUri }
      : null;

  return (
    <View
      style={styles.container}
      onLayout={(e) => setPreviewFrame(e.nativeEvent.layout)}
    >
      {displaySource ? (
        <>
          <Image
            source={displaySource}
            style={styles.image}
            resizeMode="contain"
          />

          {boxes.map((b) => {
            if (!visibleIndexes.includes(b.index)) return null;

            const boxData = detections[b.index];
            const color   = diseaseColorMap[boxData?.class_name] || '#facc15';
            const isFocus = focusedIndex === b.index;

            return (
              <Pressable
                key={b.index}
                onHoverIn={() => onHover(b.index)}
                onHoverOut={() => onHover(null)}
                onPress={() => onPressBox(b.index)}
                style={[
                  styles.box,
                  {
                    left: b.left,
                    top: b.top,
                    width: b.width,
                    height: b.height,
                    borderColor: color,
                    borderWidth: isFocus ? 3 : 2,
                    backgroundColor: isFocus ? `${color}40` : 'transparent',
                    zIndex: isFocus ? 10 : 1,
                  }
                ]}
              >
                {isFocus && (
                  <View style={[styles.boxLabel, { backgroundColor: color }]}>
                    <Text style={styles.boxLabelText}>{boxData?.class_name}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Chưa có ảnh nào được chọn</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 300,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: COLORS.textSecondary,
  },
  box: {
    position: 'absolute',
    borderRadius: 2,
  },
  boxLabel: {
    position: 'absolute',
    top: -24,
    left: -2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    whiteSpace: 'nowrap',
  },
  boxLabelText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
