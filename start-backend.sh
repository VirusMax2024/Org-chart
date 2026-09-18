#!/bin/bash
# start-backend.sh — Start Backend Server

echo "🚀 Starting Org Chart Backend..."
echo "   Port: 3001"
echo ""

cd "$(dirname "$0")/backend"

# ตรวจสอบว่ามี node_modules หรือยัง
if [ ! -d "node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  npm install
fi

# รัน seed ถ้า DB ยังไม่มีข้อมูล
if [ ! -f "orgchart.db" ]; then
  echo "🌱 Seeding database..."
  node src/seed.js
fi

echo "✅ Backend ready! API: http://localhost:3001"
npm run dev
