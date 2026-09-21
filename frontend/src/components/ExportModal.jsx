// components/ExportModal.jsx — High Quality Export Dialog for Org Chart
// รองรับการส่งออก: PNG (High-Res Image), PDF Document, JSON Data (Backup), CSV / Excel
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileImage, FileText, FileSpreadsheet, Code2, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export default function ExportModal({
  isOpen,
  onClose,
  employees = [],
  companyName = 'BORCELLE',
  reactFlowWrapperRef,
}) {
  const [exportingType, setExportingType] = useState(null);
  const [successType, setSuccessType] = useState(null);

  if (!isOpen) return null;

  const dateStr = new Date().toISOString().split('T')[0];

  // ฟิลเตอร์กรอง element ที่ไม่ต้องการให้อยู่ในภาพส่งออก (Controls, MiniMap, Toolbar, Modals)
  const exportFilter = (node) => {
    if (node.classList) {
      if (
        node.classList.contains('react-flow__controls') ||
        node.classList.contains('react-flow__minimap') ||
        node.classList.contains('react-flow__panel') ||
        node.classList.contains('react-flow__attribution') ||
        node.classList.contains('export-exclude')
      ) {
        return false;
      }
    }
    return true;
  };

  // ─── 1. EXPORT PNG ─────────────────────────────────────────────
  const handleExportPNG = async () => {
    setExportingType('png');
    try {
      const container = reactFlowWrapperRef?.current || document.querySelector('.react-flow');
      if (!container) throw new Error('ไม่พบคอนเทนเนอร์ผังองค์กร');

      const dataUrl = await toPng(container, {
        backgroundColor: '#0a1628',
        pixelRatio: 2, // ความละเอียดสูง คมชัดระดับ Retina Display
        filter: exportFilter,
      });

      const link = document.createElement('a');
      link.download = `org-chart-${dateStr}.png`;
      link.href = dataUrl;
      link.click();

      setSuccessType('png');
      setTimeout(() => setSuccessType(null), 3000);
    } catch (err) {
      console.error('Export PNG failed:', err);
      alert('ไม่สามารถส่งออกเป็นไฟล์ภาพ PNG ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setExportingType(null);
    }
  };

  // ─── 2. EXPORT PDF ─────────────────────────────────────────────
  const handleExportPDF = async () => {
    setExportingType('pdf');
    try {
      const container = reactFlowWrapperRef?.current || document.querySelector('.react-flow');
      if (!container) throw new Error('ไม่พบคอนเทนเนอร์ผังองค์กร');

      const dataUrl = await toPng(container, {
        backgroundColor: '#0a1628',
        pixelRatio: 2,
        filter: exportFilter,
      });

      // สร้าง PDF ในแนวนอน (Landscape A4)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // หัวข้อเอกสาร
      pdf.setFillColor(10, 22, 40);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      const imgProps = pdf.getImageProperties(dataUrl);
      const imgRatio = imgProps.width / imgProps.height;
      const margin = 10;
      const maxW = pageWidth - margin * 2;
      const maxH = pageHeight - margin * 2;

      let renderW = maxW;
      let renderH = maxW / imgRatio;

      if (renderH > maxH) {
        renderH = maxH;
        renderW = maxH * imgRatio;
      }

      const posX = (pageWidth - renderW) / 2;
      const posY = (pageHeight - renderH) / 2;

      pdf.addImage(dataUrl, 'PNG', posX, posY, renderW, renderH);
      pdf.save(`org-chart-${dateStr}.pdf`);

      setSuccessType('pdf');
      setTimeout(() => setSuccessType(null), 3000);
    } catch (err) {
      console.error('Export PDF failed:', err);
      alert('ไม่สามารถส่งออกเป็นไฟล์ PDF ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setExportingType(null);
    }
  };

  // ─── 3. EXPORT JSON ────────────────────────────────────────────
  const handleExportJSON = () => {
    setExportingType('json');
    try {
      const exportData = {
        exported_at: new Date().toISOString(),
        company: companyName,
        total_employees: employees.length,
        employees: employees.map((emp) => ({
          id: emp.id,
          name: emp.name || emp.full_name,
          position: emp.position,
          department: emp.department,
          parent_id: emp.parent_id,
          layout_type: emp.layout_type || 'horizontal',
          phone: emp.phone || '',
          email: emp.email || '',
          social: emp.social || '',
          avatar_url: emp.avatar_url || '',
        })),
      };

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `org-chart-data-${dateStr}.json`;
      link.click();
      URL.revokeObjectURL(url);

      setSuccessType('json');
      setTimeout(() => setSuccessType(null), 3000);
    } catch (err) {
      console.error('Export JSON failed:', err);
      alert('ไม่สามารถส่งออกไฟล์ JSON ได้');
    } finally {
      setExportingType(null);
    }
  };

  // ─── 4. EXPORT CSV / EXCEL ─────────────────────────────────────
  const handleExportCSV = () => {
    setExportingType('csv');
    try {
      // แผนผัง ID -> Name สำหรับหาชื่อหัวหน้า
      const empMap = new Map();
      employees.forEach((e) => empMap.set(e.id, e.name || e.full_name));

      // UTF-8 BOM (\uFEFF) เพื่อให้ Excel เปิดภาษาไทยได้โดยไม่เป็นภาษาต่างดาว
      const bom = '\uFEFF';
      const headers = [
        'ID',
        'ชื่อ-นามสกุล (Name)',
        'ตำแหน่ง (Position)',
        'แผนก (Department)',
        'หัวหน้างาน (Reports To)',
        'รหัสหัวหน้า (Parent ID)',
        'รูปแบบการแสดงผล (Layout)',
        'เบอร์โทรศัพท์ (Phone)',
        'อีเมล (Email)',
        'Social (@)',
      ];

      const rows = employees.map((emp) => [
        emp.id,
        `"${(emp.name || emp.full_name || '').replace(/"/g, '""')}"`,
        `"${(emp.position || '').replace(/"/g, '""')}"`,
        `"${(emp.department || '').replace(/"/g, '""')}"`,
        `"${(emp.parent_id && empMap.has(emp.parent_id) ? empMap.get(emp.parent_id) : 'ระดับสูงสุด (Top Level)').replace(/"/g, '""')}"`,
        emp.parent_id || '',
        emp.layout_type || 'horizontal',
        `"${(emp.phone || '').replace(/"/g, '""')}"`,
        `"${(emp.email || '').replace(/"/g, '""')}"`,
        `"${(emp.social || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = bom + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `org-chart-employees-${dateStr}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      setSuccessType('csv');
      setTimeout(() => setSuccessType(null), 3000);
    } catch (err) {
      console.error('Export CSV failed:', err);
      alert('ไม่สามารถส่งออกไฟล์ CSV ได้');
    } finally {
      setExportingType(null);
    }
  };

  const options = [
    {
      id: 'png',
      title: 'PNG Image',
      subtitle: 'รูปภาพความละเอียดสูง คมชัดระดับ 2X Retina',
      desc: 'เหมาะสำหรับนำไปแทรกในสไลด์นำเสนอ หรือแชร์ในแชท',
      icon: FileImage,
      color: '#3b82f6',
      bgGlow: 'rgba(59, 130, 246, 0.15)',
      onClick: handleExportPNG,
    },
    {
      id: 'pdf',
      title: 'PDF Document',
      subtitle: 'เอกสารขนาด Landscape A4 พร้อมพิมพ์',
      desc: 'เหมาะสำหรับสั่งพิมพ์ นำเข้าเอกสารราชการ หรือแนบรายงาน',
      icon: FileText,
      color: '#ef4444',
      bgGlow: 'rgba(239, 68, 68, 0.15)',
      onClick: handleExportPDF,
    },
    {
      id: 'json',
      title: 'JSON Data',
      subtitle: 'โครงสร้างข้อมูลพนักงานแบบสมบูรณ์',
      desc: 'เหมาะสำหรับสำรองข้อมูล (Backup) หรือย้ายระบบ (Migrate)',
      icon: Code2,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      onClick: handleExportJSON,
    },
    {
      id: 'csv',
      title: 'CSV / Excel',
      subtitle: 'ตารางรายชื่อพนักงานและลำดับชั้นสายงาน',
      desc: 'รองรับ Microsoft Excel ภาษาไทย (UTF-8 BOM)',
      icon: FileSpreadsheet,
      color: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
      onClick: handleExportCSV,
    },
  ];

  return createPortal(
    <div
      className="export-exclude fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      style={{ willChange: 'opacity' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl flex flex-col overflow-hidden text-slate-100 animate-fade-in"
        style={{
          background: '#0b1528',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(59, 130, 246, 0.15)',
          transform: 'translateZ(0)',
        }}
      >
        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Download size={16} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                ส่งออกผังองค์กร (Export Org Chart)
              </h2>
              <p className="text-blue-400 text-xs mt-0.5">เลือกรูปแบบไฟล์ที่ต้องการบันทึก</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body (Options List) ──────────────────────────── */}
        <div className="p-6 space-y-3">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isProcessing = exportingType === opt.id;
            const isDone = successType === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                disabled={exportingType !== null}
                onClick={opt.onClick}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all group disabled:opacity-50"
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  borderColor: isDone ? opt.color : 'rgba(255, 255, 255, 0.1)',
                }}
                onMouseEnter={(e) => {
                  if (!isDone) e.currentTarget.style.borderColor = opt.color;
                  e.currentTarget.style.background = opt.bgGlow;
                }}
                onMouseLeave={(e) => {
                  if (!isDone) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.7)';
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border transition-transform group-hover:scale-105"
                  style={{
                    background: `${opt.color}22`,
                    borderColor: `${opt.color}44`,
                    color: opt.color,
                  }}
                >
                  {isProcessing ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : isDone ? (
                    <CheckCircle2 size={20} className="text-emerald-400" />
                  ) : (
                    <Icon size={20} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{opt.title}</span>
                    {isDone && (
                      <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        ดาวน์โหลดสำเร็จ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-medium truncate mt-0.5">{opt.subtitle}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Footer ───────────────────────────────────────── */}
        <div className="px-6 py-3 border-t border-white/5 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-blue-400" />
            ข้อมูลพนักงานทั้งหมด: <strong className="text-white">{employees.length} ท่าน</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white px-3 py-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
