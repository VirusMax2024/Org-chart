import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ChartPage from './pages/ChartPage';

// Lazy-load หน้าระบบหลังบ้านและล็อกอิน เพื่อให้หน้าแรก (Public Chart) โหลดไวสูงสุด ไม่ต้องดาวน์โหลด bundle แอดมินล่วงหน้า
const AdminPage = lazy(() => import('./pages/AdminPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoadingFallback />}>
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
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
