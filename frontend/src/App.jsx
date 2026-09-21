import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ChartPage from './pages/ChartPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
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
    </LanguageProvider>
    </ErrorBoundary>
  );
}
