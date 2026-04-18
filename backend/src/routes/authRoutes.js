const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Middleware xac thuc dau vao don gian — tranh xu ly request thieu truong bat buoc.
const validateRegister = (req, res, next) => {
  const { fullName, email, password } = req.body;
  if (!fullName?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Ho ten, email va mat khau la bat buoc.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Dia chi email khong hop le.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Mat khau phai co it nhat 8 ky tu.' });
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email?.trim() || !password) {
    return res.status(400).json({ success: false, message: 'Email va mat khau la bat buoc.' });
  }
  next();
};

const validateVerify = (req, res, next) => {
  const { email, otpCode } = req.body;
  if (!email?.trim() || !otpCode?.trim()) {
    return res.status(400).json({ success: false, message: 'Email va ma OTP la bat buoc.' });
  }
  if (!/^\d{6}$/.test(otpCode)) {
    return res.status(400).json({ success: false, message: 'Ma OTP phai la 6 chu so.' });
  }
  next();
};

router.post('/register', validateRegister, authController.register);
router.post('/verify', validateVerify, authController.verifyEmail);
router.post('/login', validateLogin, authController.login);

module.exports = router;