const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Bao ve toan bo route admin bang JWT va role admin.
router.use(authenticateToken, requireAdmin);

router.get('/summary', adminController.getSummary);
router.get('/users', adminController.getUsers);
router.get('/samples', adminController.getSamples);
router.patch('/users/:userId/role', adminController.updateUserRole);
router.delete('/users/:userId', adminController.deleteUser);
router.delete('/samples/:sampleId', adminController.deleteSample);

module.exports = router;
