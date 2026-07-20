const inferenceService = require('../services/inferenceService');
const inferenceModel = require('../models/inferenceModel');

/**
 * POST /api/inference/analyze
 * Phân tích ảnh bằng YOLO, lưu file và kết quả vào database.
 * Trả về boxes, image_base64, image_name (tên file gốc), và sample_id (nếu lưu thành công).
 *
 * Flow:
 * 1. Validate auth (userId required)
 * 2. Validate file (JPEG/PNG/WebP/GIF, max 10MB)
 * 3. Call AI Core (/predict) for YOLO inference
 * 4. Save image to uploads/ directory
 * 5. Save results to database (crop_samples + inference_results)
 * 6. Return inference data + sample_id for chat consultation linking
 *
 * Response Data:
 * - boxes: YOLO detection results [{class_name, confidence, x1, y1, x2, y2}]
 * - image_base64: Annotated image with bounding boxes
 * - image_name: Original filename
 * - sample_id: Database ID for linking to chat consultation (nullable if save fails)
 */
const analyzeImage = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, message: 'Ban can dang nhap de phan tich anh.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui long tai len mot buc anh.' });
    }

    // Gọi AI Core để phân tích ảnh
    const inferenceData = await inferenceService.callAiCore(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Lưu file ảnh vào thư mục uploads
    const { imageUrl } = await inferenceService.persistUpload(req.file.buffer, req.file.originalname);

    // Extract new fields for Phase 1, Drone integration, and GPS
    const { field_id, source_type, batch_id, latitude, longitude } = req.body;

    // Lưu kết quả vào database nếu phân tích thành công
    let sampleId = null;
    if (inferenceData.success) {
      sampleId = await inferenceService.saveResult(req.user.userId, req.file, imageUrl, inferenceData, {
        fieldId: field_id || null,
        sourceType: source_type || 'mobile',
        batchId: batch_id || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      });
      if (process.env.NODE_ENV !== 'test') {
        console.info(`[Inference] Sample saved → DB id=${sampleId} user=${req.user.userId}`);
      }
    }

    // Trả về kết quả cho frontend, bao gồm image_name và sample_id
    res.json({
      success: true,
      message: 'Phan tich va luu tru thanh cong',
      data: {
        ...inferenceData,
        image_name: inferenceData.filename || req.file.originalname,
        sample_id: sampleId,  // ID của sample trong database (dùng cho chat consultation)
      },
    });
  } catch (error) {
    console.error(`[Inference] analyzeImage error user=${req.user?.userId}:`, error.message);
    res.status(500).json({ success: false, message: 'Loi he thong may chu.' });
  }
};

const getHistory = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, message: 'Ban can dang nhap de xem lich su.' });
    }

    // Admin xem duoc toan bo, user thuong chi xem mau vat cua chinh minh.
    const historyData = await inferenceModel.getSamplesHistory({
      userId: req.user.userId,
      role: req.user.role,
    });

    res.json({
      success: true,
      message: 'Lay du lieu lich su thanh cong',
      data: historyData,
    });
  } catch (error) {
    console.error(`[Inference] getHistory error user=${req.user?.userId}:`, error.message);
    res.status(500).json({ success: false, message: 'Loi khi truy xuat du lieu tu co so du lieu.' });
  }
};

module.exports = {
  analyzeImage,
  getHistory,
};
