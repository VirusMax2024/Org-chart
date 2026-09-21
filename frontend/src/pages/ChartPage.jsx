import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { RefreshCw, Settings, ChevronRight, ChevronLeft, Building2, ChevronDown, X, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import OrgChart from '../components/OrgChart';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from '../context/LanguageContext';
import { getEmployees } from '../api/employeeApi';
import { getDepartments } from '../api/departmentApi';
import { getSettings } from '../api/settingsApi';

export default function ChartPage() {
  const { t } = useTranslation(); // แปลภาษา
  const [employees, setEmployees]     = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('all');
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const deptDropdownRef = useRef(null);

  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  // ข้อมูลแบรนด์จาก Site Settings
  const [settings, setSettings] = useState({
    company_name: 'BORCELLE',
    company_subtitle: 'Organizational Structure',
    company_logo_url: '',
    header_title: 'ORGANIZATIONAL\nSTRUCTURE',
    header_subtitle: 'team members across your organization',
    bg_image_url: '',
    bg_overlay_opacity: '0.85',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [empData, deptData, settingsData] = await Promise.all([
        getEmployees(),
        getDepartments().catch(() => []),
        getSettings().catch(() => null),
      ]);
      setEmployees(empData || []);
      if (Array.isArray(deptData)) setDepartments(deptData);
      if (settingsData) setSettings(settingsData);
      setLastUpdated(new Date());
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อ Backend ได้ กรุณาตรวจสอบว่า Backend server รันอยู่ที่ port 3001');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ปิด Dropdown เมื่อคลิกนอกพื้นที่
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(e.target)) {
        setIsDeptDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // รวมรายชื่อแผนกทั้งหมดจาก API และจากพนักงาน
  const allDepartmentOptions = useMemo(() => {
    const map = new Map();
    departments.forEach((d) => {
      if (d.name && d.name.trim()) {
        map.set(d.name.trim().toLowerCase(), {
          name: d.name.trim(),
          color: d.color || '#3b82f6',
        });
      }
    });
    employees.forEach((e) => {
      if (e.department && e.department.trim()) {
        const key = e.department.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, { name: e.department.trim(), color: '#3b82f6' });
        }
      }
    });
    return Array.from(map.values());
  }, [departments, employees]);

  // ─── กรองพนักงานตามแผนก + ดึงสายผู้บริหารสูงสุด (Alex/CEO) ติดมาด้วย ───
  const filteredEmployees = useMemo(() => {
    if (!selectedDept || selectedDept === 'all') {
      return employees;
    }

    const empMap = new Map();
    employees.forEach((e) => empMap.set(e.id, e));

    // 1. หาพนักงานในแผนกเป้าหมาย
    const targetDeptLower = selectedDept.trim().toLowerCase();
    const targetEmps = employees.filter((e) => {
      const matchName = e.department && e.department.trim().toLowerCase() === targetDeptLower;
      const matchId = e.department_id && String(e.department_id) === String(selectedDept);
      return matchName || matchId;
    });

    if (targetEmps.length === 0) {
      return employees;
    }

    // 2. เก็บ ID พนักงานเป้าหมาย และเดินย้อนสาย parent_id ขึ้นไปจนถึง Root (CEO / Alex)
    const keepIds = new Set();
    targetEmps.forEach((emp) => {
      keepIds.add(emp.id);
      let curr = emp;
      const visited = new Set();
      while (curr && curr.parent_id && !visited.has(curr.id)) {
        visited.add(curr.id);
        const parent = empMap.get(curr.parent_id);
        if (parent) {
          keepIds.add(parent.id);
          curr = parent;
        } else {
          break;
        }
      }
    });

    // 3. รวมลูกน้องใต้บังคับบัญชาของคนในแผนกที่ไม่มีการระบุแผนกอื่น
    const otherDeptNames = new Set(
      allDepartmentOptions
        .map((d) => d.name.toLowerCase())
        .filter((n) => n !== targetDeptLower)
    );

    let addedMore = true;
    while (addedMore) {
      addedMore = false;
      employees.forEach((emp) => {
        if (!keepIds.has(emp.id) && emp.parent_id && keepIds.has(emp.parent_id)) {
          const empDept = emp.department?.trim().toLowerCase();
          if (!empDept || !otherDeptNames.has(empDept)) {
            keepIds.add(emp.id);
            addedMore = true;
          }
        }
      });
    }

    return employees.filter((e) => keepIds.has(e.id));
  }, [employees, selectedDept, allDepartmentOptions]);

  // คำนวณพื้นหลัง: ถ้ามี bg_image_url ให้นำมาแสดงผล พร้อม overlay opacity
  const bgStyle = settings.bg_image_url
    ? {
        backgroundImage: `linear-gradient(rgba(10, 22, 40, ${settings.bg_overlay_opacity || 0.85}), rgba(10, 22, 40, ${settings.bg_overlay_opacity || 0.85})), url(${settings.bg_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        background: 'linear-gradient(135deg, #0a1628 0%, #0f2147 25%, #1a3a7a 50%, #0f2147 75%, #0a1628 100%)',
      };

  return (
    <div
      className="relative w-full h-screen overflow-hidden select-none"
      style={bgStyle}
    >
      {/* ─── Background decorative elements ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large blurred circle top-right */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
        />
        {/* Circle bottom-left */}
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #1d4ed8 0%, transparent 70%)' }}
        />
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      {/* ─── Header Bar ─────────────────────────── */}
      <div
        className="relative z-10 flex items-center justify-between px-8 py-4"
        style={{
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Logo + Company Title */}
        <div className="flex items-center gap-3.5">
          {settings.company_logo_url ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center p-1.5 shadow-md">
              <img src={settings.company_logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 12px rgba(37,99,235,0.4)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 11h2M13 11h2M9 15h2M13 15h2" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}
          <div>
            <h1 className="text-white font-black text-xl tracking-wider uppercase leading-none">
              {settings.company_name || 'BORCELLE'}
            </h1>
            <p className="text-blue-300 text-xs tracking-widest uppercase mt-0.5">
              {settings.company_subtitle || 'Organizational Structure'}
            </p>
          </div>
        </div>

        {/* Right: Controls & Admin Link */}
        <div className="flex items-center gap-2.5">
          {/* ─── Department Filter Dropdown ─── */}
          <div className="relative" ref={deptDropdownRef}>
            <button
              onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer select-none ${
                selectedDept !== 'all'
                  ? 'bg-blue-600/35 border-blue-400 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.35)]'
                  : 'bg-white/10 hover:bg-white/15 border-white/15 text-slate-200 hover:text-white'
              }`}
              title={t('filter_dept_label')}
            >
              <Building2 size={14} className={selectedDept !== 'all' ? 'text-blue-300' : 'text-slate-400'} />
              <span className="max-w-[130px] truncate font-medium">
                {selectedDept === 'all' ? t('filter_all_dept_title') : selectedDept}
              </span>
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 text-slate-400 ${
                  isDeptDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDeptDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl z-50 overflow-hidden border border-white/15 animate-fade-in"
                style={{
                  background: 'rgba(15, 23, 42, 0.96)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
                }}
              >
                <div className="p-2.5 border-b border-white/10 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
                  <div className="flex items-center gap-1.5">
                    <Filter size={12} className="text-blue-400" />
                    <span>{t('filter_dept_label')}</span>
                  </div>
                  {selectedDept !== 'all' && (
                    <button
                      onClick={() => {
                        setSelectedDept('all');
                        setIsDeptDropdownOpen(false);
                      }}
                      className="text-blue-400 hover:text-blue-300 font-normal cursor-pointer text-xs transition-colors"
                    >
                      {t('filter_clear')}
                    </button>
                  )}
                </div>

                <div className="p-1.5 max-h-72 overflow-y-auto space-y-1">
                  {/* ตัวเลือก: ทุกแผนก (All) */}
                  <button
                    onClick={() => {
                      setSelectedDept('all');
                      setIsDeptDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedDept === 'all'
                        ? 'bg-blue-600/35 text-white border border-blue-500/40'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <span>{t('filter_all_dept_title')}</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                      {employees.length}
                    </span>
                  </button>

                  {/* รายชื่อแต่ละแผนก */}
                  {allDepartmentOptions.map((dept) => {
                    const isSelected = selectedDept.toLowerCase() === dept.name.toLowerCase();
                    const countInDept = employees.filter(
                      (e) => e.department && e.department.toLowerCase() === dept.name.toLowerCase()
                    ).length;
                    return (
                      <button
                        key={dept.name}
                        onClick={() => {
                          setSelectedDept(dept.name);
                          setIsDeptDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/35 text-white border border-blue-500/40'
                            : 'text-slate-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: dept.color || '#3b82f6' }}
                          />
                          <span className="truncate">{dept.name}</span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 shrink-0 ml-2 font-mono">
                          {countInDept}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {lastUpdated && (
            <span className="text-xs text-slate-400 hidden lg:block min-w-[150px] text-right font-medium select-none">
              {t('chart_last_updated')} {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          <button
            onClick={fetchData}
            title={t('refresh')}
            className="flex items-center justify-center gap-1.5 min-w-[85px] px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer select-none"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{t('refresh')}</span>
          </button>

          <Link
            to="/admin"
            className="flex items-center justify-center gap-1.5 min-w-[130px] px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-md select-none"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
            }}
          >
            <Settings size={15} />
            <span>{t('admin_panel')}</span>
            <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* ─── Active Filter Notification Banner (แสดงเมื่อมีการเลือกแผนก) ─── */}
      {selectedDept !== 'all' && (
        <div
          className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-2xl text-xs shadow-2xl border animate-fade-in"
          style={{
            background: 'rgba(15, 23, 42, 0.90)',
            borderColor: 'rgba(59, 130, 246, 0.5)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.25)',
          }}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-slate-200">
            {t('filter_active_notice')}: <strong className="text-blue-300 font-bold">{selectedDept}</strong>
            {' '}
            <span className="text-slate-400 hidden sm:inline">
              ({filteredEmployees.length} {t('col_name')} — {t('filter_with_chain')})
            </span>
          </span>
          <button
            onClick={() => setSelectedDept('all')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-white/10 transition-colors text-[11px] cursor-pointer"
            title={t('filter_clear')}
          >
            <X size={12} />
            <span>{t('filter_clear')}</span>
          </button>
        </div>
      )}

      {/* ─── Expand Button (แสดงเมื่อแผงหัวข้อถูกพับเก็บ) ─── */}
      {isHeaderCollapsed && (
        <button
          onClick={() => setIsHeaderCollapsed(false)}
          className="absolute left-4 top-20 z-20 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white shadow-2xl transition-all hover:bg-blue-600/30 hover:border-blue-400/60 border border-blue-500/30 bg-slate-900/85 backdrop-blur-md group animate-fade-in cursor-pointer"
          title={t('chart_show')}
        >
          <ChevronRight size={14} className="text-blue-400 group-hover:translate-x-0.5 transition-transform" />
          <span>{t('chart_show')}</span>
        </button>
      )}

      {/* ─── Left Side: Floating Branding Panel (Collapsible) ─── */}
      <div
        className="absolute left-0 top-16 bottom-0 z-10 flex flex-col justify-center items-start p-10 pointer-events-none transition-all duration-500 ease-in-out"
        style={{
          width: 320,
          transform: isHeaderCollapsed ? 'translateX(-120%)' : 'translateX(0)',
          opacity: isHeaderCollapsed ? 0 : 1,
        }}
      >
        <div className="space-y-4 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div
              className="text-white font-black leading-tight whitespace-pre-line"
              style={{ fontSize: 34, textShadow: '0 4px 20px rgba(0,0,0,0.6)' }}
            >
              {settings.header_title || 'ORGANIZATIONAL\nSTRUCTURE'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="h-1 rounded-full"
              style={{
                width: 60,
                background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
              }}
            />
            {/* ปุ่มพับเก็บแผงข้อความ (Collapse Button) */}
            <button
              onClick={() => setIsHeaderCollapsed(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-300 hover:text-white bg-blue-500/15 hover:bg-blue-500/30 border border-blue-500/30 transition-all cursor-pointer shadow-sm"
              title={t('chart_collapse')}
            >
              <ChevronLeft size={13} />
              <span>{t('chart_collapse')}</span>
            </button>
          </div>

          <p className="text-blue-200 text-sm leading-relaxed opacity-85">
            {selectedDept !== 'all'
              ? `${filteredEmployees.length} ${t('col_name')} (${selectedDept})`
              : employees.length > 0
              ? `${employees.length} ${settings.header_subtitle || t('chart_no_data')}`
              : t('chart_no_data')}
          </p>
        </div>
      </div>

      {/* ─── Error Banner ───────────────────────── */}
      {error && (
        <div
          className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-3 px-5 py-3 rounded-2xl text-sm shadow-xl"
          style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            backdropFilter: 'blur(10px)',
            maxWidth: '90%',
          }}
        >
          <span className="text-red-400">⚠️</span>
          <span className="text-red-300">{error}</span>
          <button onClick={fetchData} className="text-red-400 hover:text-red-300 underline text-xs ml-2">
            ลองใหม่
          </button>
        </div>
      )}

      {/* ─── React Flow Org Chart Canvas (Static / Read-only) ─── */}
      <div
        className="absolute inset-0 top-16 transition-all duration-500 ease-in-out"
        style={{ paddingLeft: isHeaderCollapsed ? 0 : 280 }}
      >
        <OrgChart
          employees={filteredEmployees}
          loading={loading && !error}
          isEditor={false}
          companyName={settings.company_name}
        />
      </div>
    </div>
  );
}
