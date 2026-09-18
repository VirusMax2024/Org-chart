// db/index.js — PostgreSQL connection pool (Aiven with CA Certificate)
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// อ่าน CA Certificate ของ Aiven (ใช้ verify จริง — ปลอดภัยกว่า rejectUnauthorized: false)
const ca = fs.readFileSync(path.join(__dirname, 'ca.pem')).toString();

// สร้าง connection pool ด้วย credentials แยก field (ปลอดภัยกว่า connection string)
const pool = new Pool({
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true, // verify ด้วย CA จริง
    ca,                        // ใช้ Aiven Project CA Certificate
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL pool error:', err.message);
});

module.exports = pool;
