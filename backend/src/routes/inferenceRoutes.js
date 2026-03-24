const express = require('express');
const multer = require('multer');
const inferenceController = require('../controllers/inferenceController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Bao ve route phan tich va lich su bang token dang nhap.
router.post('/analyze', authenticateToken, upload.single('image'), inferenceController.analyzeImage);
router.get('/samples', authenticateToken, inferenceController.getHistory);

module.exports = router;
