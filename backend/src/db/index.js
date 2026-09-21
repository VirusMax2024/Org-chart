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

// ─── ปรับแต่ง Connection Pool ให้เหมาะสมกับ Vercel Serverless ──────────────────
// บน Vercel ให้ใช้ max: 1 และ idleTimeoutMillis สั้นมาก เพื่อไม่ให้ชน Connection Limit ของ Aiven
const isVercel = Boolean(process.env.VERCEL);

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig,
      max: isVercel ? 1 : 8,
      idleTimeoutMillis: isVercel ? 1000 : 10000,
      connectionTimeoutMillis: 4000,
      allowExitOnIdle: isVercel,
    }
  : {
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host:     process.env.DB_HOST,
      port:     parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME,
      ssl: sslConfig,
      max: isVercel ? 1 : 8,
      idleTimeoutMillis: isVercel ? 1000 : 10000,
      connectionTimeoutMillis: 4000,
      allowExitOnIdle: isVercel,
    };

// ป้องกันการสร้าง Pool ซ้ำใน Serverless Container (Global Cache Singleton)
if (!global._pg_pool) {
  global._pg_pool = new Pool(poolConfig);
  global._pg_pool.on('error', (err) => {
    console.error('❌ Unexpected PostgreSQL pool error:', err.message);
  });
}

const pool = global._pg_pool;

module.exports = pool;
