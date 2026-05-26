const pool = require('../config/db');

const getFields = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      'SELECT * FROM fields WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('getFields error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createField = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, crop_type, area, latitude, longitude } = req.body;

    if (!name || !crop_type || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required field data' });
    }

    const result = await pool.query(
      `INSERT INTO fields (user_id, name, crop_type, area, latitude, longitude) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, name, crop_type, area || null, latitude, longitude]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('createField error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getFieldById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const fieldId = req.params.id;

    const result = await pool.query(
      'SELECT * FROM fields WHERE id = $1 AND user_id = $2',
      [fieldId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Field not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('getFieldById error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getFields,
  createField,
  getFieldById
};
