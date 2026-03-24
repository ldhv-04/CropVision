const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const mailService = require('../utils/mailService');

const JWT_SECRET = process.env.JWT_SECRET || 'khoa_luan_cropvision_secret_key_2026';

const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email này đã được đăng ký.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 15 * 60000);

    // Dam bao bang users da san sang cho co che role truoc khi tao user moi.
    await userModel.ensureUserRoleColumn();
    await userModel.createUser(fullName, email, passwordHash, otpCode, otpExpiresAt);
    await mailService.sendOTP(email, otpCode);

    res.json({
      success: true,
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực.',
    });
  } catch (error) {
    console.error('Lỗi tại authController.register:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
    }

    if (user.is_verified) {
      return res.status(400).json({ success: false, message: 'Tài khoản này đã được xác thực.' });
    }

    if (user.otp_code !== otpCode) {
      return res.status(400).json({ success: false, message: 'Mã xác thực không chính xác.' });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ success: false, message: 'Mã xác thực đã hết hạn.' });
    }

    await userModel.verifyUserAccount(email);

    res.json({ success: true, message: 'Xác thực tài khoản thành công.' });
  } catch (error) {
    console.error('Lỗi tại authController.verifyEmail:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ success: false, message: 'Vui lòng xác thực email trước khi đăng nhập.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
    }

    const resolvedRole = user.role || 'user';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: resolvedRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: resolvedRole === 'admin' ? 'Đăng nhập admin thành công.' : 'Đăng nhập thành công.',
      data: {
        token,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: resolvedRole,
        },
      },
    });
  } catch (error) {
    console.error('Lỗi tại authController.login:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ.' });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
};
