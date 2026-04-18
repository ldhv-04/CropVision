const express = require('express');
const multer = require('multer');
const inferenceController = require('../controllers/inferenceController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Giai han kich thuoc file o tang router (truoc khi vao controller).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB hard limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Dinh dang anh khong ho tro: ${file.mimetype}`), false);
    }
  },
});

// Su kien xu ly loi tu multer (kich thuoc, dinh dang).
const handleMulterError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes('Dinh dang')) {
    return res.status(415).json({ success: false, message: err.message });
  }
  next(err);
};

// Bao ve route phan tich va lich su bang token dang nhap.
router.post(
  '/analyze',
  authenticateToken,
  upload.single('image'),
  handleMulterError,
  inferenceController.analyzeImage
);
router.get('/samples', authenticateToken, inferenceController.getHistory);

module.exports = router;
