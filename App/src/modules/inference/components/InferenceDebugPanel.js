import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  isInferenceDebugEnabled,
  printInferenceDebugTimeline,
  useInferenceDebugSnapshot,
} from '../debug/inferenceDebug';

export function InferenceDebugPanel({ compact = false }) {
  const snapshot = useInferenceDebugSnapshot();

  if (!isInferenceDebugEnabled()) return null;

  const imageSize = snapshot.image?.fileSize
    ? `${snapshot.image.fileSize} bytes`
    : 'n/a';
  const dims = snapshot.image?.width && snapshot.image?.height
    ? `${snapshot.image.width}x${snapshot.image.height}`
    : 'n/a';

  return (
    <View style={[styles.panel, compact && styles.panelCompact]} pointerEvents="box-none">
      <View style={styles.header}>
        <Text style={styles.title}>Inference debug</Text>
        <Pressable style={styles.button} onPress={() => printInferenceDebugTimeline(snapshot.runId)}>
          <Text style={styles.buttonText}>Print</Text>
        </Pressable>
      </View>

      <Text style={styles.line}>run: {snapshot.runId || 'none'}</Text>
      <Text style={styles.line}>phase: {snapshot.currentPhase || 'idle'}</Text>
      <Text style={styles.line}>elapsed: {snapshot.totalElapsedMs} ms</Text>
      <Text style={styles.line}>image: {dims} / {imageSize}</Text>
      <Text style={styles.line}>upload: {snapshot.metrics['upload-done'] ?? 'n/a'} ms</Text>
      <Text style={styles.line}>dupes: {snapshot.duplicateCount || 0}</Text>
      {snapshot.lastError ? (
        <Text style={styles.error} numberOfLines={2}>error: {snapshot.lastError.message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    zIndex: 50,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.45)',
  },
  panelCompact: {
    left: 12,
    right: 12,
    bottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
  },
  button: {
    borderWidth: 1,
    borderColor: '#38bdf8',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  buttonText: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '700',
  },
  line: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 15,
  },
  error: {
    color: '#fca5a5',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
});
