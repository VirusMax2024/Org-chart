// db/migrate_v2.js — Migration for Departments, Site Settings, Admin Auth, and Employee Layout Coordinates
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./index');

async function migrateV2() {
  console.log('🔧 Running Database Migration V2...');
  try {
    // 1. ตาราง departments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(30) DEFAULT '#3b82f6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Table departments checked/created');

    // 2. ตาราง site_settings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT PRIMARY KEY DEFAULT 1,
        company_name VARCHAR(255) DEFAULT 'BORCELLE',
        company_subtitle VARCHAR(255) DEFAULT 'Organizational Structure',
        company_logo_url TEXT,
        header_title TEXT DEFAULT 'ORGANIZATIONAL\nSTRUCTURE',
        header_subtitle TEXT DEFAULT 'team members across your organization',
        bg_image_url TEXT,
        bg_overlay_opacity VARCHAR(20) DEFAULT '0.85',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Table site_settings checked/created');

    // 3. ตาราง admins
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✅ Table admins checked/created');

    // 4. เพิ่มคอลัมน์ในตาราง employees สำหรับบันทึกพิกัด X, Y และ department_id
    await pool.query(`
      ALTER TABLE employees 
        ADD COLUMN IF NOT EXISTS position_x DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS position_y DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS department_id INT REFERENCES departments(id) ON DELETE SET NULL
    `);
    console.log('  ✅ Added position_x, position_y, department_id to employees');

    // 5. Seed ข้อมูลเริ่มต้น site_settings (row id = 1)
    await pool.query(`
      INSERT INTO site_settings (id, company_name, company_subtitle, header_title, header_subtitle)
      VALUES (1, 'BORCELLE', 'Organizational Structure', 'ORGANIZATIONAL\nSTRUCTURE', 'team members across your organization')
      ON CONFLICT (id) DO NOTHING
    `);
    console.log('  ✅ Seeded site_settings row');

    // 6. Seed ข้อมูลเริ่มต้น departments
    const defaultDepts = [
      { name: 'Executive',  desc: 'C-Suite and Executive Leadership', color: '#3b82f6' },
      { name: 'Finance',    desc: 'Finance, Accounting & Auditing',   color: '#10b981' },
      { name: 'Operations', desc: 'Operations & Business Strategy',   color: '#a855f7' },
      { name: 'Marketing',  desc: 'Marketing, Branding & Growth',     color: '#f59e0b' },
      { name: 'HR',         desc: 'Human Resources & People Ops',     color: '#ef4444' },
      { name: 'IT',         desc: 'Software Development & Tech',      color: '#0ea5e9' },
    ];

    for (const d of defaultDepts) {
      await pool.query(`
        INSERT INTO departments (name, description, color)
        VALUES ($1, $2, $3)
        ON CONFLICT (name) DO NOTHING
      `, [d.name, d.desc, d.color]);
    }
    console.log('  ✅ Seeded default departments');

    // 7. Seed Admin เริ่มต้น (username: admin, password: admin123)
    const existingAdmin = await pool.query(`SELECT id FROM admins WHERE username = 'admin'`);
    if (existingAdmin.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin123', salt);
      await pool.query(`
        INSERT INTO admins (username, password_hash, role)
        VALUES ('admin', $1, 'superadmin')
      `, [hash]);
      console.log('  ✅ Seeded default admin user (admin / admin123)');
    } else {
      console.log('  ℹ️ Admin user already exists');
    }

    console.log('\n🎉 Migration V2 Completed Successfully!');
  } catch (err) {
    console.error('❌ Migration V2 failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateV2();
