/**
 * DiseaseDetailSection — Renders symptoms, causes, treatments, and pesticide recommendations.
 * Strictly adheres to Rule 2.1 (<= 300 LOC, functions <= 40 LOC).
 */

import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { styles } from './DiagnosisResultStyles';
import { LIGHT_COLORS, SPACING } from '../../@core/constants/theme';

const C = LIGHT_COLORS;

export function DiseaseDetailSection({
  diseaseDetails,
  topDetection,
  loadingDetails,
  onComplete,
}) {
  return (
    <View style={styles.detailsContainer}>
      <View style={styles.detailsCard}>
        <View style={styles.diseaseHeader}>
          <Text style={styles.diseaseNameVi}>
            {diseaseDetails ? diseaseDetails.disease_name_vi : topDetection.class_name.replace(/_/g, ' ')}
          </Text>
          {diseaseDetails?.disease_name_en && (
            <Text style={styles.diseaseNameEn}>{diseaseDetails.disease_name_en}</Text>
          )}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Cây trồng</Text>
            <Text style={styles.metaValue}>{diseaseDetails?.crop_type || 'Không xác định'}</Text>
          </View>
          <View style={[styles.metaItem, { borderLeftWidth: 1, borderLeftColor: C.border }]}>
            <Text style={styles.metaLabel}>Độ tin cậy AI</Text>
            <Text style={[styles.metaValue, { color: C.danger, fontWeight: '700' }]}>
              {Math.round(topDetection.confidence * 100)}%
            </Text>
          </View>
          <View style={[styles.metaItem, { borderLeftWidth: 1, borderLeftColor: C.border }]}>
            <Text style={styles.metaLabel}>Mức độ nguy hại</Text>
            <Text style={[styles.metaValue, { color: diseaseDetails?.severity === 'High' ? C.danger : C.warning }]}>
              {diseaseDetails?.severity === 'High' ? 'Nghiêm trọng' : 'Trung bình'}
            </Text>
          </View>
        </View>

        {loadingDetails ? (
          <ActivityIndicator color={C.primary} style={{ marginVertical: 20 }} />
        ) : (
          <>
            <Text style={styles.sectionHeading}>Mô tả chi tiết</Text>
            <Text style={styles.descriptionText}>
              {diseaseDetails?.description || 'Không có mô tả chi tiết có sẵn trong cơ sở dữ liệu.'}
            </Text>

            {diseaseDetails?.symptoms && diseaseDetails.symptoms.length > 0 && (
              <>
                <Text style={styles.sectionHeading}>Triệu chứng nhận biết</Text>
                {diseaseDetails.symptoms.map((item, idx) => (
                  <Text key={idx} style={styles.bulletItem}>• {item}</Text>
                ))}
              </>
            )}

            {diseaseDetails?.causes && diseaseDetails.causes.length > 0 && (
              <>
                <Text style={styles.sectionHeading}>Nguyên nhân phát bệnh</Text>
                {diseaseDetails.causes.map((item, idx) => (
                  <Text key={idx} style={styles.bulletItem}>• {item}</Text>
                ))}
              </>
            )}
          </>
        )}
      </View>

      {!loadingDetails && diseaseDetails && (
        <View style={styles.treatmentContainer}>
          <Text style={styles.mainTitle}>Phác đồ điều trị đề xuất</Text>

          {diseaseDetails.treatments && diseaseDetails.treatments.length > 0 && (
            <View style={styles.treatmentSection}>
              <Text style={styles.treatmentTypeTitle}>🌿 Biện pháp cơ học & Sinh học</Text>
              {diseaseDetails.treatments
                .filter((t) => t.method_type === 'Biological' || t.method_type === 'Cultural')
                .map((t, idx) => (
                  <View key={idx} style={styles.treatmentCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{t.method_name}</Text>
                      <Text style={styles.cardStars}>{'⭐'.repeat(t.effectiveness || 0)}</Text>
                    </View>
                    {t.description && <Text style={styles.cardDesc}>{t.description}</Text>}
                    {t.application_guide && (
                      <Text style={styles.cardGuide}>
                        <Text style={{ fontWeight: '600' }}>Hướng dẫn:</Text> {t.application_guide}
                      </Text>
                    )}
                  </View>
                ))}
            </View>
          )}

          {diseaseDetails.treatments && diseaseDetails.treatments.length > 0 && (
            <View style={styles.treatmentSection}>
              <Text style={styles.treatmentTypeTitle}>🧪 Thuốc bảo vệ thực vật (BVTV)</Text>
              {diseaseDetails.treatments
                .filter((t) => t.method_type === 'Chemical')
                .map((t, idx) => (
                  <View key={idx} style={[styles.treatmentCard, { borderLeftColor: C.danger }]}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{t.method_name}</Text>
                      <Text style={styles.cardStars}>{'⭐'.repeat(t.effectiveness || 0)}</Text>
                    </View>
                    {t.description && <Text style={styles.cardDesc}>{t.description}</Text>}
                    {t.application_guide && (
                      <Text style={styles.cardGuide}>
                        <Text style={{ fontWeight: '600' }}>Hướng dẫn:</Text> {t.application_guide}
                      </Text>
                    )}
                    {t.frequency && (
                      <Text style={styles.cardGuide}>
                        <Text style={{ fontWeight: '600' }}>Chu kỳ bón:</Text> {t.frequency}
                      </Text>
                    )}
                  </View>
                ))}
            </View>
          )}

          {diseaseDetails.pesticides && diseaseDetails.pesticides.length > 0 && (
            <View style={styles.treatmentSection}>
              <Text style={styles.treatmentTypeTitle}>📦 Thuốc gợi ý trên thị trường</Text>
              {diseaseDetails.pesticides.map((p, idx) => (
                <View key={idx} style={styles.pesticideCard}>
                  <View style={styles.pesticideHeader}>
                    <Text style={styles.pesticideName}>{p.trade_name}</Text>
                    <Text style={styles.pesticideActive}>{p.active_ingredient}</Text>
                  </View>
                  <View style={styles.pesticideMetaRow}>
                    {p.dosage && (
                      <Text style={styles.pesticideMeta}>
                        <Text style={{ fontWeight: '600' }}>Liều lượng:</Text> {p.dosage}
                      </Text>
                    )}
                    {p.pre_harvest_interval > 0 && (
                      <Text style={[styles.pesticideMeta, { color: C.danger }]}>
                        <Text style={{ fontWeight: '600' }}>Cách ly thu hoạch:</Text> {p.pre_harvest_interval} ngày
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              ⚠️ Lưu ý: Các đề xuất thuốc bảo vệ thực vật chỉ mang tính chất tham khảo. Luôn tuân thủ quy tắc 4 đúng (đúng thuốc, đúng liều lượng, đúng lúc, đúng cách) và xin tham vấn ý kiến kỹ sư nông nghiệp hoặc cán bộ BVTV địa phương trước khi phun xịt diện rộng.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.buttonRow}>
        {topDetection && (
          <Pressable
            style={[styles.actionButton, { backgroundColor: C.secondary, marginBottom: SPACING.md }]}
            onPress={() => {
              router.push({
                pathname: '/(agrivision)/chat',
                params: {
                  initialContext: diseaseDetails
                    ? `Tôi vừa quét một mẫu lá bị bệnh ${diseaseDetails.disease_name_vi}. Bạn có thể cho tôi thêm lời khuyên không?`
                    : `Tôi vừa quét một mẫu lá và phát hiện ${topDetection.class_name}. Bạn có thể tư vấn thêm không?`,
                },
              });
            }}
          >
            <Text style={[styles.actionButtonText, { color: C.primary }]}>💬 Hỏi AI về bệnh này</Text>
          </Pressable>
        )}
        <Pressable style={styles.actionButton} onPress={onComplete}>
          <Text style={styles.actionButtonText}>Hoàn thành chẩn đoán</Text>
        </Pressable>
      </View>
    </View>
  );
}
