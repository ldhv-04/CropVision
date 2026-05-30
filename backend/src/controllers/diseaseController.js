/**
 * Disease Encyclopedia Controller — Public API
 *
 * Provides endpoints for browsing and searching the disease knowledge base.
 * Used by AgriVision (farmer) and Station (admin) encyclopedia screens.
 */

const diseaseService = require('../services/diseaseService');
const pool = require('../config/db');

/**
 * GET /api/diseases
 * List all diseases with optional crop_type filter.
 * Query params: crop_type (optional), search (optional), limit (default 50)
 */
const listDiseases = async (req, res) => {
  try {
    const { crop_type, search, limit = 50 } = req.query;

    let query = `
      SELECT cd.id, cd.disease_class, cd.disease_name_vi, cd.disease_name_en,
             cd.crop_type, cd.description, cd.symptoms, cd.causes, cd.severity, cd.image_url,
             COALESCE(
               json_agg(
                 json_build_object(
                   'method_type', tm.method_type,
                   'method_name', tm.method_name,
                   'description', tm.description,
                   'application_guide', tm.application_guide,
                   'frequency', tm.frequency,
                   'effectiveness', tm.effectiveness
                 )
               ) FILTER (WHERE tm.id IS NOT NULL), '[]'
             ) AS treatments
      FROM crop_diseases cd
      LEFT JOIN treatment_methods tm ON cd.id = tm.disease_id
    `;

    const conditions = [];
    const params = [];

    if (crop_type) {
      params.push(crop_type);
      conditions.push(`cd.crop_type = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(cd.disease_name_vi ILIKE $${params.length} OR cd.disease_name_en ILIKE $${params.length} OR cd.disease_class ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    params.push(parseInt(limit, 10) || 50);
    query += ` GROUP BY cd.id ORDER BY cd.crop_type, cd.disease_name_vi LIMIT $${params.length}`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      message: 'Lay danh sach benh thanh cong.',
      data: result.rows,
    });
  } catch (error) {
    console.error('[Disease] listDiseases error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay danh sach benh.' });
  }
};

/**
 * GET /api/diseases/:id
 * Get full disease detail by ID (includes treatments + pesticides).
 */
const getDiseaseDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT cd.*,
        COALESCE(
          json_agg(
            json_build_object(
              'method_type', tm.method_type,
              'method_name', tm.method_name,
              'description', tm.description,
              'application_guide', tm.application_guide,
              'frequency', tm.frequency,
              'effectiveness', tm.effectiveness
            )
          ) FILTER (WHERE tm.id IS NOT NULL), '[]'
        ) AS treatments,
        COALESCE(
          json_agg(
            json_build_object(
              'trade_name', p.trade_name,
              'active_ingredient', p.active_ingredient,
              'dosage', p.dosage,
              'pre_harvest_interval', p.pre_harvest_interval,
              'effectiveness', pdm.effectiveness
            )
          ) FILTER (WHERE p.id IS NOT NULL), '[]'
        ) AS pesticides
      FROM crop_diseases cd
      LEFT JOIN treatment_methods tm ON cd.id = tm.disease_id
      LEFT JOIN pesticide_disease_map pdm ON cd.id = pdm.disease_id
      LEFT JOIN pesticides p ON pdm.pesticide_id = p.id
      WHERE cd.id = $1
      GROUP BY cd.id;
    `;

    const result = await pool.query(query, [parseInt(id, 10)]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Khong tim thay benh.' });
    }

    res.json({
      success: true,
      message: 'Lay thong tin benh thanh cong.',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('[Disease] getDiseaseDetail error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay thong tin benh.' });
  }
};

/**
 * GET /api/diseases/crops/list
 * Get distinct crop types available in the database.
 */
const getCropTypes = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT crop_type, COUNT(*) as disease_count
      FROM crop_diseases
      WHERE crop_type IS NOT NULL
      GROUP BY crop_type
      ORDER BY disease_count DESC;
    `;
    const result = await pool.query(query);

    res.json({
      success: true,
      message: 'Lay danh sach cay trong thanh cong.',
      data: result.rows,
    });
  } catch (error) {
    console.error('[Disease] getCropTypes error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay danh sach cay trong.' });
  }
};

/**
 * GET /api/diseases/pesticides/list
 * Browse all pesticides with optional filters.
 * Query: search, disease_id
 */
const listPesticides = async (req, res) => {
  try {
    const { search, disease_id, limit = 50 } = req.query;

    let query = `
      SELECT p.*,
        COALESCE(
          json_agg(
            json_build_object('disease_id', pdm.disease_id, 'disease_name', cd.disease_name_vi, 'effectiveness', pdm.effectiveness)
          ) FILTER (WHERE pdm.disease_id IS NOT NULL), '[]'
        ) AS diseases
      FROM pesticides p
      LEFT JOIN pesticide_disease_map pdm ON p.id = pdm.pesticide_id
      LEFT JOIN crop_diseases cd ON pdm.disease_id = cd.id
    `;

    const conditions = [];
    const params = [];

    if (disease_id) {
      params.push(parseInt(disease_id, 10));
      conditions.push(`pdm.disease_id = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.trade_name ILIKE $${params.length} OR p.active_ingredient ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    params.push(parseInt(limit, 10) || 50);
    query += ` GROUP BY p.id ORDER BY p.trade_name LIMIT $${params.length}`;

    const result = await pool.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('[Disease] listPesticides error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi lay danh sach thuoc.' });
  }
};

