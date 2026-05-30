const axios = require('axios');
const fs = require('fs');
const path = require('path');
const inferenceModel = require('../models/inferenceModel');

const AI_CORE_URL = (process.env.AI_CORE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Kiem tra MIME type va kich thuoc file truoc khi xu ly.
const validateImageFile = (fileBuffer, mimeType) => {
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    const err = new Error(`Dinh dang anh khong duoc ho tro: ${mimeType}. Chi chap nhan JPEG, PNG, WebP, GIF.`);
    err.status = 415;
    throw err;
  }
  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    const err = new Error('Kich thuoc file vuot qua gioi han 10 MB.');
    err.status = 413;
    throw err;
  }
};

// Gui anh sang AI Core va tra ve ket qua suy luan.
const callAiCore = async (fileBuffer, originalName, mimeType) => {
  validateImageFile(fileBuffer, mimeType);
  const blob = new Blob([fileBuffer], { type: mimeType });
  const formData = new FormData();
  formData.append('file', blob, originalName);

  const response = await axios.post(`${AI_CORE_URL}/predict`, formData);
  return response.data;
};

// Luu file anh vat ly vao thu muc uploads va tra ve duong dan tuong doi.
// Sanitize: chi giu ky tu alphanumeric, dau cham va gach duoi de ngan path traversal.
const persistUpload = async (fileBuffer, originalName) => {
  await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, '');
  const baseName = path.basename(originalName, path.extname(originalName))
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 64); // cap ten file o 64 ky tu

  const safeFileName = `${Date.now()}_${baseName}${ext}`;
  const filePath = path.join(UPLOAD_DIR, safeFileName);

  // Double-check: dam bao duong dan khong thoat ra ngoai UPLOAD_DIR.
  if (!filePath.startsWith(UPLOAD_DIR + path.sep) && filePath !== UPLOAD_DIR) {
    throw new Error('Phat hien path traversal trong ten file.');
  }

  await fs.promises.writeFile(filePath, fileBuffer);
  return { safeFileName, imageUrl: `/uploads/${safeFileName}` };
};

// Luu giao dich suy luan (sample + cac box) vao database.
const saveResult = async (userId, file, imageUrl, inferenceData, extra = {}) => {
  const sampleData = {
    userId,
    fieldId: extra.fieldId,
    sourceType: extra.sourceType,
    batchId: extra.batchId,
    sampleName: file.originalname,
    cropType: 'unknown',
    imageUrl,
    fileSize: file.size,
    latitude: extra.latitude || null,
    longitude: extra.longitude || null,
  };

  return inferenceModel.saveInferenceTransaction(sampleData, inferenceData.boxes);
};

module.exports = {
  validateImageFile,
  callAiCore,
  persistUpload,
  saveResult,
};
