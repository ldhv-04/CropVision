const pool = require('../config/db');

const saveInferenceTransaction = async (sampleData, inferenceResults) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const insertSampleQuery = `
      INSERT INTO crop_samples (user_id, sample_name, crop_type, image_url, file_size, field_id, source_type, batch_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id;
    `;

    const sampleValues = [
      sampleData.userId,
      sampleData.sampleName,
      sampleData.cropType,
      sampleData.imageUrl,
      sampleData.fileSize,
      sampleData.fieldId || null,
      sampleData.sourceType || 'mobile',
      sampleData.batchId || null,
    ];

    const sampleResult = await client.query(insertSampleQuery, sampleValues);
    const newSampleId = sampleResult.rows[0].id;

    if (inferenceResults && inferenceResults.length > 0) {
      const insertBoxQuery = `
        INSERT INTO inference_results (sample_id, disease_class, confidence, bounding_boxes, model_version)
        VALUES ($1, $2, $3, $4, $5);
      `;

      for (const box of inferenceResults) {
        const boundingBoxData = {
          x1: box.x1,
          y1: box.y1,
          x2: box.x2,
          y2: box.y2,
        };

        const boxValues = [
          newSampleId,
          box.class_name,
          box.confidence,
          JSON.stringify(boundingBoxData),
          'YOLOv8_best',
        ];

        await client.query(insertBoxQuery, boxValues);
      }
    }

    await client.query('COMMIT');
    return newSampleId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const getSamplesHistory = async ({ userId, role }) => {
  const isAdmin = role === 'admin';
  const query = `
    SELECT
      cs.id,
      cs.user_id,
      cs.sample_name,
      cs.crop_type,
      cs.image_url,
      cs.created_at,
      u.full_name AS owner_name,
      u.email AS owner_email,
      COALESCE(
        json_agg(
          json_build_object(
            'disease_class', ir.disease_class,
            'confidence', ir.confidence,
            'bounding_boxes', ir.bounding_boxes
          )
        ) FILTER (WHERE ir.id IS NOT NULL), '[]'
      ) AS detections
    FROM crop_samples cs
    LEFT JOIN inference_results ir ON cs.id = ir.sample_id
    LEFT JOIN users u ON cs.user_id = u.id
    WHERE ($1::text = 'admin' OR cs.user_id = $2)
    GROUP BY cs.id, u.full_name, u.email
    ORDER BY cs.created_at DESC;
  `;

  const result = await pool.query(query, [isAdmin ? 'admin' : 'user', userId]);
  return result.rows;
};

module.exports = {
  saveInferenceTransaction,
  getSamplesHistory,
};
