const express = require('express');
const router = express.Router();
const fieldController = require('../controllers/fieldController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, fieldController.getFields);
router.post('/', authenticateToken, fieldController.createField);
router.get('/:id', authenticateToken, fieldController.getFieldById);

module.exports = router;
