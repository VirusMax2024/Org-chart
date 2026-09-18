// api/authApi.js — Authentication API
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/auth',
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
