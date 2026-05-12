/**
 * Disease Service — Lookup disease info from knowledge base.
 *
 * Provides methods to:
 * - Get disease info by YOLO class name
 * - Get treatments and pesticides for a disease
 * - Build context string for LLM prompt
 *
 * Knowledge Base Structure:
 * - crop_diseases: Main disease table (class, name_vi, name_en, crop, severity)
 * - treatment_methods: Treatment options (biological, chemical, cultural)
 * - pesticides: Commercial pesticide products (trade name, active ingredient, dosage)
 * - disease_treatments: Pivot table linking diseases to treatments
 * - disease_pesticides: Pivot table linking diseases to pesticides
 *
 * Views:
 * - disease_summary: Pre-joined view with all related data (treatments + pesticides)
 *
 * Performance:
 * - Direct SQL queries (no ORM) for minimal overhead
 * - Indexed on disease_class for fast YOLO class lookup
 * - ILIKE for Vietnamese text search (case-insensitive)
 */

const pool = require('../config/db');

// ── Public API ──────────────────────────────────────────────

/**
 * Get full disease info by YOLO class name.
 * Returns disease + treatments + pesticides in one query (via view).
 *
 * @param {string} diseaseClass - YOLO output (e.g., "Tomato___Bacterial_spot")
 * @returns {Object|null} Disease summary or null if not found
 */
const getDiseaseByClass = async (diseaseClass) => {
  const query = `
    SELECT * FROM disease_summary
    WHERE disease_class = $1;
  `;
  const result = await pool.query(query, [diseaseClass]);
  return result.rows[0] || null;
};

/**
 * Get multiple diseases by class names (for multi-detection).
 *
 * @param {string[]} diseaseClasses - Array of YOLO class names
 * @returns {Object[]} Array of disease summaries
 */
const getDiseasesByClasses = async (diseaseClasses) => {
  if (!diseaseClasses || diseaseClasses.length === 0) return [];

  const placeholders = diseaseClasses.map((_, i) => `$${i + 1}`).join(', ');
  const query = `
    SELECT * FROM disease_summary
    WHERE disease_class IN (${placeholders});
  `;
  const result = await pool.query(query, diseaseClasses);
  return result.rows;
};

/**
 * Get top-N diseases by confidence (for inference results).
 *
 * @param {Object[]} detections - YOLO detections [{class_name, confidence}, ...]
 * @param {number} topK - Max number of diseases to return (default 3)
 * @param {number} minConfidence - Minimum confidence threshold (default 0.4)
 * @returns {Object[]} Array of disease summaries with confidence
 */
const getTopDiseases = async (detections, topK = 3, minConfidence = 0.4) => {
  if (!detections || detections.length === 0) return [];

  // Filter by confidence and sort descending
  const validDetections = detections
    .filter(d => d.confidence >= minConfidence)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, topK);

  if (validDetections.length === 0) return [];

  const classNames = validDetections.map(d => d.class_name);
  const diseases = await getDiseasesByClasses(classNames);

  // Merge confidence back into disease info
  return diseases.map(disease => ({
    ...disease,
    confidence: validDetections.find(d => d.class_name === disease.disease_class)?.confidence || 0,
  }));
};

/**
 * Build a context string for LLM system prompt.
 * Formats disease info into a readable block for the chatbot.
 *
 * @param {Object} disease - Disease summary from getDiseaseByClass
 * @returns {string} Formatted context for LLM
 */
const buildDiseaseContext = (disease) => {
  if (!disease) return 'Không tìm thấy thông tin về bệnh này trong cơ sở dữ liệu.';

  let context = `## Thông tin bệnh: ${disease.disease_name_vi} (${disease.disease_class})\n`;
  context += `- Cây trồng: ${disease.crop_type || 'Không xác định'}\n`;
  context += `- Mức độ nghiêm trọng: ${disease.severity || 'Không xác định'}\n`;
  context += `- Mô tả: ${disease.description || 'Không có'}\n`;

  if (disease.symptoms && disease.symptoms.length > 0) {
    context += `- Triệu chứng: ${disease.symptoms.join('; ')}\n`;
  }

  if (disease.causes && disease.causes.length > 0) {
    context += `- Nguyên nhân: ${disease.causes.join('; ')}\n`;
  }

  // Treatments
  if (disease.treatments && disease.treatments.length > 0) {
    context += `\n## Phương pháp điều trị:\n`;
    disease.treatments.forEach((t, i) => {
      const stars = '⭐'.repeat(t.effectiveness || 0);
      context += `${i + 1}. [${t.method_type}] ${t.method_name} ${stars}\n`;
      if (t.description) context += `   - ${t.description}\n`;
      if (t.application_guide) context += `   - Cách dùng: ${t.application_guide}\n`;
      if (t.frequency) context += `   - Tần suất: ${t.frequency}\n`;
    });
  }

  // Pesticides
  if (disease.pesticides && disease.pesticides.length > 0) {
    context += `\n## Thuốc BVTV gợi ý:\n`;
    disease.pesticides.forEach((p, i) => {
      context += `${i + 1}. ${p.trade_name} (${p.active_ingredient})\n`;
      if (p.dosage) context += `   - Liều lượng: ${p.dosage}\n`;
      if (p.pre_harvest_interval > 0) {
        context += `   - Thời gian cách ly: ${p.pre_harvest_interval} ngày\n`;
      }
    });
  }

  return context;
};

/**
 * Build context for multiple diseases (multi-detection).
 *
 * @param {Object[]} diseases - Array of disease summaries with confidence
 * @returns {string} Combined context for LLM
 */
const buildMultiDiseaseContext = (diseases) => {
  if (!diseases || diseases.length === 0) {
    return 'Không phát hiện bệnh nào có độ tin cậy đủ cao (>40%).';
  }

  if (diseases.length === 1) {
    return buildDiseaseContext(diseases[0]);
  }

  let context = `## Phát hiện ${diseases.length} bệnh trên ảnh:\n\n`;
  diseases.forEach((disease, i) => {
    context += `### ${i + 1}. ${disease.disease_name_vi} (Độ tin cậy: ${(disease.confidence * 100).toFixed(0)}%)\n`;
    context += buildDiseaseContext(disease);
    context += '\n---\n\n';
  });

  return context;
};

/**
 * Search diseases by keyword (for autocomplete or manual search).
 *
 * @param {string} keyword - Search keyword
 * @param {number} limit - Max results (default 10)
 * @returns {Object[]} Array of matching diseases
 */
const searchDiseases = async (keyword, limit = 10) => {
  const query = `
    SELECT id, disease_class, disease_name_vi, disease_name_en, crop_type, severity
    FROM crop_diseases
    WHERE disease_name_vi ILIKE $1
       OR disease_name_en ILIKE $1
       OR disease_class ILIKE $1
    ORDER BY disease_name_vi
    LIMIT $2;
  `;
  const result = await pool.query(query, [`%${keyword}%`, limit]);
  return result.rows;
};

module.exports = {
  getDiseaseByClass,
  getDiseasesByClasses,
  getTopDiseases,
  buildDiseaseContext,
  buildMultiDiseaseContext,
  searchDiseases,
};
