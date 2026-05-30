/**
 * Disease Encyclopedia — AgriVision (FULL VERSION)
 *
 * Features:
 * - Browse/search diseases with photo cards
 * - Filter by crop type chips
 * - Detail modal with symptoms, treatments, video, pesticides
 * - Interactive symptom tree (3-step guided diagnosis)
 * - Chemical product database (pesticide browsing)
 * - YouTube video guides
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, ActivityIndicator, RefreshControl, Modal,
  KeyboardAvoidingView, Platform, Linking
} from 'react-native';
import { useAuthStore } from '../../src/modules/@core/auth/useAuthStore';
import { apiRequest } from '../../src/modules/@core/api/apiClient';
import { ENDPOINTS } from '../../src/modules/@core/api/endpoints';
import { LIGHT_COLORS, SPACING, RADIUS, FONT_SIZE } from '../../src/modules/@core/constants/theme';

const C = LIGHT_COLORS;

const SEVERITY_MAP = {
  mild: { label: 'Nhẹ', color: '#16a34a', bg: '#dcfce7' },
  moderate: { label: 'Trung bình', color: '#d97706', bg: '#fef9c3' },
  severe: { label: 'Nghiêm trọng', color: '#dc2626', bg: '#fee2e2' },
};

const CROP_ICONS = {
  tomato: '🍅', pepper: '🌶️', rice: '🌾', corn: '🌽', potato: '🥔',
};

function SeverityBadge({ severity }) {
  const s = SEVERITY_MAP[severity] || SEVERITY_MAP.moderate;
  return (
    <View style={[styles.severityBadge, { backgroundColor: s.bg }]}>
      <Text style={[styles.severityText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

function DiseaseCard({ disease, onPress }) {
  const cropIcon = CROP_ICONS[disease.crop_type] || '🌱';
  return (
    <Pressable style={styles.card} onPress={() => onPress(disease)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardCropIcon}>{cropIcon}</Text>
        <View style={styles.cardTitleGroup}>
          <Text style={styles.cardTitle} numberOfLines={1}>{disease.disease_name_vi}</Text>
          {disease.disease_name_en && (
            <Text style={styles.cardSubtitle} numberOfLines={1}>{disease.disease_name_en}</Text>
          )}
        </View>
        <SeverityBadge severity={disease.severity} />
      </View>
      {disease.symptoms && disease.symptoms.length > 0 && (
        <Text style={styles.cardSymptoms} numberOfLines={2}>
          🔍 {disease.symptoms.slice(0, 2).join(' • ')}
        </Text>
      )}
    </Pressable>
  );
}

// ─── Symptom Tree (3-step guided diagnosis) ──────────────────────────
function SymptomTree({ visible, onClose, onSelectDisease, token }) {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setStep(1);
    setSelectedCrop(null);
    setSelectedPart(null);
    apiRequest(ENDPOINTS.diseases.symptomTree, {}, token)
      .then((data) => { if (data.success) setTree(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible]);

  const handleSelectCrop = (crop) => {
    setSelectedCrop(crop);
    setStep(2);
  };

  const handleSelectPart = (part) => {
    setSelectedPart(part);
    setStep(3);
  };

  const selectedCropData = tree.find(t => t.crop_type === selectedCrop);
  const selectedPartData = selectedCropData?.parts.find(p => p.plant_part === selectedPart);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🔍 Chẩn đoán theo triệu chứng</Text>
          <Pressable onPress={onClose}><Text style={styles.modalClose}>✕</Text></Pressable>
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator color={C.primary} size="large" />
            <Text style={styles.loadingText}>Đang tải cây triệu chứng...</Text>
          </View>
        ) : (
          <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Step indicator */}
            <View style={styles.stepIndicator}>
              {['Cây trồng', 'Bộ phận', 'Kết quả'].map((label, i) => (
                <View key={i} style={styles.stepItem}>
                  <View style={[styles.stepDot, step > i && styles.stepDotActive, step === i + 1 && styles.stepDotCurrent]}>
                    <Text style={[styles.stepDotText, step === i + 1 && { color: '#fff' }]}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepLabel, step === i + 1 && { color: C.primary, fontWeight: '700' }]}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Step 1: Select crop */}
            {step === 1 && (
              <View>
                <Text style={styles.stepQuestion}>Cây trồng của bạn là gì?</Text>
                {tree.map((t) => (
                  <Pressable key={t.crop_type} style={styles.treeOption} onPress={() => handleSelectCrop(t.crop_type)}>
                    <Text style={styles.treeOptionIcon}>{CROP_ICONS[t.crop_type] || '🌱'}</Text>
                    <Text style={styles.treeOptionLabel}>{t.crop_type}</Text>
                    <Text style={styles.treeOptionCount}>{t.parts.reduce((sum, p) => sum + p.diseases.length, 0)} bệnh</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Step 2: Select plant part */}
            {step === 2 && selectedCropData && (
              <View>
                <Pressable onPress={() => setStep(1)} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Quay lại</Text>
                </Pressable>
                <Text style={styles.stepQuestion}>{CROP_ICONS[selectedCrop] || '🌱'} {selectedCrop} — Bệnh ở đâu?</Text>
                {selectedCropData.parts.map((p) => (
                  <Pressable key={p.plant_part} style={styles.treeOption} onPress={() => handleSelectPart(p.plant_part)}>
                    <Text style={styles.treeOptionIcon}>
                      {{ leaf: '🍃', stem: '🌿', fruit: '🍅', root: '🌱', other: '🔍' }[p.plant_part] || '🔍'}
                    </Text>
                    <Text style={styles.treeOptionLabel}>{p.plant_part_vi}</Text>
                    <Text style={styles.treeOptionCount}>{p.diseases.length} bệnh</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Step 3: Results */}
            {step === 3 && selectedPartData && (
              <View>
                <Pressable onPress={() => setStep(2)} style={styles.backBtn}>
                  <Text style={styles.backBtnText}>← Quay lại</Text>
                </Pressable>
                <Text style={styles.stepQuestion}>
                  {CROP_ICONS[selectedCrop] || '🌱'} {selectedCrop} → {selectedPartData.plant_part_vi} — Có thể là:
                </Text>
                {selectedPartData.diseases.map((d) => {
                  const s = SEVERITY_MAP[d.severity] || SEVERITY_MAP.moderate;
                  return (
                    <Pressable key={d.disease_id} style={styles.resultCard} onPress={() => { onSelectDisease(d.disease_id); onClose(); }}>
                      <View style={styles.resultHeader}>
                        <Text style={styles.resultName}>{d.disease_name}</Text>
                        <SeverityBadge severity={d.severity} />
                      </View>
                      <Text style={styles.resultSymptoms}>🔍 {d.symptom_display}</Text>
                      <Text style={styles.resultLink}>Xem chi tiết →</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ─── Pesticide Browser ───────────────────────────────────────────────
function PesticideBrowser({ visible, onClose, token }) {
  const [pesticides, setPesticides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const fetchPesticides = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText.trim().length >= 2) params.set('search', searchText.trim());
      params.set('limit', '50');
      const data = await apiRequest(`${ENDPOINTS.diseases.pesticides}?${params.toString()}`, {}, token);
      if (data.success) setPesticides(data.data);
    } catch {}
    setLoading(false);
  }, [token, searchText]);

  useEffect(() => { if (visible) fetchPesticides(); }, [visible]);

  useEffect(() => {
    const timer = setTimeout(fetchPesticides, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>🧴 Thuốc BVTV</Text>
          <Pressable onPress={onClose}><Text style={styles.modalClose}>✕</Text></Pressable>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Tìm thuốc (tên hoặc hoạt chất)..."
            placeholderTextColor={C.placeholder}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 40 }}>
          {loading && <ActivityIndicator color={C.primary} size="large" style={{ paddingVertical: SPACING.xxl }} />}

          {!loading && pesticides.map((p) => (
            <View key={p.id} style={styles.pestCard}>
              <Text style={styles.pestName}>{p.trade_name}</Text>
              <Text style={styles.pestIngredient}>Hoạt chất: {p.active_ingredient}</Text>
              {p.concentration && <Text style={styles.pestInfo}>Nồng độ: {p.concentration}</Text>}
              {p.manufacturer && <Text style={styles.pestInfo}>NSX: {p.manufacturer}</Text>}
              {p.dosage && <Text style={styles.pestInfo}>Liều lượng: {p.dosage}</Text>}
              {p.pre_harvest_interval > 0 && (
                <Text style={styles.pestWarning}>⏰ Thời gian cách ly: {p.pre_harvest_interval} ngày</Text>
              )}
              {p.application_method && (
                <Text style={styles.pestInfo}>Cách dùng: {p.application_method}</Text>
              )}
              {p.diseases && p.diseases.length > 0 && (
                <View style={styles.pestDiseases}>
                  <Text style={styles.pestDiseasesLabel}>Điều trị:</Text>
                  {p.diseases.filter(d => d.disease_name).map((d, i) => (
                    <Text key={i} style={styles.pestDiseaseItem}>
                      • {d.disease_name} {d.effectiveness ? '⭐'.repeat(d.effectiveness) : ''}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}

          {!loading && pesticides.length === 0 && (
            <View style={styles.centerContent}>
              <Text style={{ fontSize: 48, marginBottom: SPACING.md }}>🧴</Text>
              <Text style={{ color: C.textMuted, fontSize: FONT_SIZE.sm }}>
                {searchText ? 'Không tìm thấy thuốc' : 'Chưa có dữ liệu thuốc'}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Disease Detail Modal (Enhanced with video + pesticide links) ────
function DiseaseDetailModal({ diseaseId, visible, onClose, token, onOpenPesticides }) {
  const [disease, setDisease] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible || !diseaseId) return;
    setLoading(true);
    apiRequest(ENDPOINTS.diseases.detail(diseaseId), {}, token)
      .then((data) => { if (data.success) setDisease(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible, diseaseId]);

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalRoot}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Đang tải...</Text>
            <Pressable onPress={onClose}><Text style={styles.modalClose}>✕</Text></Pressable>
          </View>
          <View style={styles.centerContent}><ActivityIndicator color={C.primary} size="large" /></View>
        </View>
      </Modal>
    );
  }

  if (!disease) return null;

  const cropIcon = CROP_ICONS[disease.crop_type] || '🌱';
  const hasVideo = !!disease.video_url;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} numberOfLines={1}>{disease.disease_name_vi}</Text>
          <Pressable onPress={onClose}><Text style={styles.modalClose}>✕</Text></Pressable>
        </View>

        <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Title block */}
          <View style={styles.detailTitleRow}>
            <Text style={styles.detailCropIcon}>{cropIcon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailName}>{disease.disease_name_vi}</Text>
              {disease.disease_name_en && <Text style={styles.detailNameEn}>{disease.disease_name_en}</Text>}
            </View>
            <SeverityBadge severity={disease.severity} />
          </View>

          {/* Description */}
          {disease.description && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>📋 Mô tả</Text>
              <Text style={styles.sectionBody}>{disease.description}</Text>
            </View>
          )}

          {/* Symptoms */}
          {disease.symptoms && disease.symptoms.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>🔍 Triệu chứng</Text>
              {disease.symptoms.map((sym, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{sym}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Causes */}
          {disease.causes && disease.causes.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>⚠️ Nguyên nhân</Text>
              {disease.causes.map((cause, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{cause}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Video Guide */}
          {hasVideo && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>🎥 Video hướng dẫn</Text>
              <Pressable style={styles.videoCard} onPress={() => Linking.openURL(disease.video_url)}>
                <Text style={styles.videoIcon}>▶️</Text>
                <Text style={styles.videoText}>Xem video hướng dẫn điều trị</Text>
              </Pressable>
            </View>
          )}

          {/* Treatments */}
          {disease.treatments && disease.treatments.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>💊 Phương pháp điều trị</Text>
              {disease.treatments.map((t, i) => (
                <View key={i} style={styles.treatmentCard}>
                  <View style={styles.treatmentHeader}>
                    <Text style={styles.treatmentType}>
                      {{ chemical: '🧪', biological: '🌿', cultural: '🔧' }[t.method_type] || '💊'}{' '}
                      {{ chemical: 'Hóa học', biological: 'Sinh học', cultural: 'Canh tác' }[t.method_type] || t.method_type}
                    </Text>
                    {t.effectiveness > 0 && <Text style={styles.treatmentStars}>{'⭐'.repeat(t.effectiveness)}</Text>}
                  </View>
                  <Text style={styles.treatmentName}>{t.method_name}</Text>
                  {t.description && <Text style={styles.treatmentDesc}>{t.description}</Text>}
                  {t.application_guide && <Text style={styles.treatmentGuide}>📌 {t.application_guide}</Text>}
                  {t.frequency && <Text style={styles.treatmentFreq}>🔄 {t.frequency}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Pesticides */}
          {disease.pesticides && disease.pesticides.length > 0 && (
            <View style={styles.detailSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>🧴 Thuốc BVTV gợi ý</Text>
                <Pressable style={styles.linkBtn} onPress={() => { onClose(); onOpenPesticides(); }}>
                  <Text style={styles.linkBtnText}>Xem tất cả →</Text>
                </Pressable>
              </View>
              {disease.pesticides.map((p, i) => (
                <View key={i} style={styles.pesticideCard}>
                  <Text style={styles.pesticideName}>{p.trade_name}</Text>
                  <Text style={styles.pesticideIngredient}>Hoạt chất: {p.active_ingredient}</Text>
                  {p.dosage && <Text style={styles.pesticideInfo}>Liều lượng: {p.dosage}</Text>}
                  {p.pre_harvest_interval > 0 && (
                    <Text style={styles.pesticideWarning}>⏰ Cách ly: {p.pre_harvest_interval} ngày</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────
export default function EncyclopediaScreen() {
  const token = useAuthStore((s) => s.token);
  const [diseases, setDiseases] = useState([]);
  const [cropTypes, setCropTypes] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showSymptomTree, setShowSymptomTree] = useState(false);
  const [showPesticides, setShowPesticides] = useState(false);

  const fetchDiseases = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCrop) params.set('crop_type', selectedCrop);
      if (searchText.trim().length >= 2) params.set('search', searchText.trim());
      params.set('limit', '100');
      const data = await apiRequest(`${ENDPOINTS.diseases.list}?${params.toString()}`, {}, token);
      if (data.success) setDiseases(data.data);
    } catch {}
  }, [token, selectedCrop, searchText]);

  const fetchCropTypes = useCallback(async () => {
    try {
      const data = await apiRequest(ENDPOINTS.diseases.cropTypes, {}, token);
      if (data.success) setCropTypes(data.data);
    } catch {}
  }, [token]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchDiseases(), fetchCropTypes()]);
    setIsLoading(false);
  }, [fetchDiseases, fetchCropTypes]);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { fetchDiseases(); }, [selectedCrop, searchText]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSelectFromTree = (diseaseId) => {
    setSelectedDiseaseId(diseaseId);
    setShowDetail(true);
  };

  return (
    <View testID="encyclopedia-screen" style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[C.primary]} />}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={styles.quickActionBtn} onPress={() => setShowSymptomTree(true)}>
            <Text style={styles.quickActionIcon}>🔍</Text>
            <Text style={styles.quickActionLabel}>Chẩn đoán</Text>
            <Text style={styles.quickActionSub}>theo triệu chứng</Text>
          </Pressable>
          <Pressable style={styles.quickActionBtn} onPress={() => setShowPesticides(true)}>
            <Text style={styles.quickActionIcon}>🧴</Text>
            <Text style={styles.quickActionLabel}>Thuốc BVTV</Text>
            <Text style={styles.quickActionSub}>tra cứu thuốc</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput style={styles.searchInput} placeholder="🔍 Tìm kiếm bệnh..." placeholderTextColor={C.placeholder} value={searchText} onChangeText={setSearchText} />
        </View>

        {/* Crop Type Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContainer}>
          <Pressable style={[styles.chip, !selectedCrop && styles.chipActive]} onPress={() => setSelectedCrop(null)}>
            <Text style={[styles.chipText, !selectedCrop && styles.chipTextActive]}>Tất cả</Text>
          </Pressable>
          {cropTypes.map((ct) => (
            <Pressable key={ct.crop_type} style={[styles.chip, selectedCrop === ct.crop_type && styles.chipActive]} onPress={() => setSelectedCrop(ct.crop_type === selectedCrop ? null : ct.crop_type)}>
              <Text style={[styles.chipText, selectedCrop === ct.crop_type && styles.chipTextActive]}>
                {CROP_ICONS[ct.crop_type] || '🌱'} {ct.crop_type} ({ct.disease_count})
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Loading */}
        {isLoading && (
          <View style={styles.centerContent}>
            <ActivityIndicator color={C.primary} size="large" />
            <Text style={styles.loadingText}>Đang tải danh mục bệnh...</Text>
          </View>
        )}

        {/* Disease List */}
        {!isLoading && diseases.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.resultCount}>{diseases.length} bệnh</Text>
            {diseases.map((disease) => (
              <DiseaseCard key={disease.id} disease={disease} onPress={(d) => { setSelectedDiseaseId(d.id); setShowDetail(true); }} />
            ))}
          </View>
        )}

        {/* Empty */}
        {!isLoading && diseases.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>Không tìm thấy</Text>
            <Text style={styles.emptyDesc}>{searchText ? 'Thử từ khóa khác' : 'Chưa có dữ liệu bệnh cho cây trồng này'}</Text>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <DiseaseDetailModal diseaseId={selectedDiseaseId} visible={showDetail} onClose={() => { setShowDetail(false); setSelectedDiseaseId(null); }} token={token} onOpenPesticides={() => setShowPesticides(true)} />
      <SymptomTree visible={showSymptomTree} onClose={() => setShowSymptomTree(false)} onSelectDisease={handleSelectFromTree} token={token} />
      <PesticideBrowser visible={showPesticides} onClose={() => setShowPesticides(false)} token={token} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingBottom: 100 },

  quickActions: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  quickActionBtn: {
    flex: 1, backgroundColor: C.surface, borderRadius: RADIUS.xl, padding: SPACING.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: C.primary, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  quickActionIcon: { fontSize: 28, marginBottom: SPACING.xs },
  quickActionLabel: { color: C.primary, fontSize: FONT_SIZE.md, fontWeight: '700' },
  quickActionSub: { color: C.textMuted, fontSize: FONT_SIZE.xs },

  searchContainer: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.sm },
  searchInput: {
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.lg, paddingVertical: 12, fontSize: FONT_SIZE.md, color: C.textPrimary,
  },

  chipScroll: { maxHeight: 50, marginBottom: SPACING.sm },
  chipContainer: { paddingHorizontal: SPACING.md, gap: SPACING.sm, alignItems: 'center' },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  chipActive: { borderColor: C.primary, backgroundColor: `${C.primary}12` },
  chipText: { color: C.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: '600' },
  chipTextActive: { color: C.primary },

  centerContent: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.md },
  loadingText: { color: C.textMuted, fontSize: FONT_SIZE.sm },

  listContainer: { paddingHorizontal: SPACING.md },
  resultCount: { color: C.textMuted, fontSize: FONT_SIZE.xs, paddingHorizontal: SPACING.sm, paddingBottom: SPACING.sm },

  card: { backgroundColor: C.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  cardCropIcon: { fontSize: 28 },
  cardTitleGroup: { flex: 1 },
  cardTitle: { color: C.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700' },
  cardSubtitle: { color: C.textMuted, fontSize: FONT_SIZE.xs, marginTop: 1 },
  cardSymptoms: { color: C.textSecondary, fontSize: FONT_SIZE.xs, marginTop: SPACING.xs, lineHeight: 18 },

  severityBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: RADIUS.full },
  severityText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl, paddingHorizontal: SPACING.xl, marginHorizontal: SPACING.md, backgroundColor: C.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed' },
  emptyIcon: { fontSize: 56, marginBottom: SPACING.md },
  emptyTitle: { color: C.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.sm },
  emptyDesc: { color: C.textSecondary, fontSize: FONT_SIZE.sm, textAlign: 'center' },

  // Modal
  modalRoot: { flex: 1, backgroundColor: C.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
  modalTitle: { color: C.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700', flex: 1 },
  modalClose: { color: C.textMuted, fontSize: FONT_SIZE.xl, fontWeight: '300', padding: SPACING.sm },
  modalBody: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },

  // Symptom Tree
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.xl, marginBottom: SPACING.lg, paddingTop: SPACING.sm },
  stepItem: { alignItems: 'center', gap: SPACING.xs },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.border },
  stepDotActive: { backgroundColor: `${C.primary}30`, borderColor: C.primary },
  stepDotCurrent: { backgroundColor: C.primary, borderColor: C.primary },
  stepDotText: { color: C.textMuted, fontSize: FONT_SIZE.sm, fontWeight: '700' },
  stepLabel: { color: C.textMuted, fontSize: FONT_SIZE.xs },
  stepQuestion: { color: C.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: '700', marginBottom: SPACING.md },
  backBtn: { marginBottom: SPACING.md },
  backBtnText: { color: C.primary, fontSize: FONT_SIZE.md, fontWeight: '600' },

  treeOption: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: C.surface,
    borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: C.border,
  },
  treeOptionIcon: { fontSize: 28 },
  treeOptionLabel: { color: C.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700', flex: 1 },
  treeOptionCount: { color: C.textMuted, fontSize: FONT_SIZE.sm },

  resultCard: { backgroundColor: C.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: `${C.warning}30` },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  resultName: { color: C.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700', flex: 1 },
  resultSymptoms: { color: C.textSecondary, fontSize: FONT_SIZE.sm, marginBottom: SPACING.xs },
  resultLink: { color: C.primary, fontSize: FONT_SIZE.sm, fontWeight: '600' },

  // Pesticide
  pestCard: { backgroundColor: C.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: C.border },
  pestName: { color: C.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700' },
  pestIngredient: { color: C.textSecondary, fontSize: FONT_SIZE.sm, marginTop: 2 },
  pestInfo: { color: C.textSecondary, fontSize: FONT_SIZE.sm, marginTop: 2 },
  pestWarning: { color: C.warning, fontSize: FONT_SIZE.xs, fontWeight: '600', marginTop: 4 },
  pestDiseases: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: C.border },
  pestDiseasesLabel: { color: C.textMuted, fontSize: FONT_SIZE.xs, fontWeight: '600', marginBottom: 2 },
  pestDiseaseItem: { color: C.textSecondary, fontSize: FONT_SIZE.xs },

  // Detail
  detailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg },
  detailCropIcon: { fontSize: 40 },
  detailName: { color: C.textPrimary, fontSize: FONT_SIZE.xl, fontWeight: '800' },
  detailNameEn: { color: C.textMuted, fontSize: FONT_SIZE.sm, marginTop: 2 },

  detailSection: { marginBottom: SPACING.lg },
  sectionTitle: { color: C.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700', marginBottom: SPACING.sm },
  sectionBody: { color: C.textSecondary, fontSize: FONT_SIZE.md, lineHeight: 22 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  linkBtn: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs },
  linkBtnText: { color: C.primary, fontSize: FONT_SIZE.xs, fontWeight: '600' },

  bulletRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: 4 },
  bullet: { color: C.primary, fontSize: FONT_SIZE.md, fontWeight: '700' },
  bulletText: { color: C.textSecondary, fontSize: FONT_SIZE.sm, flex: 1, lineHeight: 20 },

  // Video
  videoCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, backgroundColor: `${C.danger}10`, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: `${C.danger}30` },
  videoIcon: { fontSize: 24 },
  videoText: { color: C.danger, fontSize: FONT_SIZE.md, fontWeight: '600' },

  // Treatment
  treatmentCard: { backgroundColor: C.surfaceAlt, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: C.border },
  treatmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  treatmentType: { color: C.textSecondary, fontSize: FONT_SIZE.xs, fontWeight: '600' },
  treatmentStars: { fontSize: FONT_SIZE.sm },
  treatmentName: { color: C.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700', marginBottom: 4 },
  treatmentDesc: { color: C.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 18, marginBottom: 4 },
  treatmentGuide: { color: C.info, fontSize: FONT_SIZE.xs, lineHeight: 18 },
  treatmentFreq: { color: C.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 },

  pesticideCard: { backgroundColor: C.surfaceAlt, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: `${C.warning}30` },
  pesticideName: { color: C.textPrimary, fontSize: FONT_SIZE.md, fontWeight: '700' },
  pesticideIngredient: { color: C.textSecondary, fontSize: FONT_SIZE.sm, marginTop: 2 },
  pesticideInfo: { color: C.textSecondary, fontSize: FONT_SIZE.sm, marginTop: 2 },
  pesticideWarning: { color: C.warning, fontSize: FONT_SIZE.xs, fontWeight: '600', marginTop: 4 },
});