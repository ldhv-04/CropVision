const pool = require('../config/db');

// Dam bao bang users co cot role de phan quyen admin/user.
const ensureUserRoleColumn = async () => {
  const query = `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
  `;

  await pool.query(query);
};

const getUserByEmail = async (email) => {
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0];
};

const createUser = async (fullName, email, passwordHash, otpCode, otpExpiresAt) => {
  const query = `
    INSERT INTO users (full_name, email, password_hash, otp_code, otp_expires_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, full_name, email;
  `;
  const values = [fullName, email, passwordHash, otpCode, otpExpiresAt];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Tao hoac dong bo tai khoan admin co dinh trong bang users.
const upsertAdminUser = async (fullName, email, passwordHash) => {
  const query = `
    INSERT INTO users (full_name, email, password_hash, is_verified, role, otp_code, otp_expires_at)
    VALUES ($1, $2, $3, TRUE, 'admin', NULL, NULL)
    ON CONFLICT (email)
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      password_hash = EXCLUDED.password_hash,
      is_verified = TRUE,
      role = 'admin',
      otp_code = NULL,
      otp_expires_at = NULL
    RETURNING id, full_name, email, role;
  `;
  const values = [fullName, email, passwordHash];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const verifyUserAccount = async (email) => {
  const query = `
    UPDATE users 
    SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL 
    WHERE email = $1 
    RETURNING id;
  `;
  await pool.query(query, [email]);
};

module.exports = {
  ensureUserRoleColumn,
  getUserByEmail,
  createUser,
  upsertAdminUser,
  verifyUserAccount
};
