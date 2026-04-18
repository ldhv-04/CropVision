const pool = require('../config/db');

const FIXED_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@cropvision.local';

// Tong hop so lieu quan tri nhanh cho dashboard admin.
const getAdminSummary = async () => {
  const query = `
    SELECT
      (SELECT COUNT(*)::int FROM users) AS total_users,
      (SELECT COUNT(*)::int FROM users WHERE role = 'admin') AS total_admins,
      (SELECT COUNT(*)::int FROM crop_samples) AS total_samples,
      (SELECT COUNT(*)::int FROM inference_results) AS total_detections
  `;

  const result = await pool.query(query);
  return result.rows[0];
};

// Lay danh sach user kem so mau vat phuc vu thao tac quan ly.
const getUsersWithStats = async () => {
  const query = `
    SELECT
      u.id,
      u.full_name,
      u.email,
      u.role,
      u.is_verified,
      u.created_at,
      COUNT(cs.id)::int AS sample_count
    FROM users u
    LEFT JOIN crop_samples cs ON cs.user_id = u.id
    GROUP BY u.id
    ORDER BY
      CASE WHEN u.role = 'admin' THEN 0 ELSE 1 END,
      u.created_at DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

// Lay danh sach mau vat day du hon cho bang quan tri admin.
const getSamplesWithStats = async () => {
  const query = `
    SELECT
      cs.id,
      cs.sample_name,
      cs.crop_type,
      cs.image_url,
      cs.file_size,
      cs.created_at,
      u.full_name AS owner_name,
      u.email AS owner_email,
      COUNT(ir.id)::int AS detection_count,
      MAX(ir.confidence) AS top_confidence
    FROM crop_samples cs
    LEFT JOIN users u ON u.id = cs.user_id
    LEFT JOIN inference_results ir ON ir.sample_id = cs.id
    GROUP BY cs.id, u.full_name, u.email
    ORDER BY cs.created_at DESC
  `;

  const result = await pool.query(query);
  return result.rows;
};

// Cap nhat role cho user, dong thoi chan sua tren tai khoan admin co dinh.
const updateUserRoleById = async (userId, nextRole) => {
  const query = `
    UPDATE users
    SET role = $2
    WHERE id = $1 AND email <> $3
    RETURNING id, full_name, email, role, is_verified, created_at;
  `;

  const result = await pool.query(query, [userId, nextRole, FIXED_ADMIN_EMAIL]);
  return result.rows[0];
};

// Xoa user khong phai admin co dinh va tra user_id tren sample ve null.
const deleteUserById = async (userId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    if (!user) {
      await client.query('ROLLBACK');
      return null;
    }

    if (user.email === FIXED_ADMIN_EMAIL) {
      throw new Error('Không thể xóa tài khoản admin cố định.');
    }

    await client.query('UPDATE crop_samples SET user_id = NULL WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');
    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Xoa sample, cac detection lien quan va file anh da upload neu ton tai.
const deleteSampleById = async (sampleId) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const sampleResult = await client.query(
      'SELECT id, image_url FROM crop_samples WHERE id = $1',
      [sampleId]
    );
    const sample = sampleResult.rows[0];

    if (!sample) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('DELETE FROM inference_results WHERE sample_id = $1', [sampleId]);
    await client.query('DELETE FROM crop_samples WHERE id = $1', [sampleId]);

    await client.query('COMMIT');
    return sample;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  FIXED_ADMIN_EMAIL,
  getAdminSummary,
  getUsersWithStats,
  getSamplesWithStats,
  updateUserRoleById,
  deleteUserById,
  deleteSampleById,
};
