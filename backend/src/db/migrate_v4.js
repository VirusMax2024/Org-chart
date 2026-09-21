// db/migrate_v4.js — Add rank (G1-G5) and staff_id columns to employees
require('dotenv').config();
const pool = require('./index');

async function migrateV4() {
  console.log('🔧 Running Database Migration V4 (rank + staff_id)...');
  try {
    // เพิ่ม column rank สำหรับระดับพนักงาน G1–G5
    await pool.query(`
      ALTER TABLE employees 
        ADD COLUMN IF NOT EXISTS rank VARCHAR(10) DEFAULT NULL
    `);
    console.log('  ✅ Added rank column to employees');

    // เพิ่ม column staff_id สำหรับรหัสพนักงาน (กำหนดเอง)
    await pool.query(`
      ALTER TABLE employees 
        ADD COLUMN IF NOT EXISTS staff_id VARCHAR(50) DEFAULT NULL
    `);
    console.log('  ✅ Added staff_id column to employees');

    console.log('🎉 Migration V4 Completed Successfully!');
    console.log('   rank values: G5 | G4 | G3 | G2 | G1 (or NULL)');
  } catch (err) {
    console.error('❌ Migration V4 failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateV4();
