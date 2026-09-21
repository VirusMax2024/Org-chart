// components/ProtectedRoute.jsx — ป้องกันการเข้าถึงหน้า Admin ถ้ายังไม่ได้ Login
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2147 50%, #0a1628 100%)' }}
      >
        <div className="text-center p-8 rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl max-w-sm w-full animate-fade-in">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-white font-bold text-base mb-1">ກຳລັງກວດສອບສິດ / กำลังตรวจสอบสิทธิ์...</h3>
          <p className="text-slate-400 text-xs mb-5">ກະລຸນາລໍຖ້າສັກຄູ່ / กรุณารอสักครู่</p>
          <a
            href="/admin/login"
            className="inline-block px-4 py-2 rounded-xl text-xs font-semibold text-blue-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            ໄປໜ້າເຂົ້າສູ່ລະບົບ / ไปหน้าเข้าสู่ระบบ (Login) →
          </a>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
