// components/EmployeeForm.jsx — Add/Edit Employee Modal Form (High Performance & Smart Filtered)
// รองรับ: Smart Filtering (C-Level + แผนกเดียวกัน), กำหนดทิศทางสายงาน (Under vs Parent Of),
// และเลือกการแสดงผลลูกน้อง (Vertical vs Horizontal)
import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import {
  X, User, Briefcase, Building2, Users, Phone, AtSign, Mail,
  Camera, Network, Check, Search, ShieldCheck, UserCheck
} from 'lucide-react';

const DEPARTMENTS = ['Executive', 'Finance', 'Operations', 'Marketing', 'HR', 'IT', 'Other'];

const initialForm = {
  name:            '',
  position:        '',
  department:      'Executive',
  parent_id:       '',
  subordinate_ids: [],
  phone:           '',
  social:          '',
  email:           '',
  avatar_url:      '',
  layout_type:     'horizontal', // 'horizontal' | 'vertical'
  avatarFile:      null,
};

// ─── Input Field Component (Memoized) ──────────────────────────
const Field = memo(({ label, icon: Icon, error, badge, children }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label className="block text-xs font-semibold text-slate-300">
        <Icon size={13} className="inline mr-1.5 text-blue-400" />
        {label}
      </label>
      {badge && <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">{badge}</span>}
    </div>
    {children}
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
));

const inputClass = (hasError) =>
  `w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none transition-all ${
    hasError
      ? 'border border-red-500 bg-red-500/10'
      : 'border border-white/10 bg-slate-900/80 focus:border-blue-500 focus:bg-slate-900'
  }`;

// ─── Main EmployeeForm Component ──────────────────────────────
function EmployeeForm({ isOpen, onClose, onSubmit, editEmployee, employees = [], departments = [] }) {
  const deptList = useMemo(() => {
    return departments.length > 0
      ? departments.map(d => typeof d === 'string' ? d : d.name)
      : DEPARTMENTS;
  }, [departments]);

  const [form, setForm] = useState(initialForm);
  const [direction, setDirection] = useState('under'); // 'under' (เป็นลูกน้อง) | 'parent_of' (เป็นหัวหน้า)
  const [subSearch, setSubSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [tab, setTab] = useState('basic'); // 'basic' | 'hierarchy' | 'contact'
  const fileRef = useRef();

  // โหลดข้อมูลเมื่อเปิด modal หรือเปลี่ยน employee
  useEffect(() => {
    if (!isOpen) return;

    if (editEmployee) {
      // ดึงลูกน้องปัจจุบันที่ขึ้นตรงกับพนักงานคนนี้
      const existingSubs = employees
        .filter(e => e.parent_id === editEmployee.id)
        .map(e => e.id);

      setForm({
        name:            editEmployee.name || editEmployee.full_name || '',
        position:        editEmployee.position   || '',
        department:      editEmployee.department || deptList[0] || 'Executive',
        parent_id:       editEmployee.parent_id  ? String(editEmployee.parent_id) : '',
        subordinate_ids: existingSubs,
        phone:           editEmployee.phone      || '',
        social:          editEmployee.social     || '',
        email:           editEmployee.email      || '',
        avatar_url:      editEmployee.avatar_url || '',
        layout_type:     editEmployee.layout_type || 'horizontal',
        avatarFile:      null,
      });
      setPreview(editEmployee.avatar_url || null);
      setDirection(existingSubs.length > 0 ? 'parent_of' : 'under');
    } else {
      setForm(initialForm);
      setPreview(null);
      setDirection('under');
    }
    setErrors({});
    setSubSearch('');
    setTab('basic');
  }, [editEmployee, isOpen, employees, deptList]);

  // ── Smart Filtering Logic สำหรับ Dropdown ผู้บังคับบัญชา ──
  const otherEmployees = useMemo(() => {
    return employees.filter(e => e.id !== editEmployee?.id);
  }, [employees, editEmployee]);

  // ฟังก์ชันตรวจสอบพนักงานระดับผู้บริหาร / C-Level
  const isCLevel = (e) => {
    if (!e) return false;
    if (e.department === 'Executive') return true;
    if (e.parent_id === null || e.parent_id === undefined || e.parent_id === '') return true;
    return /(ceo|cto|cfo|cmo|coo|cio|cpo|president|founder|director|managing director|vp|vice president|ผู้บริหาร|กรรมการผู้จัดการ|ประธาน)/i.test(e.position || '');
  };

  // 1. ระดับผู้บริหาร C-Level
  const cLevelEmployees = useMemo(() => {
    return otherEmployees.filter(e => isCLevel(e));
  }, [otherEmployees]);

  // 2. พนักงานในแผนกเดียวกัน (ที่ไม่ใช่ C-Level ซ้ำ)
  const sameDeptEmployees = useMemo(() => {
    return otherEmployees.filter(e => e.department === form.department && !isCLevel(e));
  }, [otherEmployees, form.department]);

  // 3. พนักงานแผนกอื่นๆ
  const otherDeptEmployees = useMemo(() => {
    return otherEmployees.filter(e => e.department !== form.department && !isCLevel(e));
  }, [otherEmployees, form.department]);

  // ผู้สมัครเป็นลูกน้อง (สำหรับโหมด 'เป็นหัวหน้าของ')
  const subordinateCandidates = useMemo(() => {
    return otherEmployees.filter(e => {
      // ไม่ให้เลือกหัวหน้าของตัวเองมาเป็นลูกน้อง (ป้องกัน circular)
      if (form.parent_id && e.id === parseInt(form.parent_id)) return false;
      if (!subSearch) return true;
      const q = subSearch.toLowerCase();
      return (e.name || '').toLowerCase().includes(q) ||
             (e.position || '').toLowerCase().includes(q) ||
             (e.department || '').toLowerCase().includes(q);
    });
  }, [otherEmployees, form.parent_id, subSearch]);

  const toggleSubordinate = (id) => {
    setForm(f => {
      const exists = f.subordinate_ids.includes(id);
      const nextSubs = exists
        ? f.subordinate_ids.filter(x => x !== id)
        : [...f.subordinate_ids, id];
      return { ...f, subordinate_ids: nextSubs };
    });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())     errs.name     = 'กรุณากรอกชื่อ-นามสกุล';
    if (!form.position.trim()) errs.position = 'กรุณากรอกตำแหน่งงาน';
    return errs;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({ ...f, avatarFile: file, avatar_url: '' }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await onSubmit({
        ...form,
        parent_id: form.parent_id ? parseInt(form.parent_id) : null,
        subordinate_ids: direction === 'parent_of' ? form.subordinate_ids : [],
        layout_type: form.layout_type,
      });
      onClose();
    } catch (err) {
      console.error('Form submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      style={{ willChange: 'opacity' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl flex flex-col overflow-hidden text-slate-100"
        style={{
          background: '#0b1528',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(59, 130, 246, 0.15)',
          maxHeight: '90vh',
          transform: 'translateZ(0)',
        }}
      >
        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/50 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {editEmployee ? '✏️ แก้ไขข้อมูลพนักงาน' : '➕ เพิ่มพนักงานใหม่'}
            </h2>
            <p className="text-blue-400 text-xs mt-0.5">
              {editEmployee ? `รหัสพนักงาน #${editEmployee.id} — ${editEmployee.name || ''}` : 'กรอกรายละเอียดและกำหนดสายการบังคับบัญชา'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Tab Bar ──────────────────────────────────────── */}
        <div className="flex gap-1.5 px-6 pt-3 pb-1 border-b border-white/5 bg-slate-900/30 flex-shrink-0">
          {[
            { id: 'basic',     label: '📋 ข้อมูลพื้นฐาน' },
            { id: 'hierarchy', label: '🌳 สายงาน & โครงสร้าง' },
            { id: 'contact',   label: '📞 ข้อมูลติดต่อ' },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: tab === t.id ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                color:      tab === t.id ? '#60a5fa' : '#94a3b8',
                border:     tab === t.id ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Form Body (scrollable) ────────────────────────── */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB 1: ข้อมูลพื้นฐาน                                   */}
          {/* ══════════════════════════════════════════════════════ */}
          {tab === 'basic' && (
            <>
              {/* Avatar Upload Area */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                <div
                  className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden cursor-pointer group bg-slate-800 border-2 border-blue-500/50"
                  onClick={() => fileRef.current?.click()}
                >
                  {preview ? (
                    <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-black text-blue-400">
                      {form.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={18} className="text-white" />
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold">รูปถ่ายโปรไฟล์ (Avatar)</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">คลิกที่รูปเพื่ออัปโหลดไฟล์ หรือกรอก URL ด้านล่าง</p>
                  <input
                    type="url"
                    value={form.avatar_url}
                    onChange={e => {
                      setForm(f => ({ ...f, avatar_url: e.target.value, avatarFile: null }));
                      setPreview(e.target.value || null);
                    }}
                    placeholder="https://example.com/avatar.jpg"
                    className="mt-1.5 w-full px-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 outline-none border border-white/10 bg-slate-900 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Full Name */}
              <Field label="ชื่อ-นามสกุล *" icon={User} error={errors.name}>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="เช่น สมชาย ใจดี หรือ Jonathan Patterson"
                  className={inputClass(errors.name)}
                />
              </Field>

              {/* Position */}
              <Field label="ตำแหน่งงาน *" icon={Briefcase} error={errors.position}>
                <input
                  type="text"
                  value={form.position}
                  onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                  placeholder="เช่น Lead Developer, Marketing Director"
                  className={inputClass(errors.position)}
                />
              </Field>

              {/* Department */}
              <Field label="แผนก *" icon={Building2}>
                <select
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all border border-white/10 bg-slate-900 focus:border-blue-500 cursor-pointer"
                >
                  {deptList.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
            </>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB 2: สายงาน & โครงสร้างองค์กร (Smart Filtering)      */}
          {/* ══════════════════════════════════════════════════════ */}
          {tab === 'hierarchy' && (
            <div className="space-y-5">
              {/* ── ลำดับที่ 1 (บนสุด): ผู้บังคับบัญชา (Reports To) ── */}
              <Field
                label="ผู้บังคับบัญชา (Reports To)"
                icon={Users}
                badge={cLevelEmployees.length > 0 ? `พบผู้บริหาร C-Level ${cLevelEmployees.length} ท่าน` : null}
              >
                <select
                  value={form.parent_id}
                  onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all border border-white/10 bg-slate-900 focus:border-blue-500 cursor-pointer"
                >
                  <option value="">— ระดับสูงสุด (ไม่มีผู้บังคับบัญชา / Top Level) —</option>

                  {/* 1. ผู้บริหารระดับสูง / C-Level */}
                  {cLevelEmployees.length > 0 && (
                    <optgroup label="🌟 ผู้บริหารระดับสูง / C-Level (Executive)">
                      {cLevelEmployees.map(e => (
                        <option key={e.id} value={e.id}>
                          👑 {e.name || e.full_name} — {e.position} ({e.department || 'Executive'})
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {/* 2. พนักงานในแผนกเดียวกัน */}
                  {sameDeptEmployees.length > 0 && (
                    <optgroup label={`🏢 พนักงานในแผนกเดียวกัน (${form.department})`}>
                      {sameDeptEmployees.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.name || e.full_name} — {e.position}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {/* 3. พนักงานแผนกอื่นๆ */}
                  {otherDeptEmployees.length > 0 && (
                    <optgroup label="🌐 พนักงานแผนกอื่นๆ (Cross-Department)">
                      {otherDeptEmployees.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.name || e.full_name} — {e.position} ({e.department})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  💡 ระบบกรองดึงผู้บริหารระดับสูง (C-Level) และพนักงานในแผนก <strong className="text-blue-400">{form.department}</strong> ขึ้นมาเป็นลำดับแรก
                </p>
              </Field>

              {/* ── ลำดับที่ 2: การแสดงผลการเชื่อมโยง / Layout ── */}
              <Field label="การแสดงผลการเชื่อมโยง / Layout" icon={Network}>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {/* แนวนอน */}
                  <label
                    onClick={() => setForm(f => ({ ...f, layout_type: 'horizontal' }))}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.layout_type === 'horizontal'
                        ? 'border-blue-500 bg-blue-500/15 text-white shadow-md'
                        : 'border-white/10 bg-slate-900/60 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="layout_type"
                      value="horizontal"
                      checked={form.layout_type === 'horizontal'}
                      onChange={() => {}}
                      className="accent-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">แนวนอน (Horizontal)</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">การแสดงผลตำแหน่งที่ผูก: กระจายกิ่งออกซ้าย-ขวา</div>
                    </div>
                  </label>

                  {/* แนวตั้ง */}
                  <label
                    onClick={() => setForm(f => ({ ...f, layout_type: 'vertical' }))}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      form.layout_type === 'vertical'
                        ? 'border-blue-500 bg-blue-500/15 text-white shadow-md'
                        : 'border-white/10 bg-slate-900/60 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="layout_type"
                      value="vertical"
                      checked={form.layout_type === 'vertical'}
                      onChange={() => {}}
                      className="accent-blue-500 cursor-pointer"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">แนวตั้ง (Vertical)</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">การแสดงผลตำแหน่งที่ผูก: ต่อแถวดิ่งตรง 1 แถว</div>
                    </div>
                  </label>
                </div>
              </Field>

              {/* ── ลำดับที่ 3: ทิศทางสายการบังคับบัญชา (Reporting Direction) ── */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  <Users size={13} className="inline mr-1.5 text-blue-400" />
                  ทิศทางสายการบังคับบัญชา (Reporting Direction)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDirection('under')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      direction === 'under'
                        ? 'border-blue-500 bg-blue-500/20 text-white shadow-md'
                        : 'border-white/10 bg-slate-900/60 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <UserCheck size={14} className={direction === 'under' ? 'text-blue-400' : 'text-slate-500'} />
                      <span>เป็นลูกน้องของ (Under)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      รายงานตรงต่อหัวหน้าที่ระบุด้านบน
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDirection('parent_of')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      direction === 'parent_of'
                        ? 'border-blue-500 bg-blue-500/20 text-white shadow-md'
                        : 'border-white/10 bg-slate-900/60 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs">
                      <ShieldCheck size={14} className={direction === 'parent_of' ? 'text-blue-400' : 'text-slate-500'} />
                      <span>เป็นหัวหน้าของ (Parent of)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      กำหนดลูกน้องในสายงานของคนนี้
                    </p>
                  </button>
                </div>
              </div>

              {/* ── ลำดับที่ 4 (ล่างสุด): รายชื่อเลือกลูกน้อง (แสดงเฉพาะเมื่อเลือก 'เป็นหัวหน้าของ (Parent of)') ── */}
              {direction === 'parent_of' && (
                <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-300">
                      👥 เลือกลูกน้องที่รายงานตรงต่อพนักงานคนนี้
                    </label>
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      เลือกแล้ว {form.subordinate_ids.length} คน
                    </span>
                  </div>

                  {/* Search filter */}
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={subSearch}
                      onChange={e => setSubSearch(e.target.value)}
                      placeholder="ค้นหาชื่อ, ตำแหน่ง หรือแผนก..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 border border-white/10 bg-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Checklist container */}
                  <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                    {subordinateCandidates.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 py-3">ไม่พบรายชื่อพนักงาน</p>
                    ) : (
                      subordinateCandidates.map(c => {
                        const isChecked = form.subordinate_ids.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleSubordinate(c.id)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-all ${
                              isChecked
                                ? 'bg-blue-500/20 border border-blue-500/40 text-white'
                                : 'bg-slate-900/60 border border-white/5 text-slate-300 hover:bg-slate-900'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-5 h-5 rounded flex-shrink-0 bg-blue-600/30 flex items-center justify-center text-[10px] font-bold text-blue-300">
                                {c.name?.charAt(0) || '?'}
                              </div>
                              <div className="truncate">
                                <span className="font-semibold">{c.name || c.full_name}</span>
                                <span className="text-[10px] text-slate-400 ml-1.5">({c.position})</span>
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
                              isChecked ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20'
                            }`}>
                              {isChecked && <Check size={11} />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* TAB 3: ข้อมูลติดต่อ                                   */}
          {/* ══════════════════════════════════════════════════════ */}
          {tab === 'contact' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-xs">ข้อมูลสำหรับแสดงผลบนแถบข้อมูลติดต่อของการ์ดพนักงาน (ไม่บังคับกรอก)</p>

              <Field label="เบอร์โทรศัพท์" icon={Phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="เช่น +66-81-234-5678"
                  className={inputClass(false)}
                />
              </Field>

              <Field label="Social / Username (@)" icon={AtSign}>
                <input
                  type="text"
                  value={form.social}
                  onChange={e => setForm(f => ({ ...f, social: e.target.value }))}
                  placeholder="เช่น @somchai หรือ @jonathan"
                  className={inputClass(false)}
                />
              </Field>

              <Field label="อีเมล" icon={Mail}>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="เช่น somchai@company.com"
                  className={inputClass(false)}
                />
              </Field>
            </div>
          )}

          {/* ── Footer Action Buttons ───────────────────────── */}
          <div className="px-1 pt-3 flex gap-3 flex-shrink-0 border-t border-white/10 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 border border-white/10 hover:bg-white/5 transition-all"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50"
              style={{
                background: loading ? 'rgba(59, 130, 246, 0.5)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังบันทึก...
                </span>
              ) : editEmployee ? '💾 บันทึกการเปลี่ยนแปลง' : '➕ เพิ่มพนักงาน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default memo(EmployeeForm);
