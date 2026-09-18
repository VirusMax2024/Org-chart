# 🏢 BORCELLE Org Chart App

Full-Stack Organization Chart Application

## 📁 Structure
```
org-chart-app/
├── backend/    # Express + SQLite API (port 3001)
└── frontend/   # React + Vite + React Flow (port 5173)
```

## 🚀 Quick Start

### Step 1: Start Backend
```bash
cd backend
npm install
npm run seed    # Populate initial data
npm run dev     # Start API server
```

### Step 2: Start Frontend (new terminal tab)
```bash
cd frontend
npm install
npm run dev     # Start React dev server
```

### Step 3: Open Browser
- **Org Chart**: http://localhost:5173
- **Admin Panel**: http://localhost:5173/admin
- **API Health**: http://localhost:3001/api/health

## 🔗 API Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| GET | /api/employees | Get all employees |
| POST | /api/employees | Create employee |
| PUT | /api/employees/:id | Update employee |
| DELETE | /api/employees/:id | Delete employee |
