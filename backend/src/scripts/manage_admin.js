// backend/src/scripts/manage_admin.js
// สคริปต์จัดการบัญชีผู้ดูแลระบบ (Admin User & Password Manager)
// รองรับทั้งโหมด Interactive (มีเมนูให้เลือก) และ CLI Command Line

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const readline = require('readline');
const bcrypt   = require('bcryptjs');
const pool     = require('../db');

// ฟังก์ชันสร้าง Prompt ถามคำถามใน Terminal
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

// ─────────────────────────────────────────────────────────────
// 1. ดูรายชื่อ Admin ทั้งหมด
// ─────────────────────────────────────────────────────────────
async function listAdmins() {
  console.log('\n📋 [รายชื่อแอดมินทั้งหมดในระบบ]');
  console.log('──────────────────────────────────────────────────');
  try {
    const res = await pool.query(
      'SELECT id, username, role, created_at FROM admins ORDER BY id ASC'
    );
    if (res.rows.length === 0) {
      console.log('⚠️  ยังไม่มีบัญชีผู้ดูแลระบบในฐานข้อมูล');
    } else {
      console.table(res.rows.map(r => ({
        ID: r.id,
        Username: r.username,
        Role: r.role,
        Created: new Date(r.created_at).toLocaleString('th-TH'),
      })));
    }
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดในการดึงข้อมูล:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// 2. สร้างบัญชีใหม่ หรือ อัปเดตรหัสผ่าน (Upsert Admin)
// ─────────────────────────────────────────────────────────────
async function setAdminPassword(username, password, role = 'admin') {
  if (!username || !password) {
    console.log('❌ กรุณาระบุ Username และ Password');
    return;
  }

  if (password.length < 4) {
    console.log('⚠️  คำเตือน: รหัสผ่านควรมีความยาวอย่างน้อย 4 ตัวอักษร');
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // ตรวจสอบว่ามี user นี้อยู่หรือไม่
    const check = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);

    if (check.rows.length > 0) {
      // มีอยู่แล้ว -> อัปเดตรหัสผ่าน
      await pool.query(
        'UPDATE admins SET password_hash = $1 WHERE username = $2',
        [hash, username]
      );
      console.log(`\n✅ [สำเร็จ] อัปเดตรหัสผ่านสำหรับผู้ใช้ "${username}" เรียบร้อยแล้ว!`);
    } else {
      // ยังไม่มี -> สร้างใหม่
      await pool.query(
        'INSERT INTO admins (username, password_hash, role) VALUES ($1, $2, $3)',
        [username, hash, role]
      );
      console.log(`\n🎉 [สำเร็จ] สร้างบัญชีแอดมินใหม่ "${username}" (สิทธิ์: ${role}) เรียบร้อยแล้ว!`);
    }

    console.log(`🔑 Username: ${username}`);
    console.log(`🔒 Password: ${password}`);
    console.log(`🌐 นำไปล็อกอินได้ที่: http://localhost:5173/admin/login\n`);
  } catch (err) {
    console.error('❌ ไม่สามารถบันทึกข้อมูลได้:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// 3. ลบบัญชี Admin
// ─────────────────────────────────────────────────────────────
async function deleteAdmin(username) {
  if (!username) {
    console.log('❌ กรุณาระบุ Username ที่ต้องการลบ');
    return;
  }

  try {
    const check = await pool.query('SELECT id FROM admins WHERE username = $1', [username]);
    if (check.rows.length === 0) {
      console.log(`⚠️  ไม่พบบัญชีผู้ใช้ "${username}" ในระบบ`);
      return;
    }

    await pool.query('DELETE FROM admins WHERE username = $1', [username]);
    console.log(`\n🗑️  [สำเร็จ] ลบบัญชีแอดมิน "${username}" ออกจากระบบแล้ว`);
  } catch (err) {
    console.error('❌ ไม่สามารถลบข้อมูลได้:', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// โหมด Interactive Menu (สำหรับ CEO MAC ใช้งานง่ายผ่านตัวเลือก)
// ─────────────────────────────────────────────────────────────
async function runInteractiveMenu() {
  console.log('\n==================================================');
  console.log('      🛡️  BORCELLE ADMIN MANAGEMENT TOOL         ');
  console.log('      เครื่องมือจัดการ User & Password แอดมิน     ');
  console.log('==================================================');
  console.log(' 1. ดูรายชื่อแอดมินทั้งหมด (List Admins)');
  console.log(' 2. เปลี่ยนรหัสผ่าน / สร้างแอดมินใหม่ (Set / Change Password)');
  console.log(' 3. ลบบัญชีแอดมิน (Delete Admin)');
  console.log(' 4. ออกจากโปรแกรม (Exit)');
  console.log('──────────────────────────────────────────────────');

  const choice = await askQuestion('👉 เลือกเมนู (1-4): ');

  if (choice === '1') {
    await listAdmins();
  } else if (choice === '2') {
    const username = await askQuestion('👤 กรอก Username (เช่น admin): ');
    const password = await askQuestion('🔑 กรอก Password ที่ต้องการ: ');
    const role = await askQuestion('👑 สิทธิ์ (admin / superadmin) [กด Enter เพื่อใช้ admin]: ') || 'admin';
    await setAdminPassword(username, password, role);
  } else if (choice === '3') {
    await listAdmins();
    const username = await askQuestion('⚠️  กรอก Username ที่ต้องการลบ: ');
    const confirm = await askQuestion(`ยืนยันการลบ "${username}" ใช่หรือไม่? (y/n): `);
    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
      await deleteAdmin(username);
    } else {
      console.log('ยกเลิกการลบ');
    }
  } else if (choice === '4') {
    console.log('👋 ออกจากโปรแกรม');
  } else {
    console.log('❌ ตัวเลือกไม่ถูกต้อง');
  }
}

// ─────────────────────────────────────────────────────────────
// Main Controller
// ─────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();

  try {
    if (!command) {
      // ถ้ารันเปล่าๆ -> เปิด Interactive Menu
      await runInteractiveMenu();
    } else if (command === 'list' || command === 'ls') {
      await listAdmins();
    } else if (command === 'set' || command === 'add') {
      const username = args[1];
      const password = args[2];
      const role = args[3] || 'admin';
      if (!username || !password) {
        console.log('❌ วิธีใช้งาน: npm run admin -- set <username> <password> [role]');
        console.log('   ตัวอย่าง:  npm run admin -- set admin 123456');
      } else {
        await setAdminPassword(username, password, role);
      }
    } else if (command === 'del' || command === 'delete' || command === 'rm') {
      const username = args[1];
      await deleteAdmin(username);
    } else {
      console.log(`❌ ไม่รู้จักคำสั่ง: ${command}`);
      console.log('คำสั่งที่รองรับ:');
      console.log('  npm run admin                     (เปิดเมนูโต้ตอบ)');
      console.log('  npm run admin -- list              (ดูรายชื่อ)');
      console.log('  npm run admin -- set <user> <pass> (ตั้งค่ารหัสผ่าน)');
      console.log('  npm run admin -- del <user>        (ลบแอดมิน)');
    }
  } catch (err) {
    console.error('Fatal error:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
