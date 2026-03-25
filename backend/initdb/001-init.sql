CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  otp_code VARCHAR(20),
  otp_expires_at TIMESTAMP,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crop_samples (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sample_name VARCHAR(255) NOT NULL,
  crop_type VARCHAR(255),
  image_url TEXT,
  file_size INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inference_results (
  id SERIAL PRIMARY KEY,
  sample_id INTEGER NOT NULL REFERENCES crop_samples(id) ON DELETE CASCADE,
  disease_class VARCHAR(255) NOT NULL,
  confidence NUMERIC(10, 6) NOT NULL,
  bounding_boxes JSONB NOT NULL,
  model_version VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_crop_samples_user_id ON crop_samples(user_id);
CREATE INDEX IF NOT EXISTS idx_inference_results_sample_id ON inference_results(sample_id);
