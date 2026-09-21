import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6 text-slate-100"
          style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2147 50%, #0a1628 100%)' }}
        >
          <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-black text-white mb-2">
              ເກີດຂໍ້ຜິດພາດໃນການສະແດງຜົນ / เกิดข้อผิดพลาด
            </h2>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">
              ລະບົບພົບຂໍ້ຜິດພາດບາງຢ່າງ ກະລຸນາລອງຣີເຟຣຊໜ້າເວັບ ຫຼື ກັບໄປໜ້າຫຼັກ<br />
              (ระบบพบข้อผิดพลาด กรุณารีเฟรชหรือกลับหน้าหลัก)
            </p>

            {this.state.error?.message && (
              <div className="p-3 mb-6 rounded-xl bg-black/40 border border-white/5 text-left font-mono text-[11px] text-red-300 break-all max-h-32 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>ຣີເຟຣຊ / รีเฟรช</span>
              </button>
              <a
                href="/"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                <Home size={14} />
                <span>ໜ້າຫຼັກ / หน้าหลัก</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
