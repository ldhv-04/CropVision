/**
 * DiseaseHandbookTab — Tab 3: Sổ Tay Bệnh Hại Nông Nghiệp
 *
 * Tra cứu nhanh 58+ chủng bệnh nhiệt đới, triệu chứng thực địa và thuốc đặc trị.
 * Hoạt động 100% ngoại tuyến không cần Internet.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { useTheme } from '../../@core/context/ThemeContext';

const HANDBOOK_DATA = [
  {
    id: 'd-rice-blast',
    name: 'Bệnh Đạo Ôn Lúa (Cháy lá)',
    scientificName: 'Magnaporthe oryzae',
    crop: 'Lúa Nước',
    icon: '🌾',
    symptoms: 'Vết bệnh ban đầu là chấm kim xám xanh, sau lan rộng thành hình mắt én màu xám trắng viền nâu.',
    treatment: 'Tricyclazole 75% WP hoặc Isoprothiolane 40% EC.',
    dosage: '25g - 30g / bình 25L',
    prevention: 'Không bón thừa đạm (Ure), giữ mực nước ruộng hợp lý.',
  },
  {
    id: 'd-coffee-rust',
    name: 'Bệnh Rỉ Sắt Cà Phê',
    scientificName: 'Hemileia vastatrix',
    crop: 'Cà Phê',
    icon: '☕',
    symptoms: 'Mặt dưới lá xuất hiện các đốm phấn bột màu vàng cam, làm lá rụng hàng loạt và khô cành.',
    treatment: 'Hexaconazole 50g/l hoặc Đồng Hydroxide.',
    dosage: '45ml / phuy 200L',
    prevention: 'Tỉa cành thông thoáng sau thu hoạch, bón cân đối NPK + Kali.',
  },
  {
    id: 'd-durian-anthracnose',
    name: 'Bệnh Thán Thư Sầu Riêng',
    scientificName: 'Colletotrichum gloeosporioides',
    crop: 'Sầu Riêng',
    icon: '🍈',
    symptoms: 'Vết cháy bắt đầu từ chóp lá lan dần vào trong thành các vòng đồng tâm màu nâu sẫm viền vàng.',
    treatment: 'Azoxystrobin 200g/l + Difenoconazole 125g/l.',
    dosage: '150ml / phuy 200L',
    prevention: 'Phun phòng khi cơi đọt non vừa lụa, thoát nước tốt mùa mưa.',
  },
  {
    id: 'd-pepper-quick-wilt',
    name: 'Bệnh Chết Nhanh Hồ Tiêu',
    scientificName: 'Phytophthora capsici',
    crop: 'Hồ Tiêu',
    icon: '🌿',
    symptoms: 'Lá héo xanh đột ngột rũ xuống nhưng vẫn dính trên cây, thối cổ rễ và chóp rễ.',
    treatment: 'Metalaxyl-M + Mancozeb hoặc Phosphonate tưới gốc.',
    dosage: '500g / phuy 200L tưới 3-5 lít/gốc',
    prevention: 'Xẻ rãnh thoát nước sâu giữa các hàng tiêu, không để ngập úng.',
  },
  {
    id: 'd-citrus-canker',
    name: 'Bệnh Loét Cây Có Múi (Bưởi, Cam)',
    scientificName: 'Xanthomonas citri',
    crop: 'Cây Có Múi',
    icon: '🍊',
    symptoms: 'Vết loét sần sùi màu nâu nhô cao trên mặt lá và vỏ quả, xung quanh có quầng vàng.',
    treatment: 'Gốc đồng (Đồng Oxyclorua, Kasugamycin).',
    dosage: '40ml / bình 25L',
    prevention: 'Phòng trừ sâu vẽ bùa vì vết chích là cửa ngõ cho vi khuẩn xâm nhập.',
  },
];

const CROP_CATEGORIES = ['Tất cả', 'Lúa', 'Cà phê', 'Sầu riêng', 'Hồ tiêu', 'Cây có múi'];

export function DiseaseHandbookTab() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState('Tất cả');

  const filteredDiseases = HANDBOOK_DATA.filter((item) => {
    const matchCrop = selectedCrop === 'Tất cả' || item.crop.includes(selectedCrop);
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.symptoms.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.treatment.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCrop && matchSearch;
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Search Input Box */}
      <View style={[styles.searchBox, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
        <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Tìm tên bệnh, triệu chứng, hoạt chất..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery('')}>
            <Text style={{ fontSize: 16, color: colors.textMuted }}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <View style={styles.categoryRow}>
          {CROP_CATEGORIES.map((crop, idx) => {
            const isActive = selectedCrop === crop;
            return (
              <Pressable
                key={idx}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surfaceCard,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedCrop(crop)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isActive ? '#06090E' : colors.textPrimary,
                      fontWeight: isActive ? '900' : '700',
                    },
                  ]}
                >
                  {crop}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Results List */}
      <View style={styles.resultsCount}>
        <Text style={[styles.resultsCountText, { color: colors.textMuted }]}>
          Tìm thấy {filteredDiseases.length} loại bệnh hại
        </Text>
      </View>

      {filteredDiseases.map((d) => (
        <View
          key={d.id}
          style={[styles.diseaseCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}
        >
          <View style={styles.diseaseHeader}>
            <Text style={styles.diseaseIcon}>{d.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.diseaseTitle, { color: colors.textPrimary }]}>
                {d.name}
              </Text>
              <Text style={[styles.diseaseSci, { color: colors.textMuted }]}>
                {d.scientificName} · {d.crop}
              </Text>
            </View>
          </View>

          {/* Symptoms */}
          <View style={[styles.sectionRow, { borderTopColor: colors.borderLight }]}>
            <Text style={[styles.labelTag, { color: colors.accent }]}>Triệu chứng:</Text>
            <Text style={[styles.descText, { color: colors.textSecondary }]}>
              {d.symptoms}
            </Text>
          </View>

          {/* Treatment & Dosage */}
          <View style={[styles.treatmentBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.labelTag, { color: colors.primary }]}>💊 Thuốc & Hoạt chất đặc trị:</Text>
            <Text style={[styles.treatText, { color: colors.textPrimary }]}>
              {d.treatment}
            </Text>
            <Text style={[styles.dosageText, { color: colors.accent }]}>
              Liều lượng: {d.dosage}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    minHeight: 50,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  categoryScroll: { marginBottom: 12 },
  categoryRow: { flexDirection: 'row', gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 12.5,
  },
  resultsCount: { marginBottom: 12 },
  resultsCountText: { fontSize: 11, fontWeight: '700' },

  diseaseCard: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
  },
  diseaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  diseaseIcon: { fontSize: 28 },
  diseaseTitle: { fontSize: 17, fontWeight: '900' },
  diseaseSci: { fontSize: 12, fontStyle: 'italic', marginTop: 2 },

  sectionRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    marginBottom: 10,
  },
  labelTag: { fontSize: 11, fontWeight: '900', marginBottom: 2 },
  descText: { fontSize: 13, lineHeight: 19 },

  treatmentBox: {
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  treatText: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  dosageText: { fontSize: 12.5, fontWeight: '700', marginTop: 4 },
});

export default DiseaseHandbookTab;
