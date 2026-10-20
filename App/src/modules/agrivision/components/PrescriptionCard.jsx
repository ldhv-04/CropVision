/**
 * PrescriptionCard — Prescriptive Dosage Dossier for Leaf Scan Results
 * Strictly adheres to Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';

export function PrescriptionCard({ result, colors, onReset }) {
  if (!result) return null;

  return (
    <View style={[styles.dossierCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
      <View style={styles.dossierHeader}>
        <View>
          <Text style={[styles.kicker, { color: colors.accent }]}>KẾT QUẢ CHẨN ĐOÁN QUANG HỌC</Text>
          <Text style={[styles.dossierDisease, { color: colors.textPrimary }]}>{result.diseaseName}</Text>
          <Text style={[styles.scientificName, { color: colors.textMuted }]}>
            {result.scientificName} · {result.crop}
          </Text>
        </View>

        <View style={[styles.confBadge, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
          <Text style={[styles.confText, { color: colors.primary }]}>{result.confidence}%</Text>
          <Text style={[styles.confSub, { color: colors.textMuted }]}>CHÍNH XÁC</Text>
        </View>
      </View>

      <View style={[styles.severityBar, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
        <Text style={[styles.severityText, { color: colors.warning }]}>⚠️ {result.severity}</Text>
      </View>

      <View style={[styles.prescBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
        <Text style={[styles.prescTitle, { color: colors.primary }]}>💊 HOẠT CHẤT & THUỐC BVTV KHUYẾN NGHỊ:</Text>
        <Text style={[styles.prescIngredient, { color: colors.textPrimary }]}>{result.activeIngredient}</Text>

        <View style={styles.prescRow}>
          <View style={styles.prescCol}>
            <Text style={[styles.prescSubLabel, { color: colors.textMuted }]}>LIỀU LƯỢNG PHA:</Text>
            <Text style={[styles.prescVal, { color: colors.accent }]}>{result.dosage}</Text>
          </View>
          <View style={styles.prescCol}>
            <Text style={[styles.prescSubLabel, { color: colors.textMuted }]}>THỜI ĐIỂM VÀNG:</Text>
            <Text style={[styles.prescVal, { color: colors.textPrimary }]}>{result.timing}</Text>
          </View>
        </View>
      </View>

      <View style={styles.dossierActions}>
        <Pressable
          style={[styles.saveFieldBtn, { backgroundColor: colors.primary }]}
          onPress={() => Alert.alert('Thành công', 'Đã lưu mẫu chẩn đoán vào nhật ký thửa đất!')}
        >
          <Text style={styles.saveFieldBtnText}>💾 Lưu Vào Thửa Đất</Text>
        </Pressable>

        <Pressable
          style={[styles.scanAgainBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          onPress={onReset}
        >
          <Text style={[styles.scanAgainBtnText, { color: colors.textPrimary }]}>🔄 Quét Tiếp Lá Khác</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dossierCard: { borderRadius: 12, borderWidth: 1.5, padding: 16, gap: 14 },
  dossierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5, fontFamily: 'monospace' },
  dossierDisease: { fontSize: 20, fontWeight: '900', marginTop: 2 },
  scientificName: { fontSize: 12, fontStyle: 'italic', marginTop: 2 },
  confBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  confText: { fontSize: 18, fontWeight: '900' },
  confSub: { fontSize: 8, fontWeight: '800', marginTop: 1 },
  severityBar: { padding: 10, borderRadius: 6, borderWidth: 1 },
  severityText: { fontSize: 13, fontWeight: '800' },
  prescBox: { padding: 14, borderRadius: 8, borderWidth: 1, gap: 8 },
  prescTitle: { fontSize: 11, fontWeight: '900' },
  prescIngredient: { fontSize: 15, fontWeight: '800' },
  prescRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  prescCol: { flex: 1, gap: 2 },
  prescSubLabel: { fontSize: 9, fontWeight: '800' },
  prescVal: { fontSize: 13, fontWeight: '800' },
  dossierActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  saveFieldBtn: { flex: 1, minHeight: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveFieldBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  scanAgainBtn: { flex: 1, minHeight: 48, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scanAgainBtnText: { fontSize: 13, fontWeight: '700' },
});