/**
 * GET /api/diseases/symptoms/tree
 * Interactive symptom tree for guided diagnosis.
 * Returns a decision tree structure: crop → plant part → symptom type → possible diseases
 */
const getSymptomTree = async (req, res) => {
  try {
    const diseases = await pool.query(
      `SELECT id, disease_class, disease_name_vi, crop_type, symptoms, severity FROM crop_diseases WHERE disease_name_vi NOT LIKE '%khỏe mạnh%' ORDER BY crop_type, disease_name_vi`
    );

    // Build a simple 3-step tree:
    // Step 1: Crop type
    // Step 2: Plant part (leaf/stem/fruit/general — inferred from symptoms)
    // Step 3: Symptom appearance
    const cropMap = {};

    for (const d of diseases.rows) {
      const crop = d.crop_type || 'other';
      if (!cropMap[crop]) cropMap[crop] = {};

      for (const symptom of (d.symptoms || [])) {
        // Infer plant part from symptom text
        let part = 'leaf';
        const s = symptom.toLowerCase();
        if (s.includes('thân') || s.includes('stem')) part = 'stem';
        else if (s.includes('quả') || s.includes('fruit')) part = 'fruit';
        else if (s.includes('rễ') || s.includes('root')) part = 'root';
        else if (s.includes('lá') || s.includes('leaf') || s.includes('đốm') || s.includes('vàng')) part = 'leaf';

        if (!cropMap[crop][part]) cropMap[crop][part] = [];

        // Check if disease already added for this part
        const existing = cropMap[crop][part].find(e => e.disease_id === d.id);
        if (existing) {
          existing.symptoms.push(symptom);
        } else {
          cropMap[crop][part].push({
            disease_id: d.id,
            disease_class: d.disease_class,
            disease_name: d.disease_name_vi,
            severity: d.severity,
            symptoms: [symptom],
          });
        }
      }
    }

    // Transform to tree structure
    const tree = Object.entries(cropMap).map(([crop, parts]) => ({
      crop_type: crop,
      parts: Object.entries(parts).map(([part, diseases]) => ({
        plant_part: part,
        plant_part_vi: { leaf: 'Lá', stem: 'Thân', fruit: 'Quả', root: 'Rễ', other: 'Khác' }[part] || part,
        diseases: diseases.map(d => ({
          ...d,
          // Map symptoms to a display string
          symptom_display: d.symptoms.slice(0, 3).join(', '),
        })),
      })),
    }));

    res.json({ success: true, data: tree });
  } catch (error) {
    console.error('[Disease] getSymptomTree error:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi tao cay trieu chung.' });
  }
};

module.exports = {
  listDiseases,
  getDiseaseDetail,
  getCropTypes,
  listPesticides,
  getSymptomTree,
};
