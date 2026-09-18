// routes/settings.js — Site Settings & Branding Customization API
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const pool    = require('../db');
const { verifyToken } = require('../middleware/auth');

// ─── Multer Config: สำหรับอัปโหลด Logo และ Background Image ──
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname === 'logo' ? 'logo' : 'bg';
    cb(null, `${prefix}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น'));
  },
});

// ─────────────────────────────────────────────────────────────
// GET /api/settings — ดึงการตั้งค่าแบรนด์และหน้าตาเว็บ
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM site_settings WHERE id = 1');
    if (result.rows.length === 0) {
      // สร้าง default ถ้ายังไม่มี
      const created = await pool.query(`
        INSERT INTO site_settings (id, company_name, company_subtitle, header_title, header_subtitle)
        VALUES (1, 'BORCELLE', 'Organizational Structure', 'ORGANIZATIONAL\nSTRUCTURE', 'team members across your organization')
        RETURNING *
      `);
      return res.json({ success: true, data: created.rows[0] });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('GET /settings error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch site settings' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/settings — บันทึกการตั้งค่าแบรนด์ (ต้องการ Login)
// รองรับการอัปโหลดไฟล์ logo และ bg_image
// ─────────────────────────────────────────────────────────────
router.put(
  '/',
  verifyToken,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'bg_image', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const current = await pool.query('SELECT * FROM site_settings WHERE id = 1');
      const cur = current.rows[0] || {};

      let logoUrl = cur.company_logo_url;
      if (req.files && req.files['logo'] && req.files['logo'][0]) {
        logoUrl = `/uploads/${req.files['logo'][0].filename}`;
      } else if (req.body.company_logo_url !== undefined) {
        logoUrl = req.body.company_logo_url || null;
      }

      let bgUrl = cur.bg_image_url;
      if (req.files && req.files['bg_image'] && req.files['bg_image'][0]) {
        bgUrl = `/uploads/${req.files['bg_image'][0].filename}`;
      } else if (req.body.bg_image_url !== undefined) {
        bgUrl = req.body.bg_image_url || null;
      }

      const companyName     = req.body.company_name     !== undefined ? req.body.company_name     : cur.company_name;
      const companySubtitle = req.body.company_subtitle !== undefined ? req.body.company_subtitle : cur.company_subtitle;
      const headerTitle     = req.body.header_title     !== undefined ? req.body.header_title     : cur.header_title;
      const headerSubtitle  = req.body.header_subtitle  !== undefined ? req.body.header_subtitle  : cur.header_subtitle;
      const bgOpacity       = req.body.bg_overlay_opacity !== undefined ? req.body.bg_overlay_opacity : cur.bg_overlay_opacity;

      const result = await pool.query(
        `UPDATE site_settings
         SET company_name        = $1,
             company_subtitle    = $2,
             company_logo_url    = $3,
             header_title        = $4,
             header_subtitle     = $5,
             bg_image_url        = $6,
             bg_overlay_opacity  = $7,
             updated_at          = NOW()
         WHERE id = 1
         RETURNING *`,
        [
          companyName     || 'BORCELLE',
          companySubtitle || 'Organizational Structure',
          logoUrl,
          headerTitle     || 'ORGANIZATIONAL\nSTRUCTURE',
          headerSubtitle  || 'team members across your organization',
          bgUrl,
          bgOpacity       || '0.85',
        ]
      );

      res.json({
        success: true,
        message: 'บันทึกการตั้งค่าเว็บไซต์สำเร็จ',
        data: result.rows[0],
      });
    } catch (err) {
      console.error('PUT /settings error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to update site settings' });
    }
  }
);

module.exports = router;
