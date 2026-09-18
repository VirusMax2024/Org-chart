// App.jsx — React Router setup พร้อม AuthProvider และ ProtectedRoute
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ChartPage from './pages/ChartPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* หน้าหลักสาธารณะ: ผังองค์กร Org Chart (Static Read-Only) */}
          <Route path="/" element={<ChartPage />} />

          {/* หน้าระบบล็อกอินแอดมิน */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* หน้าหลังบ้านแอดมิน (ป้องกันด้วย ProtectedRoute) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
