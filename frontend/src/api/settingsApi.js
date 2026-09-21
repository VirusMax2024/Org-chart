import axios from 'axios';
import { API_BASE } from './config';

const api = axios.create({
  baseURL: `${API_BASE}/api/settings`,
  timeout: 60000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getSettings = async () => {
  const res = await api.get('/');
  return res.data.data;
};

export const updateSettings = async (formDataOrObject) => {
  // รองรับทั้ง FormData (กรณีอัปโหลดรูป logo/bg_image) หรือ Object ปกติ
  let payload = formDataOrObject;
  let headers = {};

  if (!(formDataOrObject instanceof FormData)) {
    const fd = new FormData();
    Object.entries(formDataOrObject).forEach(([k, v]) => {
      if (v instanceof File) {
        fd.append(k, v);
      } else if (v !== null && v !== undefined) {
        fd.append(k, String(v));
      }
    });
    payload = fd;
  }

  const res = await api.put('/', payload, { headers });
  return res.data.data;
};

export default api;
