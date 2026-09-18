// middleware/auth.js — JWT Authentication Middleware
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'org-chart-super-secret-key-2026';

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนใช้งาน (Missing Token)' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'เซสชันหมดอายุหรือ Token ไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' });
  }
}

module.exports = { verifyToken, JWT_SECRET };
