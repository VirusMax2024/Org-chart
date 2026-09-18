// pages/LoginPage.jsx — หน้าล็อกอินแอดมิน (Admin Login)
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('กรุณากรอก Username และ Password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(username.trim(), password);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #0f2147 50%, #0a1628 100%)',
      }}
    >
      {/* Decorative Glow Elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          <span>กลับไปยังหน้าผังองค์กร</span>
        </Link>

        {/* Login Card */}
        <div
          className="rounded-3xl p-8 backdrop-blur-xl shadow-2xl"
          style={{
            background: 'rgba(15, 33, 71, 0.75)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(59, 130, 246, 0.15)',
          }}
        >
          {/* Header Icon */}
          <div className="text-center mb-6">
            <div
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)',
              }}
            >
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Admin Portal</h2>
            <p className="text-blue-300 text-xs mt-1">กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูลองค์กร</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center gap-2.5 text-red-300 text-xs animate-fade-in">
              <AlertCircle size={16} className="flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoFocus
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-white/5 border border-white/10 outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 bg-white/5 border border-white/10 outline-none focus:border-blue-500 focus:bg-blue-500/5 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: loading ? '#3b82f6' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: '0 8px 25px rgba(37, 99, 235, 0.4)',
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>กำลังตรวจสอบสิทธิ์...</span>
                </>
              ) : (
                <span>เข้าสู่ระบบ (Login)</span>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Reminder */}
          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-[11px] text-slate-400">
              💡 บัญชีเริ่มต้น: <span className="text-blue-300 font-mono font-semibold">admin</span> / รหัสผ่าน: <span className="text-blue-300 font-mono font-semibold">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
