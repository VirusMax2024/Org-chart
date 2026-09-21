// context/AuthContext.jsx — Admin Authentication State Management
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAdmin, getMe } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(true);

  // ตรวจสอบ Token ตอนโหลดเว็บครั้งแรก
  useEffect(() => {
    let isMounted = true;

    // Safety timeout: ป้องกันการค้างหมุนนานเกิน 3.5 วินาที
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth check timed out, clearing stale session');
        logout();
        setLoading(false);
      }
    }, 3500);

    async function checkAuth() {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        if (isMounted) setLoading(false);
        clearTimeout(safetyTimer);
        return;
      }

      try {
        const res = await getMe();
        if (isMounted) {
          if (res.success && res.user) {
            setUser(res.user);
            setToken(savedToken);
          } else {
            logout();
          }
        }
      } catch (err) {
        console.warn('Session expired or invalid token');
        if (isMounted) logout();
      } finally {
        clearTimeout(safetyTimer);
        if (isMounted) setLoading(false);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  const login = async (username, password) => {
    const res = await loginAdmin(username, password);
    if (res.success && res.token) {
      localStorage.setItem('token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'เข้าสู่ระบบไม่สำเร็จ');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
