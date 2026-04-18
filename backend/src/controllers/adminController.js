const adminModel = require('../models/adminModel');
const adminService = require('../services/adminService');

const ALLOWED_ROLES = new Set(['user', 'admin']);

// Tra ve so lieu tong quan cho dashboard admin.
const getSummary = async (req, res) => {
  try {
    const summary = await adminModel.getAdminSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Loi tai adminController.getSummary:', error.message);
    res.status(500).json({ success: false, message: 'Khong the tai thong ke admin.' });
  }
};

// Tra ve danh sach nguoi dung de admin quan ly role/trang thai.
const getUsers = async (req, res) => {
  try {
    const users = await adminModel.getUsersWithStats();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Loi tai adminController.getUsers:', error.message);
    res.status(500).json({ success: false, message: 'Khong the tai danh sach nguoi dung.' });
  }
};

// Tra ve danh sach mau vat de admin co the theo doi va xoa.
const getSamples = async (req, res) => {
  try {
    const samples = await adminModel.getSamplesWithStats();
    res.json({ success: true, data: samples });
  } catch (error) {
    console.error('Loi tai adminController.getSamples:', error.message);
    res.status(500).json({ success: false, message: 'Khong the tai danh sach mau vat.' });
  }
};

// Cho phep admin cap nhat role cho user.
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ success: false, message: 'Role khong hop le.' });
    }

    if (req.user.userId === userId && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Admin khong the tu ha quyen cua chinh minh.' });
    }

    const updatedUser = await adminModel.updateUserRoleById(userId, role);
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Khong tim thay user can cap nhat.' });
    }

    res.json({ success: true, message: 'Cap nhat role thanh cong.', data: updatedUser });
  } catch (error) {
    console.error('Loi tai adminController.updateUserRole:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Khong the cap nhat role.' });
  }
};

// Cho phep admin xoa user khong phai admin co dinh.
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.userId === userId) {
      return res.status(400).json({ success: false, message: 'Admin khong the tu xoa tai khoan dang dang nhap.' });
    }

    const deletedUser = await adminModel.deleteUserById(userId);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'Khong tim thay user can xoa.' });
    }

    res.json({ success: true, message: 'Xoa nguoi dung thanh cong.', data: deletedUser });
  } catch (error) {
    console.error('Loi tai adminController.deleteUser:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Khong the xoa user.' });
  }
};

const deleteSample = async (req, res) => {
  try {
    const { sampleId } = req.params;
    const deletedSample = await adminService.deleteSampleWithFile(sampleId);

    if (!deletedSample) {
      return res.status(404).json({ success: false, message: 'Khong tim thay mau vat can xoa.' });
    }

    res.json({ success: true, message: 'Xoa mau vat thanh cong.', data: deletedSample });
  } catch (error) {
    console.error('Loi tai adminController.deleteSample:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Khong the xoa mau vat.' });
  }
};

module.exports = {
  getSummary,
  getUsers,
  getSamples,
  updateUserRole,
  deleteUser,
  deleteSample,
};
