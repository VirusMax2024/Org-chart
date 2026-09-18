// db/migrate_v3.js — Add layout_type column to employees
require('dotenv').config();
const pool = require('./index');

async function migrateV3() {
  console.log('🔧 Running Database Migration V3 (layout_type)...');
  try {
    await pool.query(`
      ALTER TABLE employees 
        ADD COLUMN IF NOT EXISTS layout_type VARCHAR(20) DEFAULT 'horizontal'
    `);
    await pool.query(`
      UPDATE employees 
      SET layout_type = 'horizontal' 
      WHERE layout_type IS NULL
    `);
    console.log('  ✅ Added layout_type column to employees (default: horizontal)');
    console.log('🎉 Migration V3 Completed Successfully!');
  } catch (err) {
    console.error('❌ Migration V3 failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrateV3();
