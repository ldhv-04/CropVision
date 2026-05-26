const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function run() {
  try {
    const email = 'farmer@cropvision.local';
    const password = 'Password@123';
    const fullName = 'Farmer Vu';
    
    // Check if user exists
    const check = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (check.rows.length > 0) {
      console.log(`User ${email} already exists. Updating password and verification status.`);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      await pool.query(
        'UPDATE users SET password_hash = $1, is_verified = true, role = $2, full_name = $3 WHERE email = $4',
        [passwordHash, 'user', fullName, email]
      );
    } else {
      console.log(`Creating new verified user ${email}.`);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      await pool.query(
        'INSERT INTO users (full_name, email, password_hash, is_verified, role) VALUES ($1, $2, $3, true, $4)',
        [fullName, email, passwordHash, 'user']
      );
    }
    console.log('Test user created successfully!');
  } catch (err) {
    console.error('Error creating test user:', err);
  } finally {
    pool.end();
  }
}

run();
