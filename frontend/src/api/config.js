// frontend/src/api/config.js — Central API Configuration
// รองรับ VITE_API_URL สำหรับ Cloudflare Pages Production Deployment
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
