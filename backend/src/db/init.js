// db/init.js — สร้างตาราง employees ใน Aiven PostgreSQL (run once)
require('dotenv').config();
const pool = require('./index');

async function initDatabase() {
  console.log('🔧 Initializing Aiven PostgreSQL database...');

  try {
    // ทดสอบ connection ก่อน
    const testResult = await pool.query('SELECT NOW() as current_time');
    console.log(`✅ Connected to PostgreSQL at: ${testResult.rows[0].current_time}`);

    // สร้างตาราง employees
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(255) NOT NULL,
        position   VARCHAR(255) NOT NULL,
        department VARCHAR(255),
        parent_id  INTEGER REFERENCES employees(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Table "employees" is ready');

    // สร้าง function สำหรับ auto-update updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // สร้าง trigger สำหรับ updated_at
    await pool.query(`
      DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
      CREATE TRIGGER update_employees_updated_at
        BEFORE UPDATE ON employees
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Trigger "update_employees_updated_at" is ready');

    console.log('\n🎉 Database initialization complete!');
    console.log('   You can now run: npm run dev:backend');

  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
    console.error('\n💡 ตรวจสอบ:');
    console.error('   1. ไฟล์ backend/.env มี DATABASE_URL หรือยัง?');
    console.error('   2. DATABASE_URL ถูกต้องตามที่ได้จาก Aiven Console หรือไม่?');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
