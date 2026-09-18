// api/employeeApi.js — Axios API wrapper พร้อมรองรับ FormData (file upload) และ Auth Header
import axios from 'axios';

const BASE_URL = '/api/employees';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// ใส่ Authorization header อัตโนมัติถ้ามี token ใน localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── GET: ดึงพนักงานทั้งหมด ──────────────────────
export const getEmployees = async () => {
  const res = await api.get('/');
  return res.data.data;
};

// ─── GET: ดึงพนักงานรายบุคคล ─────────────────────
export const getEmployee = async (id) => {
  const res = await api.get(`/${id}`);
  return res.data.data;
};

// ─── Helper: แปลง formData object → FormData ─────
const toFormData = (data) => {
  if (data.avatarFile instanceof File) {
    const fd = new FormData();
    Object.entries(data).forEach(([key, val]) => {
      if (key === 'avatarFile') {
        fd.append('avatar', val);
      } else if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
        fd.append(key, JSON.stringify(val));
      } else if (val !== null && val !== undefined) {
        fd.append(key, String(val));
      } else {
        fd.append(key, '');
      }
    });
    return { payload: fd, headers: {} };
  }

  const cleanJson = { ...data };
  delete cleanJson.avatarFile;
  return { payload: cleanJson, headers: { 'Content-Type': 'application/json' } };
};

// ─── POST: สร้างพนักงานใหม่ ──────────────────────
export const createEmployee = async (employeeData) => {
  const { payload, headers } = toFormData(employeeData);
  const res = await api.post('/', payload, { headers });
  return res.data.data;
};

// ─── PUT: อัปเดตข้อมูลพนักงาน ────────────────────
export const updateEmployee = async (id, employeeData) => {
  const { payload, headers } = toFormData(employeeData);
  const res = await api.put(`/${id}`, payload, { headers });
  return res.data.data;
};

// ─── DELETE: ลบพนักงาน ───────────────────────────
export const deleteEmployee = async (id) => {
  const res = await api.delete(`/${id}`);
  return res.data;
};

// ─── PUT: บันทึกพิกัด X, Y บน Canvas Layout ──────
export const saveLayout = async (positions) => {
  const res = await api.put('/layout/save', { positions });
  return res.data;
};

// ─── POST: รีเซ็ตพิกัดกลับสู่ Auto-Layout ────────
export const resetLayout = async () => {
  const res = await api.post('/layout/reset');
  return res.data;
};

// ─── Helper: แปลง flat list → tree structure ─────
export const buildTree = (employees) => {
  const map   = {};
  const roots = [];
  employees.forEach((emp) => { map[emp.id] = { ...emp, children: [] }; });
  employees.forEach((emp) => {
    if (emp.parent_id && map[emp.parent_id]) {
      map[emp.parent_id].children.push(map[emp.id]);
    } else {
      roots.push(map[emp.id]);
    }
  });
  return roots;
};

export default api;
