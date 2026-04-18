const jwt = require('jsonwebtoken');

// Throw at startup if JWT_SECRET is not configured — fail-fast prevents silent insecurity.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start securely.');
}

// Doc va xac thuc JWT tu header Authorization de gan user vao request.
const authenticateToken = (req, res, next) => {
  const authorizationHeader = req.headers.authorization || '';
  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Thiếu token xác thực.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

// Chan cac request khong co role admin.
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập chức năng admin.' });
  }

  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
};
