import axios from 'axios';
import { API_BASE } from './config';

const api = axios.create({
  baseURL: `${API_BASE}/api/auth`,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginAdmin = async (username, password) => {
  const res = await api.post('/login', { username, password });
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/me');
  return res.data;
};

export default api;
