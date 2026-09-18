// seed.js — Populate initial mock data
const db = require('./db');

const seedData = async () => {
  console.log('🌱 Seeding employee data...');

  // รัน migration ก่อน seed
  await db.migrate.latest({ directory: './src/db/migrations' });

  // ล้างข้อมูลเดิม (ถ้ามี) และ reset auto-increment
  await db('employees').del();
  console.log('🗑️  Cleared existing data');

  // ─── 1. สร้าง Top-Level: Francois Mercer (President) ───
  const [presidentId] = await db('employees').insert({
    full_name: 'Francois Mercer',
    position: 'President Director',
    department: 'Executive',
    avatar_url: 'https://api.dicebear.com/7.x/personas/svg?seed=Francois&backgroundColor=b6e3f4',
    parent_id: null,
  });

  // ─── 2. Finance Director ───
  const [financeDirectorId] = await db('employees').insert({
    full_name: 'Harumi Kobayashi',
    position: 'Finance Director',
    department: 'Finance',
    avatar_url: 'https://api.dicebear.com/7.x/personas/svg?seed=Harumi&backgroundColor=ffd5dc',
    parent_id: presidentId,
  });

  // ─── 3. Operations Director ───
  const [opsDirectorId] = await db('employees').insert({
    full_name: 'Itsuki Takahashi',
    position: 'Operations Director',
    department: 'Operations',
    avatar_url: 'https://api.dicebear.com/7.x/personas/svg?seed=Itsuki&backgroundColor=c0aede',
    parent_id: presidentId,
  });

  // ─── 4. Marketing Director ───
  const [mktDirectorId] = await db('employees').insert({
    full_name: 'Morgan Maxwell',
    position: 'Marketing Director',
    department: 'Marketing',
    avatar_url: 'https://api.dicebear.com/7.x/personas/svg?seed=Morgan&backgroundColor=d1f4d1',
    parent_id: presidentId,
  });

  // ─── 5. Finance Manager ───
  await db('employees').insert({
    full_name: 'Henrietta Mitchell',
    position: 'Finance Manager',
    department: 'Finance',
    avatar_url: 'https://api.dicebear.com/7.x/personas/svg?seed=Henrietta&backgroundColor=ffd5dc',
    parent_id: financeDirectorId,
  });

  // ─── 6. Operations Manager ───
  await db('employees').insert({
    full_name: 'Kimberly Nguyen',
    position: 'Operations Manager',
    department: 'Operations',
    avatar_url: 'https://api.dicebear.com/7.x/personas/svg?seed=Kimberly&backgroundColor=c0aede',
    parent_id: opsDirectorId,
  });

  // ─── 7. Marketing Manager ───
  await db('employees').insert({
    full_name: 'Noah Schumacher',
    position: 'Marketing Manager',
    department: 'Marketing',
    avatar_url: 'https://api.dicebear.com/7.x/personas/svg?seed=Noah&backgroundColor=d1f4d1',
    parent_id: mktDirectorId,
  });

  const count = await db('employees').count('id as total').first();
  console.log(`✅ Seeding complete! Total employees: ${count.total}`);

  await db.destroy();
  process.exit(0);
};

seedData().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
