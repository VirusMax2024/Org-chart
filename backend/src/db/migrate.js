// db/migrate.js — ALTER TABLE เพิ่ม columns ใหม่ (run once)
require('dotenv').config();
const pool = require('./index');

async function migrate() {
  console.log('🔧 Running database migration...');
  try {
    // เพิ่ม columns ใหม่ถ้ายังไม่มี (ใช้ IF NOT EXISTS เพื่อความปลอดภัย)
    const alterStatements = [
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone      VARCHAR(50)`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS email      VARCHAR(255)`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS social     VARCHAR(100)`,
      `ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
    ];

    for (const sql of alterStatements) {
      await pool.query(sql);
      console.log(`  ✅ ${sql.substring(0, 60)}...`);
    }

    // ตรวจสอบ schema ปัจจุบัน
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'employees'
      ORDER BY ordinal_position
    `);
    console.log('\n📋 Current employees table schema:');
    result.rows.forEach(row => {
      console.log(`   ${row.column_name.padEnd(15)} ${row.data_type}`);
    });

    console.log('\n🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
