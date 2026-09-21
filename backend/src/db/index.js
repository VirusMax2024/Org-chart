// db/index.js — PostgreSQL connection pool (Aiven with CA Certificate)
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// อ่าน CA Certificate ของ Aiven (ใช้ verify จริง ถ้ามีไฟล์ ca.pem)
let sslConfig = { rejectUnauthorized: false };
try {
  const caPath = path.join(__dirname, 'ca.pem');
  if (fs.existsSync(caPath)) {
    sslConfig = {
      rejectUnauthorized: true,
      ca: fs.readFileSync(caPath).toString(),
    };
  } else if (process.env.DB_CA) {
    sslConfig = {
      rejectUnauthorized: true,
      ca: process.env.DB_CA,
    };
  }
} catch (e) {
  sslConfig = { rejectUnauthorized: false };
}

// สร้าง connection pool (รองรับทั้ง DATABASE_URL สำหรับ Neon/Supabase และแยก field สำหรับ Aiven)
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
      max: process.env.VERCEL ? 3 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host:     process.env.DB_HOST,
      port:     parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME,
      ssl: sslConfig,
      max: process.env.VERCEL ? 3 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL pool error:', err.message);
});

module.exports = pool;
