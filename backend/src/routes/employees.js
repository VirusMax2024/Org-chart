// routes/employees.js — CRUD API พร้อม multer file upload และ Cloudflare R2
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const pool    = require('../db');
const { uploadImageToR2, deleteImageFromR2 } = require('../services/r2Service');

// ─── Multer Config: ใช้ memoryStorage เพื่อรองรับ Vercel Serverless และส่งต่อขึ้น R2 ─────
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ─── Helper: แปลง row ให้ frontend ───────────────────────────
const formatEmployee = (row) => ({
  ...row,
  // รองรับทั้ง name และ full_name เพื่อ backward compat
  full_name:  row.name,
  name:       row.name,
  parent_id:  row.parent_id ? parseInt(row.parent_id) : null,
});

// ─────────────────────────────────────────────────────────────
// GET /api/employees — ดึงพนักงานทั้งหมด
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY id ASC');
    res.json({ success: true, data: result.rows.map(formatEmployee) });
  } catch (err) {
    console.error('GET /employees error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch employees' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/employees/:id — ดึงพนักงานรายบุคคล
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Employee not found' });
    res.json({ success: true, data: formatEmployee(result.rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch employee' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/employees — สร้างพนักงานใหม่
// รองรับ multipart/form-data (file upload) และ application/json
// ─────────────────────────────────────────────────────────────
router.post('/', upload.single('avatar'), async (req, res) => {
  // รองรับ name และ full_name (backward compat)
  const name       = req.body.name || req.body.full_name;
  const { position, department, phone, email, social, parent_id, layout_type, rank, staff_id } = req.body;

  // ถ้ามีไฟล์ upload ส่งขึ้น Cloudflare R2, ไม่งั้นใช้ avatar_url จาก body
  let avatar_url = req.body.avatar_url || null;
  if (req.file) {
    try {
      avatar_url = await uploadImageToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
    } catch (uploadErr) {
      console.error('R2 upload error in POST:', uploadErr);
    }
  }

  if (!name || !position) {
    return res.status(400).json({
      success: false,
      message: 'name และ position จำเป็นต้องระบุ',
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO employees (name, position, department, phone, email, social, avatar_url, parent_id, layout_type, rank, staff_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        name,
        position,
        department    || null,
        phone         || null,
        email         || null,
        social        || null,
        avatar_url,
        parent_id ? parseInt(parent_id) : null,
        layout_type || 'horizontal',
        rank          || null,
        staff_id      || null,
      ]
    );

    const newEmp = result.rows[0];

    // จัดการลูกน้องในสายงาน (subordinate_ids) ถ้ามีระบุ
    if (req.body.subordinate_ids !== undefined) {
      let subIds = [];
      try {
        subIds = typeof req.body.subordinate_ids === 'string'
          ? JSON.parse(req.body.subordinate_ids)
          : req.body.subordinate_ids;
      } catch (e) {
        subIds = [];
      }
      if (Array.isArray(subIds) && subIds.length > 0) {
        await pool.query('UPDATE employees SET parent_id = $1 WHERE id = ANY($2::int[])', [newEmp.id, subIds]);
      }
    }

    res.status(201).json({ success: true, data: formatEmployee(newEmp) });
  } catch (err) {
    console.error('POST /employees error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create employee' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/employees/:id — อัปเดตข้อมูลพนักงาน
// ─────────────────────────────────────────────────────────────
router.put('/:id', upload.single('avatar'), async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    const existing = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
    if (existing.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Employee not found' });

    const emp  = existing.rows[0];
    const name = req.body.name || req.body.full_name;
    const { position, department, phone, email, social, parent_id, layout_type, rank, staff_id } = req.body;

    // ป้องกัน circular reference
    if (parent_id && parseInt(parent_id, 10) === id)
      return res.status(400).json({ success: false, message: 'Employee cannot be their own parent' });

    // ถ้ามีไฟล์ใหม่ อัปโหลดขึ้น R2 และลบรูปเก่า
    let avatar_url = emp.avatar_url;
    if (req.file) {
      try {
        avatar_url = await uploadImageToR2(req.file.buffer, req.file.originalname, req.file.mimetype);
        if (emp.avatar_url) {
          await deleteImageFromR2(emp.avatar_url);
          if (emp.avatar_url.startsWith('/uploads/')) {
            const oldPath = path.join(__dirname, '../../', emp.avatar_url);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
        }
      } catch (uploadErr) {
        console.error('R2 upload error in PUT:', uploadErr);
      }
    } else if (req.body.avatar_url !== undefined) {
      avatar_url = req.body.avatar_url || null;
    }

    const result = await pool.query(
      `UPDATE employees
       SET name        = $1,
           position    = $2,
           department  = $3,
           phone       = $4,
           email       = $5,
           social      = $6,
           avatar_url  = $7,
           parent_id   = $8,
           layout_type = $9,
           rank        = $10,
           staff_id    = $11,
           updated_at  = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        name       || emp.name,
        position   || emp.position,
        department  !== undefined ? (department  || null) : emp.department,
        phone       !== undefined ? (phone       || null) : emp.phone,
        email       !== undefined ? (email       || null) : emp.email,
        social      !== undefined ? (social      || null) : emp.social,
        avatar_url,
        parent_id   !== undefined ? (parent_id ? parseInt(parent_id) : null) : emp.parent_id,
        layout_type !== undefined ? (layout_type || 'horizontal') : (emp.layout_type || 'horizontal'),
        rank        !== undefined ? (rank        || null) : emp.rank,
        staff_id    !== undefined ? (staff_id    || null) : emp.staff_id,
        id,
      ]
    );

    // จัดการลูกน้องในสายงาน (subordinate_ids) ถ้ามีระบุ
    if (req.body.subordinate_ids !== undefined) {
      let subIds = [];
      try {
        subIds = typeof req.body.subordinate_ids === 'string'
          ? JSON.parse(req.body.subordinate_ids)
          : req.body.subordinate_ids;
      } catch (e) {
        subIds = [];
      }
      if (Array.isArray(subIds)) {
        // ปลดลูกน้องเก่าที่ไม่ได้ถูกเลือกแล้ว
        await pool.query(
          'UPDATE employees SET parent_id = NULL WHERE parent_id = $1 AND NOT (id = ANY($2::int[]))',
          [id, subIds.length > 0 ? subIds : [-1]]
        );
        // กำหนดลูกน้องใหม่ที่ถูกเลือกให้มี parent_id = id
        if (subIds.length > 0) {
          await pool.query(
            'UPDATE employees SET parent_id = $1 WHERE id = ANY($2::int[])',
            [id, subIds]
          );
        }
      }
    }

    // รีเซ็ตพิกัด position_x, position_y เป็น NULL เพื่อให้อัลกอริทึมจัดระเบียบต้นไม้ทำงานใหม่อัตโนมัติ
    await pool.query(
      'UPDATE employees SET position_x = NULL, position_y = NULL WHERE id = $1 OR parent_id = $1',
      [id]
    );

    res.json({ success: true, data: formatEmployee(result.rows[0]) });
  } catch (err) {
    console.error('PUT /employees/:id error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update employee' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/employees/:id — ลบพนักงาน
// ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const existing = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
    if (existing.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Employee not found' });

    const emp = existing.rows[0];
    // ย้ายลูกน้องไปหา parent ของคนที่ถูกลบ
    await pool.query('UPDATE employees SET parent_id = $1 WHERE parent_id = $2', [emp.parent_id, id]);
    await pool.query('DELETE FROM employees WHERE id = $1', [id]);

    // ลบรูปออกจาก R2 หรือ local
    if (emp.avatar_url) {
      await deleteImageFromR2(emp.avatar_url);
      if (emp.avatar_url.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '../../', emp.avatar_url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    res.json({ success: true, message: `Employee #${id} deleted successfully` });
  } catch (err) {
    console.error('DELETE /employees/:id error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete employee' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/employees/layout — บันทึกพิกัด X, Y แบบ Batch จาก Canvas Editor
// ─────────────────────────────────────────────────────────────
router.put('/layout/save', async (req, res) => {
  const { positions } = req.body; // Array of { id, position_x, position_y }

  if (!Array.isArray(positions)) {
    return res.status(400).json({ success: false, message: 'positions ต้องเป็น Array' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of positions) {
      if (item.id !== undefined && item.position_x !== undefined && item.position_y !== undefined) {
        await client.query(
          `UPDATE employees 
           SET position_x = $1, position_y = $2, updated_at = NOW()
           WHERE id = $3`,
          [parseFloat(item.position_x), parseFloat(item.position_y), parseInt(item.id, 10)]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'บันทึกพิกัดผังองค์กรสำเร็จ' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Save layout error:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึก Layout' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/employees/layout/reset — รีเซ็ตพิกัดกลับเป็นค่า Auto-Layout
// ─────────────────────────────────────────────────────────────
router.post('/layout/reset', async (req, res) => {
  try {
    await pool.query('UPDATE employees SET position_x = NULL, position_y = NULL');
    res.json({ success: true, message: 'รีเซ็ตพิกัดผังองค์กรกลับเป็นค่าเริ่มต้นสำเร็จ' });
  } catch (err) {
    console.error('Reset layout error:', err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการรีเซ็ต Layout' });
  }
});

module.exports = router;
