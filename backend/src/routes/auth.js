// routes/auth.js — Admin Authentication API
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login — เข้าสู่ระบบแอดมิน
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอก Username และ Password ให้ครบถ้วน',
    });
  }

  try {
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username.trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username หรือ Password ไม่ถูกต้อง',
      });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username หรือ Password ไม่ถูกต้อง',
      });
    }

    // สร้าง JWT Token อายุ 7 วัน
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me — ตรวจสอบสถานะการล็อกอินของผู้ใช้ปัจจุบัน
// ─────────────────────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, role, created_at FROM admins WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
