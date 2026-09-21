import axios from 'axios';
import { API_BASE } from './config';

const api = axios.create({
  baseURL: `${API_BASE}/api/departments`,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getDepartments = async () => {
  const res = await api.get('/');
  return res.data.data;
};

export const createDepartment = async (data) => {
  const res = await api.post('/', data);
  return res.data.data;
};

export const updateDepartment = async (id, data) => {
  const res = await api.put(`/${id}`, data);
  return res.data.data;
};

export const deleteDepartment = async (id) => {
  const res = await api.delete(`/${id}`);
  return res.data;
};

export default api;
