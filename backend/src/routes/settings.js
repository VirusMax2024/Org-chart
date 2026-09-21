// routes/settings.js — Site Settings & Branding Customization API
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const pool    = require('../db');
const { verifyToken } = require('../middleware/auth');
const { uploadImageToR2 } = require('../services/r2Service');

// ─── Multer Config: ใช้ memoryStorage เพื่อรองรับ Vercel Serverless ───────────
const storage = multer.memoryStorage();

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
router.get(['/', ''], async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM site_settings WHERE id = 1');
    if (result.rows.length === 0) {
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
    res.status(500).json({ success: false, message: 'Failed to fetch site settings: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/settings — บันทึกการตั้งค่าแบรนด์ (ต้องการ Login)
// รองรับการอัปโหลดไฟล์ logo และ bg_image
// ─────────────────────────────────────────────────────────────
router.put(
  ['/', ''],
  verifyToken,
  (req, res, next) => {
    upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'bg_image', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        console.error('⚠️ [Multer Error in /settings]:', err.message);
        return res.status(400).json({
          success: false,
          message: 'ข้อผิดพลาดในการอัปโหลดไฟล์: ' + (err.message || 'File upload error'),
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const current = await pool.query('SELECT * FROM site_settings WHERE id = 1');
      const cur = current.rows[0] || {};

      let logoUrl = cur.company_logo_url;
      if (req.files && req.files['logo'] && req.files['logo'][0]) {
        const logoFile = req.files['logo'][0];
        try {
          logoUrl = await uploadImageToR2(logoFile.buffer, logoFile.originalname, logoFile.mimetype);
        } catch (uploadErr) {
          console.warn('Fallback to Base64 for logo:', uploadErr.message);
          const mime = logoFile.mimetype || 'image/png';
          logoUrl = `data:${mime};base64,${logoFile.buffer.toString('base64')}`;
        }
      } else if (req.body.company_logo_url !== undefined) {
        logoUrl = req.body.company_logo_url || null;
      }

      let bgUrl = cur.bg_image_url;
      if (req.files && req.files['bg_image'] && req.files['bg_image'][0]) {
        const bgFile = req.files['bg_image'][0];
        try {
          bgUrl = await uploadImageToR2(bgFile.buffer, bgFile.originalname, bgFile.mimetype);
        } catch (uploadErr) {
          console.warn('Fallback to Base64 for bg_image:', uploadErr.message);
          const mime = bgFile.mimetype || 'image/jpeg';
          bgUrl = `data:${mime};base64,${bgFile.buffer.toString('base64')}`;
        }
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
      res.status(500).json({ success: false, message: 'Failed to update site settings: ' + err.message });
    }
  }
);

module.exports = router;
