const inferenceService = require('../services/inferenceService');
const inferenceModel = require('../models/inferenceModel');

const analyzeImage = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, message: 'Ban can dang nhap de phan tich anh.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui long tai len mot buc anh.' });
    }

    const inferenceData = await inferenceService.callAiCore(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const { imageUrl } = await inferenceService.persistUpload(req.file.buffer, req.file.originalname);

    if (inferenceData.success) {
      const savedId = await inferenceService.saveResult(req.user.userId, req.file, imageUrl, inferenceData);
      console.info(`[Inference] Sample saved → DB id=${savedId} user=${req.user.userId}`);
    }

    res.json({
      success: true,
      message: 'Phan tich va luu tru thanh cong',
      data: inferenceData,
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
