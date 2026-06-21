const authService = require('../services/authService');

const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    await authService.registerUser(fullName, email, password);
    res.json({ success: true, message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực.' });
  } catch (error) {
    console.error('Lỗi tại authController.register:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Lỗi máy chủ.' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    await authService.verifyUserOtp(email, otpCode);
    res.json({ success: true, message: 'Xác thực tài khoản thành công.' });
  } catch (error) {
    console.error('Lỗi tại authController.verifyEmail:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Lỗi máy chủ.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[AUTH DEBUG] Received login request: email="${email}", password=[redacted] (length=${password?.length})`);
    const session = await authService.loginUser(email, password);
    const isAdmin = session.user.role === 'admin';
    res.json({
      success: true,
      message: isAdmin ? 'Đăng nhập admin thành công.' : 'Đăng nhập thành công.',
      data: session,
    });
  } catch (error) {
    console.error('Lỗi tại authController.login:', error.message);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Lỗi máy chủ.' });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
};
