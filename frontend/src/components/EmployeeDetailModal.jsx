// components/EmployeeDetailModal.jsx — View-Only Employee Profile Modal
// หน้าต่างป๊อปอัปดูโปรไฟล์และข้อมูลพนักงานแบบ Read-Only (แก้ไขไม่ได้)
import React, { useEffect, useMemo } from 'react';
import {
  X, Phone, Mail, Building2, User, Users, Shield, AtSign,
  Briefcase, Star, Diamond, Sun, Snowflake, Flame, ExternalLink
} from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';
import { resolveLevel, LEVEL_TYPES } from './EmployeeCard';

export default function EmployeeDetailModal({ employee, allEmployees = [], departments = [], onClose }) {
  const { t } = useTranslation();

  // ปิดด้วยปุ่ม Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // ล็อค Scroll พื้นหลังเมื่อ Modal เปิดอยู่ เพื่อประสิทธิภาพและความลื่นไหลสูงสุด
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!employee) return null;

  // หาข้อมูลหัวหน้า (Supervisor)
  const supervisor = useMemo(() => {
    if (!employee.parent_id) return null;
    return allEmployees.find((e) => String(e.id) === String(employee.parent_id));
  }, [employee.parent_id, allEmployees]);

  // หาข้อมูลลูกน้องสายตรง (Direct Subordinates)
  const subordinates = useMemo(() => {
    return allEmployees.filter((e) => String(e.parent_id) === String(employee.id));
  }, [employee.id, allEmployees]);

  // หาสีของแผนก
  const deptColor = useMemo(() => {
    const d = departments.find((dept) => dept.name === employee.department);
    return d?.color || '#3b82f6';
  }, [employee.department, departments]);

  // ตรวจสอบ Rank Level เพื่อทำกรอบแสง
  const level = resolveLevel({
    rank: employee.rank,
    position: employee.position,
    isRoot: Boolean(employee.isRoot || !employee.parent_id),
  });

  const rankBadgeConfig = {
    [LEVEL_TYPES.LEGEND]:   { label: 'G1 — Legend Top Level', icon: Star, color: '#ff0080', bg: 'rgba(255,0,128,0.2)', border: '#ff0080' },
    [LEVEL_TYPES.DIAMOND]:  { label: 'G2 — Executive & C-Suite', icon: Diamond, color: '#38bdf8', bg: 'rgba(56,189,248,0.2)', border: '#38bdf8' },
    [LEVEL_TYPES.GOLD]:     { label: 'G3 — Manager & Head', icon: Sun, color: '#fbbf24', bg: 'rgba(251,191,36,0.2)', border: '#fbbf24' },
    [LEVEL_TYPES.SILVER]:   { label: 'G4 — Senior Staff', icon: Snowflake, color: '#cbd5e1', bg: 'rgba(203,213,225,0.2)', border: '#cbd5e1' },
    [LEVEL_TYPES.STANDARD]: { label: 'G5 — General Staff', icon: Flame, color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', border: '#64748b' },
  }[level] || { label: employee.rank || 'Staff', icon: Shield, color: '#60a5fa', bg: 'rgba(96,165,250,0.2)', border: '#60a5fa' };

  const RankIcon = rankBadgeConfig.icon;
  const avatarUrl = employee.avatar_url || employee.avatar;
  const name = employee.name || employee.full_name || '—';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-[3px] animate-modal-overlay"
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
      style={{ overscrollBehavior: 'contain' }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden relative animate-modal-pop"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, #0d172c 0%, #11203d 100%)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(59,130,246,0.15)',
        }}
      >
        {/* Top Decorative Header Accent */}
        <div
          className="h-2 w-full"
          style={{ background: `linear-gradient(90deg, ${deptColor}, #60a5fa, ${rankBadgeConfig.color})` }}
        />

        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/15 border border-blue-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <Shield size={12} className="text-blue-400" />
              <span>ໂໝດເບິ່ງຂໍ້ມູນ / View Only</span>
            </span>
            {employee.staff_id && (
              <span className="text-[11px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                ID: {employee.staff_id}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="ປິດ / ปิด (Close)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Main Profile Info Section */}
        <div className="px-6 py-4 flex flex-col items-center text-center">
          {/* Avatar with Glow (G4 badge removed as requested by CEO MAC) */}
          <div className="relative mb-4">
            <div
              className="w-24 h-24 rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl p-1"
              style={{
                border: `3px solid ${rankBadgeConfig.border}`,
                boxShadow: `0 0 25px ${rankBadgeConfig.color}40`,
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover rounded-2xl"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="w-full h-full items-center justify-center font-black text-white text-3xl tracking-tight select-none rounded-2xl"
                style={{
                  display: avatarUrl ? 'none' : 'flex',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                }}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Name & Position */}
          <h2 className="text-2xl font-black text-white tracking-tight mb-1">{name}</h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-900 text-xs font-black shadow-md mb-3">
            <Briefcase size={12} />
            <span>{employee.position || 'Staff'}</span>
          </div>

          {/* Department & Rank Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {employee.department && (
              <span
                className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border"
                style={{
                  backgroundColor: `${deptColor}20`,
                  borderColor: `${deptColor}50`,
                  color: deptColor,
                }}
              >
                <Building2 size={13} />
                <span>{employee.department}</span>
              </span>
            )}
            <span
              className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 border"
              style={{
                backgroundColor: rankBadgeConfig.bg,
                borderColor: rankBadgeConfig.border,
                color: rankBadgeConfig.color,
              }}
            >
              <RankIcon size={13} />
              <span>{rankBadgeConfig.label}</span>
            </span>
          </div>
        </div>

        {/* Detail Cards List (Hardware Accelerated Smooth Scroll) */}
        <div
          className="px-6 pb-6 space-y-3 max-h-[44vh] overflow-y-auto custom-scrollbar"
          onWheel={(e) => e.stopPropagation()}
          style={{
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            transform: 'translateZ(0)',
            willChange: 'scroll-position',
          }}
        >
          {/* Contact Details */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Phone size={12} className="text-blue-400" />
              <span>{t('tab_contact') || 'ຂໍ້ມູນຕິດຕໍ່ / ข้อมูลติดต่อ'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Phone */}
              {employee.phone ? (
                <a
                  href={`tel:${employee.phone}`}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-slate-200 hover:text-emerald-300 border border-white/5 transition-all"
                  title="ໂທອອກ / โทรออก"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Phone size={14} />
                  </div>
                  <span className="font-mono truncate">{employee.phone}</span>
                </a>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 text-slate-500 text-xs">
                  <Phone size={14} />
                  <span>ບໍ່ມີເບີໂທ / ไม่มีเบอร์</span>
                </div>
              )}

              {/* Email */}
              {employee.email ? (
                <a
                  href={`mailto:${employee.email}`}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white/5 hover:bg-blue-500/20 text-slate-200 hover:text-blue-300 border border-white/5 transition-all"
                  title="ສົ່ງອີເມວ / ส่งอีเมล"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                    <Mail size={14} />
                  </div>
                  <span className="truncate">{employee.email}</span>
                </a>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 text-slate-500 text-xs">
                  <Mail size={14} />
                  <span>ບໍ່ມີອີເມວ / ไม่มีอีเมล</span>
                </div>
              )}

              {/* Social / Messaging */}
              {employee.social && (
                <div className="col-span-full flex items-center gap-2 p-2 rounded-xl bg-white/5 text-slate-200 border border-white/5 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                    <AtSign size={14} />
                  </div>
                  <span className="truncate">{employee.social}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reporting Chain: หัวหน้าสายตรง */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User size={13} className="text-blue-400" />
              <span>{t('col_reports_to') || 'ຫົວໜ້າສາຍຕົງ / ขึ้นตรงต่อ'}</span>
            </h4>
            {supervisor ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/25">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center font-bold text-white text-sm flex-shrink-0 border border-white/10">
                  {supervisor.avatar_url ? (
                    <img src={supervisor.avatar_url} alt={supervisor.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(supervisor.name || '?').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-white font-bold text-sm truncate">{supervisor.name}</div>
                  <div className="text-blue-300 text-xs truncate">{supervisor.position}</div>
                </div>
                {supervisor.rank && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    {supervisor.rank}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-xs text-amber-300/80 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 flex items-center gap-2">
                <span>🌟</span>
                <span>ຕຳແໜ່ງສູງສຸດ / ระดับผู้นำสูงสุด (Top of Hierarchy)</span>
              </div>
            )}
          </div>

          {/* Subordinates List: ลูกน้องสายตรง */}
          {subordinates.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users size={13} className="text-emerald-400" />
                  <span>ທີມງານໃຕ້ບັງຄັບບັນຊາ / สมาชิกในทีม</span>
                </span>
                <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {subordinates.length} ຄົນ
                </span>
              </h4>
              <div className="space-y-1.5">
                {subordinates.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
                      {sub.avatar_url ? (
                        <img src={sub.avatar_url} alt={sub.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{(sub.name || '?').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-white font-semibold text-xs truncate">{sub.name}</div>
                      <div className="text-slate-400 text-[11px] truncate">{sub.position}</div>
                    </div>
                    {sub.rank && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                        {sub.rank}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-900/70 border-t border-white/10 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
          >
            <span>ປິດໜ້າຕ່າງ / ปิดหน้าต่าง (Close)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
