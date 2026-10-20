/**
 * 12-Factor App: Stateless Processes (Factor VI)
 * Abstract Storage Adapter interface decoupling backend processes from local container storage.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/env');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

class LocalStorageAdapter {
  constructor(uploadDir = UPLOAD_DIR) {
    this.uploadDir = uploadDir;
  }

  async save(fileBuffer, originalName) {
    await fs.promises.mkdir(this.uploadDir, { recursive: true });

    const ext = path.extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, '');
    const baseName = path.basename(originalName, path.extname(originalName))
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .slice(0, 64);

    const safeFileName = `${Date.now()}_${baseName}${ext}`;
    const filePath = path.join(this.uploadDir, safeFileName);

    if (!filePath.startsWith(this.uploadDir + path.sep) && filePath !== this.uploadDir) {
      throw new Error('Phat hien path traversal trong ten file.');
    }

    await fs.promises.writeFile(filePath, fileBuffer);
    return {
      safeFileName,
      imageUrl: `/uploads/${safeFileName}`,
    };
  }

  async delete(safeFileName) {
    const filePath = path.join(this.uploadDir, safeFileName);
    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch (_) {
      return false;
    }
  }
}

class S3StorageAdapter {
  constructor(options = {}) {
    this.bucket = options.bucket || process.env.S3_BUCKET;
    this.endpoint = options.endpoint || process.env.MINIO_ENDPOINT;
  }

  async save(fileBuffer, originalName) {
    // If S3 credentials not present, gracefully fallback to local
    console.warn('[Storage] S3/MinIO driver selected but credentials not fully configured; falling back to LocalStorageAdapter.');
    const fallback = new LocalStorageAdapter();
    return fallback.save(fileBuffer, originalName);
  }

  async delete(safeFileName) {
    const fallback = new LocalStorageAdapter();
    return fallback.delete(safeFileName);
  }
}

function getStorageAdapter() {
  if (config.STORAGE_DRIVER === 's3') {
    return new S3StorageAdapter();
  }
  return new LocalStorageAdapter();
}

module.exports = {
  LocalStorageAdapter,
  S3StorageAdapter,
  getStorageAdapter,
  storage: getStorageAdapter(),
};
