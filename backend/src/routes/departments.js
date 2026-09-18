// routes/departments.js — Department Management CRUD API
const express = require('express');
const router  = express.Router();
const pool    = require('../db');
const { verifyToken } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// GET /api/departments — ดึงรายชื่อแผนกทั้งหมดพร้อมจำนวนพนักงาน
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        d.id,
        d.name,
        d.description,
        d.color,
        d.created_at,
        d.updated_at,
        COUNT(e.id)::int AS employee_count
      FROM departments d
      LEFT JOIN employees e ON (e.department = d.name OR e.department_id = d.id)
      GROUP BY d.id
      ORDER BY d.id ASC
    `);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('GET /departments error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to fetch departments' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/departments — สร้างแผนกใหม่ (ต้องการ Login)
// ─────────────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const { name, description, color } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อแผนก' });
  }

  try {
    // เช็กว่ามีชื่อแผนกซ้ำหรือไม่
    const existing = await pool.query('SELECT id FROM departments WHERE LOWER(name) = LOWER($1)', [name.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'มีชื่อแผนกนี้อยู่ในระบบแล้ว' });
    }

    const result = await pool.query(
      `INSERT INTO departments (name, description, color)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), description || '', color || '#3b82f6']
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('POST /departments error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to create department' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/departments/:id — แก้ไขข้อมูลแผนก (ต้องการ Login)
// ─────────────────────────────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, description, color } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อแผนก' });
  }

  try {
    const existing = await pool.query('SELECT * FROM departments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบแผนกที่ระบุ' });
    }

    const oldName = existing.rows[0].name;
    const newName = name.trim();

    // อัปเดตตาราง departments
    const result = await pool.query(
      `UPDATE departments
       SET name = $1, description = $2, color = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [newName, description || '', color || existing.rows[0].color, id]
    );

    // ซิงค์ชื่อแผนกไปยังตาราง employees เพื่อความสอดคล้อง
    if (oldName !== newName) {
      await pool.query('UPDATE employees SET department = $1 WHERE department = $2', [newName, oldName]);
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('PUT /departments/:id error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to update department' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/departments/:id — ลบแผนก (ต้องการ Login)
// ─────────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    const existing = await pool.query('SELECT * FROM departments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบแผนกที่ระบุ' });
    }

    const deptName = existing.rows[0].name;

    // เคลียร์ค่า department ของพนักงานในแผนกนี้ให้เป็น Other หรือ NULL ป้องกันข้อมูลหลุด
    await pool.query(`
      UPDATE employees 
      SET department = 'Other', department_id = NULL 
      WHERE department = $1 OR department_id = $2
    `, [deptName, id]);

    await pool.query('DELETE FROM departments WHERE id = $1', [id]);

    res.json({ success: true, message: `ลบแผนก ${deptName} สำเร็จ` });
  } catch (err) {
    console.error('DELETE /departments/:id error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete department' });
  }
});

module.exports = router;
