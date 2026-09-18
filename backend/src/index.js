require('dotenv').config(); // โหลด .env ก่อนทุกอย่าง
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const pool    = require('./db');
const employeesRouter   = require('./routes/employees');
const authRouter        = require('./routes/auth');
const departmentsRouter = require('./routes/departments');
const settingsRouter    = require('./routes/settings');

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded avatars และ assets เป็น static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Routes ──────────────────────────────────
app.use('/api/auth',        authRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/settings',    settingsRouter);
app.use('/api/employees',   employeesRouter);

// Health check — ตรวจสอบ server + DB connection
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as db_time');
    res.json({
      status: 'ok',
      db: 'connected',
      db_time: result.rows[0].db_time,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', message: err.message });
  }
});

// ─── Start Server ─────────────────────────────
async function startServer() {
  try {
    // ทดสอบ connection กับ Aiven PostgreSQL ก่อน start
    await pool.query('SELECT 1');
    console.log('✅ Aiven PostgreSQL connected');

    app.listen(PORT, () => {
      console.log(`\n🚀 Org Chart API running at http://localhost:${PORT}`);
      console.log(`📊 Endpoints:`);
      console.log(`   GET    http://localhost:${PORT}/api/employees`);
      console.log(`   POST   http://localhost:${PORT}/api/employees`);
      console.log(`   PUT    http://localhost:${PORT}/api/employees/:id`);
      console.log(`   DELETE http://localhost:${PORT}/api/employees/:id`);
      console.log(`   GET    http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to database:', err.message);
    console.error('💡 ตรวจสอบ DATABASE_URL ใน backend/.env');
    process.exit(1);
  }
}

startServer();
