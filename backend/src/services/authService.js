const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const mailService = require('../utils/mailService');

// JWT_SECRET is validated at startup by authMiddleware — shared from process.env directly.
const JWT_SECRET = process.env.JWT_SECRET;

// Dang ky nguoi dung: hash password, tao OTP, luu vao DB, gui email.
const registerUser = async (fullName, email, password) => {
  const existingUser = await userModel.getUserByEmail(email);
  if (existingUser) {
    const err = new Error('Email này đã được đăng ký.');
    err.status = 400;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiresAt = new Date(Date.now() + 15 * 60000);

  // Dam bao bang users da san sang cho co che role truoc khi tao user moi.
  await userModel.ensureUserRoleColumn();
  await userModel.createUser(fullName, email, passwordHash, otpCode, otpExpiresAt);
  await mailService.sendOTP(email, otpCode);
};

// Xac thuc OTP email cua nguoi dung.
const verifyUserOtp = async (email, otpCode) => {
  const user = await userModel.getUserByEmail(email);
  if (!user) {
    const err = new Error('Không tìm thấy tài khoản.');
    err.status = 404;
    throw err;
  }

  if (user.is_verified) {
    const err = new Error('Tài khoản này đã được xác thực.');
    err.status = 400;
    throw err;
  }

  if (user.otp_code !== otpCode) {
    const err = new Error('Mã xác thực không chính xác.');
    err.status = 400;
    throw err;
  }

  if (new Date() > new Date(user.otp_expires_at)) {
    const err = new Error('Mã xác thực đã hết hạn.');
    err.status = 400;
    throw err;
  }

  await userModel.verifyUserAccount(email);
};

// Dang nhap: kiem tra mat khau, ky JWT va tra ve session.
const loginUser = async (email, password) => {
  const user = await userModel.getUserByEmail(email);
  if (!user) {
    const err = new Error('Email hoặc mật khẩu không đúng.');
    err.status = 401;
    throw err;
  }

  if (!user.is_verified) {
    const err = new Error('Vui lòng xác thực email trước khi đăng nhập.');
    err.status = 403;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Email hoặc mật khẩu không đúng.');
    err.status = 401;
    throw err;
  }

  const resolvedRole = user.role || 'user';
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: resolvedRole },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: resolvedRole,
    },
  };
};

module.exports = {
  registerUser,
  verifyUserOtp,
  loginUser,
};
