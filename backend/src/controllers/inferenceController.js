const axios = require('axios');
const fs = require('fs');
const path = require('path');
const inferenceModel = require('../models/inferenceModel');

const analyzeImage = async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, message: 'Ban can dang nhap de phan tich anh.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui long tai len mot buc anh.' });
    }

    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    const formData = new FormData();
    formData.append('file', blob, req.file.originalname);

    console.log(`Dang gui anh ${req.file.originalname} sang AI Core...`);
    const pythonResponse = await axios.post('http://127.0.0.1:8000/predict', formData);
    const inferenceData = pythonResponse.data;

    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeFileName = `${Date.now()}_${req.file.originalname.replace(/\s/g, '_')}`;
    const filePath = path.join(uploadDir, safeFileName);
    fs.writeFileSync(filePath, req.file.buffer);

    if (inferenceData.success) {
      const sampleData = {
        userId: req.user.userId,
        sampleName: req.file.originalname,
        cropType: 'unknown',
        imageUrl: `/uploads/${safeFileName}`,
        fileSize: req.file.size,
      };

      // Luu mau vat gan voi user dang dang nhap de phuc vu phan quyen lich su.
      const savedSampleId = await inferenceModel.saveInferenceTransaction(
        sampleData,
        inferenceData.boxes
      );
      console.log(`Da luu du lieu thanh cong vao Database voi ID: ${savedSampleId}`);
    }

    res.json({
      success: true,
      message: 'Phan tich va luu tru thanh cong',
      data: inferenceData,
    });
  } catch (error) {
    console.error('Loi tai Controller analyzeImage:', error.message);
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
    console.error('Loi tai Controller getHistory:', error.message);
    res.status(500).json({ success: false, message: 'Loi khi truy xuat du lieu tu co so du lieu.' });
  }
};

module.exports = {
  analyzeImage,
  getHistory,
};
