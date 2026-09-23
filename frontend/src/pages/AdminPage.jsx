// pages/AdminPage.jsx — Comprehensive Tabbed Admin Panel
// รวม 4 แท็บ: 1. Departments (แผนก) | 2. Employees (พนักงาน) | 3. Canvas Layout Editor (จัดผังลากวาง) | 4. Site Settings (ตั้งค่าแบรนด์)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Building2, LayoutDashboard, Settings as SettingsIcon,
  Plus, Pencil, Trash2, Search, RefreshCw, LogOut, Save, RotateCcw,
  Maximize2, Image, CheckCircle, AlertCircle, ChevronUp, ChevronDown, Sparkles,
  Download, Upload, FileText, FileSpreadsheet, ChevronLeft, ChevronRight as ChevronRightIcon, Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import EmployeeForm from '../components/EmployeeForm';
import OrgChart from '../components/OrgChart';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, saveLayout, resetLayout, batchImportEmployees } from '../api/employeeApi';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../api/departmentApi';
import { getSettings, updateSettings } from '../api/settingsApi';
import { compressImage } from '../utils/imageCompressor';
import * as XLSX from 'xlsx';

export default function AdminPage() {
  const { user, logout } = useAuth();
  const { t } = useTranslation(); // แปลภาษา
  const navigate = useNavigate();

  // Tab State: 'departments' | 'employees' | 'editor' | 'settings'
  const [activeTab, setActiveTab] = useState('employees');

  // Common State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─────────────────────────────────────────────────────────────
  // 1. DATA: EMPLOYEES
  // ─────────────────────────────────────────────────────────────
  const [employees, setEmployees]         = useState([]);
  const [empLoading, setEmpLoading]       = useState(true);
  const [empModalOpen, setEmpModalOpen]   = useState(false);
  const [editEmployee, setEditEmployee]   = useState(null);
  const [deleteEmpModal, setDeleteEmpModal] = useState(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [isAdminDeptOpen, setIsAdminDeptOpen]       = useState(false);
  const adminDeptRef                                = useRef(null);

  // Pagination State
  const [currentPage, setCurrentPage]               = useState(1);
  const [pageSize, setPageSize]                     = useState(10);
  const [isPageSizeOpen, setIsPageSizeOpen]         = useState(false);
  const pageSizeRef                                 = useRef(null);

  // Import / Export State
  const [importModalOpen, setImportModalOpen]       = useState(false);
  const [importPreviewRows, setImportPreviewRows]   = useState([]);
  const [importFileName, setImportFileName]         = useState('');
  const [isImporting, setIsImporting]               = useState(false);
  const fileInputRef                                = useRef(null);

  const [sortField, setSortField]         = useState('id');
  const [sortDir, setSortDir]             = useState('asc');

  const fetchEmployeesData = useCallback(async () => {
    setEmpLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data || []);
    } catch {
      showToast('ไม่สามารถดึงข้อมูลพนักงานได้', 'error');
    } finally {
      setEmpLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 2. DATA: DEPARTMENTS
  // ─────────────────────────────────────────────────────────────
  const [departments, setDepartments]     = useState([]);
  const [deptLoading, setDeptLoading]     = useState(true);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editDept, setEditDept]           = useState(null);
  const [deleteDeptModal, setDeleteDeptModal] = useState(null);
  const [deptForm, setDeptForm]           = useState({ name: '', description: '', color: '#3b82f6' });

  const fetchDepartmentsData = useCallback(async () => {
    setDeptLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data || []);
    } catch {
      showToast('ไม่สามารถดึงข้อมูลแผนกได้', 'error');
    } finally {
      setDeptLoading(false);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 3. DATA: CANVAS LAYOUT EDITOR
  // ─────────────────────────────────────────────────────────────
  const [editorNodes, setEditorNodes]     = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savingLayout, setSavingLayout]   = useState(false);
  const reactFlowInstanceRef = useRef(null);

  const handleNodesUpdate = (nodes) => {
    setEditorNodes(nodes);
    setHasUnsavedChanges(true);
  };

  const handleSaveLayout = async () => {
    if (!editorNodes || editorNodes.length === 0) {
      showToast('ไม่พบข้อมูลตำแหน่งสำหรับบันทึก', 'error');
      return;
    }

    setSavingLayout(true);
    try {
      const positions = editorNodes.map((node) => ({
        id: node.id,
        position_x: Math.round(node.position.x),
        position_y: Math.round(node.position.y),
      }));

      await saveLayout(positions);
      setHasUnsavedChanges(false);
      showToast('💾 บันทึกตำแหน่งผังองค์กรสำเร็จ!');
      await fetchEmployeesData();
    } catch (err) {
      showToast('❌ ไม่สามารถบันทึกตำแหน่งได้', 'error');
    } finally {
      setSavingLayout(false);
    }
  };

  const handleResetLayout = async () => {
    if (!window.confirm('คุณต้องการรีเซ็ตพิกัดทั้งหมดกลับสู่การจัดเรียงกึ่งกลางอัตโนมัติ (Auto-Tree Layout) ใช่หรือไม่?')) return;
    setSavingLayout(true);
    try {
      await resetLayout();
      setHasUnsavedChanges(false);
      showToast('🔄 รีเซ็ตพิกัดผังองค์กรกลับเป็นค่าเริ่มต้นแล้ว');
      await fetchEmployeesData();
    } catch {
      showToast('❌ ไม่สามารถรีเซ็ตผังองค์กรได้', 'error');
    } finally {
      setSavingLayout(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 4. DATA: SITE SETTINGS & BRANDING
  // ─────────────────────────────────────────────────────────────
  const [settings, setSettings]           = useState({
    company_name: 'BORCELLE',
    company_subtitle: 'Organizational Structure',
    header_title: 'ORGANIZATIONAL\nSTRUCTURE',
    header_subtitle: 'team members across your organization',
    company_logo_url: '',
    bg_image_url: '',
    bg_overlay_opacity: '0.85',
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [logoFile, setLogoFile]           = useState(null);
  const [bgFile, setBgFile]               = useState(null);
  const [logoPreview, setLogoPreview]     = useState(null);
  const [bgPreview, setBgPreview]         = useState(null);

  const fetchSettingsData = useCallback(async () => {
    try {
      const data = await getSettings();
      if (data) {
        setSettings(data);
        setLogoPreview(data.company_logo_url || null);
        setBgPreview(data.bg_image_url || null);
      }
    } catch {
      showToast('ไม่สามารถดึงข้อมูลการตั้งค่าแบรนด์ได้', 'error');
    }
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    try {
      const fd = new FormData();
      fd.append('company_name', settings.company_name);
      fd.append('company_subtitle', settings.company_subtitle);
      fd.append('header_title', settings.header_title);
      fd.append('header_subtitle', settings.header_subtitle);
      fd.append('bg_overlay_opacity', settings.bg_overlay_opacity);
      
      // จัดการโลโก้: ส่งไฟล์ใหม่เฉพาะเมื่อมีการเลือกรูปใหม่ หรือส่งค่าว่างหากต้องการลบรูป
      if (logoFile) {
        showToast('🔄 ກຳລັງປັບແຕ່ງຂະໜາດຮູບພາບ / กำลังปรับขนาดรูปภาพ...', 'info');
        const compressedLogo = await compressImage(logoFile, 800, 0.88);
        fd.append('logo', compressedLogo);
      } else if (!settings.company_logo_url) {
        // กรณีผู้ใช้กดลบรูปออก
        fd.append('company_logo_url', '');
      }
      // กรณีไม่ได้เปลี่ยนรูป ไม่ต้องส่ง string base64 ซ้ำ เพื่อให้ payload มีขนาดเล็กมากและบันทึกได้เร็ว

      // จัดการภาพพื้นหลัง:
      if (bgFile) {
        const compressedBg = await compressImage(bgFile, 1920, 0.85);
        fd.append('bg_image', compressedBg);
      } else if (!settings.bg_image_url) {
        fd.append('bg_image_url', '');
      }

      const updated = await updateSettings(fd);
      setSettings(updated);
      setLogoFile(null);
      setBgFile(null);
      if (updated.company_logo_url) setLogoPreview(updated.company_logo_url);
      else setLogoPreview(null);
      if (updated.bg_image_url) setBgPreview(updated.bg_image_url);
      else setBgPreview(null);
      showToast('✅ บันทึกการตั้งค่าเว็บไซต์และแบรนด์สำเร็จ');
    } catch (err) {
      console.error('Save settings error:', err);
      const errMsg = err.response?.data?.message || err.message || 'ไม่สามารถบันทึกการตั้งค่าได้';
      showToast(`❌ ${errMsg}`, 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  // โหลดข้อมูลเริ่มต้น
  useEffect(() => {
    fetchEmployeesData();
    fetchDepartmentsData();
    fetchSettingsData();
  }, [fetchEmployeesData, fetchDepartmentsData, fetchSettingsData]);

  // ─── Sync Browser Title & Favicon ตามการตั้งค่าแบรนด์ ───
  useEffect(() => {
    if (settings?.company_name) {
      document.title = `${settings.company_name} — Admin Backoffice`;
    }
    if (settings?.company_logo_url) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.company_logo_url;
    }
  }, [settings?.company_name, settings?.company_logo_url]);

  // ─────────────────────────────────────────────────────────────
  // HANDLERS: EMPLOYEES CRUD
  // ─────────────────────────────────────────────────────────────
  const handleEmployeeSubmit = async (formData) => {
    try {
      if (editEmployee) {
        await updateEmployee(editEmployee.id, formData);
        showToast(`✅ อัปเดตข้อมูล: ${formData.name}`);
      } else {
        await createEmployee(formData);
        showToast(`✅ เพิ่มพนักงาน: ${formData.name}`);
      }
      await fetchEmployeesData();
      setEditEmployee(null);
    } catch (err) {
      showToast('❌ การทำงานล้มเหลว กรุณาลองใหม่อีกครั้ง', 'error');
      throw err;
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await deleteEmployee(id);
      showToast('🗑️ ลบพนักงานสำเร็จ');
      await fetchEmployeesData();
      setDeleteEmpModal(null);
    } catch {
      showToast('❌ ลบพนักงานไม่สำเร็จ', 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // HANDLERS: DEPARTMENTS CRUD
  // ─────────────────────────────────────────────────────────────
  const handleOpenDeptModal = (dept = null) => {
    if (dept) {
      setEditDept(dept);
      setDeptForm({ name: dept.name, description: dept.description || '', color: dept.color || '#3b82f6' });
    } else {
      setEditDept(null);
      setDeptForm({ name: '', description: '', color: '#3b82f6' });
    }
    setDeptModalOpen(true);
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    if (!deptForm.name.trim()) return;
    try {
      if (editDept) {
        await updateDepartment(editDept.id, deptForm);
        showToast(`✅ แก้ไขแผนก: ${deptForm.name}`);
      } else {
        await createDepartment(deptForm);
        showToast(`✅ เพิ่มแผนก: ${deptForm.name}`);
      }
      setDeptModalOpen(false);
      await fetchDepartmentsData();
      await fetchEmployeesData();
    } catch (err) {
      showToast(err.response?.data?.message || '❌ เกิดข้อผิดพลาดในการบันทึกแผนก', 'error');
    }
  };

  const handleDeleteDept = async (id) => {
    try {
      await deleteDepartment(id);
      showToast('🗑️ ลบแผนกสำเร็จ');
      setDeleteDeptModal(null);
      await fetchDepartmentsData();
      await fetchEmployeesData();
    } catch {
      showToast('❌ ลบแผนกไม่สำเร็จ', 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // FILTER & SORT EMPLOYEES
  // ─────────────────────────────────────────────────────────────
  const filteredEmployees = employees
    .filter((e) => {
      const q = searchQuery.toLowerCase();
      const name = (e.name || e.full_name || '').toLowerCase();
      const matchSearch = name.includes(q) || (e.position || '').toLowerCase().includes(q) || (e.department || '').toLowerCase().includes(q);
      const matchDept = selectedDeptFilter === 'ALL' || e.department === selectedDeptFilter;
      return matchSearch && matchDept;
    })
    .sort((a, b) => {
      const fieldA = sortField === 'full_name' ? 'name' : sortField;
      const valA = a[fieldA] ?? '';
      const valB = b[fieldA] ?? '';
      const cmp = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const getParentName = (parentId) => {
    if (!parentId) return '—';
    const parent = employees.find((e) => e.id === parentId);
    return parent ? parent.name || parent.full_name : '—';
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const getDeptColor = (deptName) => {
    const d = departments.find((dept) => dept.name === deptName);
    return d?.color || '#3b82f6';
  };

  // รีเซ็ตหน้ากลับเป็นหน้า 1 เมื่อมีการค้นหา หรือกรองแผนก หรือเปลี่ยนขนาดหน้า
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDeptFilter, pageSize]);

  // ปิด Dropdown เมื่อคลิกนอกพื้นที่
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (adminDeptRef.current && !adminDeptRef.current.contains(e.target)) {
        setIsAdminDeptOpen(false);
      }
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target)) {
        setIsPageSizeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // คำนวณข้อมูล Pagination
  const totalPages = Math.ceil(filteredEmployees.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredEmployees.length);
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  // ─── แสดง Badge ระดับพนักงาน (Rank G1–G5) ในตาราง ───
  const renderRankBadge = (rank) => {
    const r = String(rank || '').trim().toUpperCase();
    if (r === 'G1') {
      return (
        <span
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black text-pink-300 border border-pink-500/40 shadow-sm"
          style={{ background: 'linear-gradient(135deg, rgba(255,0,128,0.25), rgba(0,191,255,0.25))' }}
        >
          🌟 G1
        </span>
      );
    }
    if (r === 'G2') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-sky-300 bg-sky-500/15 border border-sky-500/35">
          💎 G2
        </span>
      );
    }
    if (r === 'G3') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/35">
          ☀️ G3
        </span>
      );
    }
    if (r === 'G4') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-slate-200 bg-slate-500/20 border border-slate-400/30">
          ❄️ G4
        </span>
      );
    }
    if (r === 'G5') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-slate-300 bg-slate-800 border border-white/10">
          🔥 G5
        </span>
      );
    }
    return <span className="text-slate-600 text-xs font-mono">—</span>;
  };

  // ─── ส่งออกข้อมูลพนักงานเป็น Microsoft Excel (.xlsx แท้) ───
  const handleExportExcel = () => {
    if (filteredEmployees.length === 0) {
      showToast('ບໍ່ມີຂໍ້ມູນພະນັກງານສຳລັບສົ່ງອອກ / ไม่มีข้อมูลสำหรับส่งออก', 'error');
      return;
    }
    try {
      const headers = ['ID', 'Name', 'Position', 'Department', 'Rank', 'ReportsTo', 'Phone', 'Email'];
      const rows = filteredEmployees.map((e) => [
        e.id,
        e.name || e.full_name || '',
        e.position || '',
        e.department || '',
        e.rank || '',
        getParentName(e.parent_id) || '',
        e.phone || '',
        e.email || '',
      ]);

      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws['!cols'] = [
        { wch: 8 },
        { wch: 26 },
        { wch: 22 },
        { wch: 18 },
        { wch: 12 },
        { wch: 24 },
        { wch: 16 },
        { wch: 26 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `employees_${dateStr}.xlsx`);
      showToast(`ສົ່ງອອກ Excel ສຳເລັດ ${filteredEmployees.length} ຄົນ`, 'success');
    } catch (err) {
      console.error('Export Excel error:', err);
      showToast('ບໍ່ສາມາດສົ່ງອອກໄຟລ໌ Excel ໄດ້', 'error');
    }
  };

  // ─── ดาวน์โหลดตัวอย่างไฟล์ Excel Template (.xlsx) สำหรับนำเข้า ───
  const handleDownloadTemplate = () => {
    try {
      const headers = ['Name', 'Position', 'Department', 'Rank', 'Phone', 'Email', 'ReportsTo'];
      const sampleRows = [
        ['Alex Morgan', 'CEO & Founder', 'Executive', 'G1', '0201234567', 'alex@company.com', ''],
        ['Somsack Soulivong', 'IT Director', 'IT', 'G2', '0209876543', 'somsack@company.com', 'Alex Morgan'],
        ['Keo Phommavong', 'Senior Developer', 'IT', 'G3', '0205555444', 'keo@company.com', 'Somsack Soulivong'],
        ['Noy Sengchanh', 'HR Manager', 'HR', 'G2', '0207777888', 'noy@company.com', 'Alex Morgan'],
        ['Somchai Prasert', 'Senior Accountant', 'Finance', 'G4', '0203333222', 'somchai@company.com', 'Noy Sengchanh'],
        ['Manee Jaidee', 'Junior Officer', 'Finance', 'G5', '0201111999', 'manee@company.com', 'Somchai Prasert'],
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
      ws['!cols'] = [
        { wch: 24 },
        { wch: 22 },
        { wch: 18 },
        { wch: 12 },
        { wch: 16 },
        { wch: 26 },
        { wch: 24 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Import Template');
      XLSX.writeFile(wb, 'employee_import_template.xlsx');
    } catch (err) {
      console.error('Download template error:', err);
      showToast('ບໍ່ສາມາດດາວໂຫຼດ Template ໄດ້', 'error');
    }
  };

  // ─── นำเข้าและแยกวิเคราะห์ไฟล์ (.xlsx, .xls, .csv) ด้วย SheetJS ───
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length < 2) {
          showToast('ບໍ່ພົບຂໍ້ມູນພະນັກງານໃນໄຟລ໌ / ไม่พบข้อมูลพนักงานในไฟล์', 'error');
          return;
        }

        const rawHeaders = (rawRows[0] || []).map((h) =>
          String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
        );

        const items = [];
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0 || !row.some((c) => String(c).trim().length > 0)) continue;

          const obj = {};
          rawHeaders.forEach((h, idx) => {
            const val = String(row[idx] ?? '').trim();
            if (h.includes('name') || h === 'fullname') obj.name = val;
            else if (h.includes('pos') || h === 'title') obj.position = val;
            else if (h.includes('dep') || h === 'team') obj.department = val;
            else if (h.includes('rank') || h === 'grade') obj.rank = val;
            else if (h.includes('phone') || h === 'tel') obj.phone = val;
            else if (h.includes('mail')) obj.email = val;
            else if (h.includes('report') || h.includes('super') || h.includes('parent')) obj.supervisor = val;
          });

          if (obj.name) {
            if (!obj.position) obj.position = 'Staff';
            items.push(obj);
          }
        }

        if (items.length === 0) {
          showToast('ບໍ່ພົບຂໍ້ມູນພະນັກງານໃນໄຟລ໌ / ไม่พบข้อมูลพนักงานในไฟล์', 'error');
          return;
        }
        setImportPreviewRows(items);
      } catch (err) {
        console.error('File parse error:', err);
        showToast('ບໍ່ສາມາດອ່ານໄຟລ໌ Excel/CSV ໄດ້ / ไม่สามารถอ่านไฟล์ได้', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    if (importPreviewRows.length === 0) return;
    setIsImporting(true);
    try {
      const res = await batchImportEmployees(importPreviewRows);
      if (res.success) {
        showToast(`${t('confirm_import')} ສຳເລັດ ${res.count} ຄົນ`, 'success');
        setImportModalOpen(false);
        setImportPreviewRows([]);
        setImportFileName('');
        await fetchEmployeesData();
      } else {
        showToast(res.message || 'ເກີດຂໍ້ຜິດພາດໃນການນຳເຂົ້າ', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'ບໍ່ສາມາດນຳເຂົ້າຂໍ້ມູນໄດ້', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0f2147 50%, #0a1628 100%)' }}
    >
      {/* ─── Toast Notification ─────────────────────── */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl text-sm font-semibold animate-fade-in shadow-2xl flex items-center gap-2"
          style={{
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
            backdropFilter: 'blur(12px)',
            color: 'white',
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ─── Top Navigation Bar ─────────────────────── */}
      <header
        className="sticky top-0 z-30 px-8 py-4 flex items-center justify-between border-b border-white/10"
        style={{ background: 'rgba(10, 22, 40, 0.92)', backdropFilter: 'blur(14px)' }}
      >
        <div className="flex items-center gap-5">
          <Link
            to="/"
            className="flex items-center gap-1.5 min-w-[105px] text-slate-400 hover:text-white transition-colors text-sm font-medium select-none"
          >
            <ArrowLeft size={16} />
            <span>{t('back_to_chart')}</span>
          </Link>
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2.5">
            {settings?.company_logo_url ? (
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center p-1 shadow-md">
                <img src={settings.company_logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black shadow-md"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
              >
                🏢
              </div>
            )}
            <div>
              <h1 className="text-white font-black text-base leading-none uppercase tracking-wide">
                {settings?.company_name ? `${settings.company_name} ADMIN` : 'BORCELLE ADMIN'}
              </h1>
              <p className="text-blue-300 text-[11px] mt-0.5">Management Backoffice</p>
            </div>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <LanguageSwitcher />
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t('logged_in_as')}: <strong className="text-white">{user?.username || 'admin'}</strong></span>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="flex items-center justify-center gap-1.5 min-w-[105px] px-3.5 py-1.5 rounded-xl text-xs font-semibold text-red-300 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all cursor-pointer select-none"
          >
            <LogOut size={14} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </header>

      {/* ─── Tabs Bar ───────────────────────────────── */}
      <div className="px-8 pt-4 border-b border-white/10 bg-black/20 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav className="flex gap-2">
            {[
              { id: 'departments', label: t('tab_departments'), icon: Building2, count: departments.length },
              { id: 'employees',   label: t('tab_employees'),   icon: Users,     count: employees.length },
              { id: 'editor',      label: t('tab_editor'), icon: LayoutDashboard, badge: hasUnsavedChanges ? t('unsaved_changes') : null },
              { id: 'settings',    label: t('tab_settings'), icon: SettingsIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all select-none ${
                    isActive
                      ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-xl'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5 rounded-t-xl'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                      {tab.count}
                    </span>
                  )}
                  {tab.badge && (
                    <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ─── Main Content Container ─────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-8 py-6">

        {/* ═════════════════════════════════════════════ */}
        {/* TAB 1: DEPARTMENTS                            */}
        {/* ═════════════════════════════════════════════ */}
        {activeTab === 'departments' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">จัดการแผนก (Departments)</h2>
                <p className="text-slate-400 text-xs mt-0.5">สร้างและกำหนดสีสำหรับแต่ละแผนก เพื่อนำไปจัดกลุ่มพนักงาน</p>
              </div>
              <button
                onClick={() => handleOpenDeptModal(null)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-lg"
                style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 15px rgba(37,99,235,0.4)' }}
              >
                <Plus size={16} />
                <span>เพิ่มแผนกใหม่</span>
              </button>
            </div>

            {/* Department Cards Grid */}
            {deptLoading ? (
              <div className="py-20 text-center"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : departments.length === 0 ? (
              <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
                <Building2 size={40} className="text-slate-500 mx-auto mb-3" />
                <p className="text-white font-bold">ยังไม่มีแผนกในระบบ</p>
                <p className="text-slate-400 text-xs mt-1">กดปุ่ม "เพิ่มแผนกใหม่" เพื่อเริ่มต้น</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <div
                    key={dept.id}
                    className="rounded-2xl p-5 border transition-all hover:-translate-y-1 relative overflow-hidden"
                    style={{
                      background: 'rgba(15, 33, 71, 0.65)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    }}
                  >
                    {/* Top Color Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: dept.color || '#3b82f6' }} />

                    <div className="flex items-start justify-between mt-1 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: dept.color || '#3b82f6', boxShadow: `0 0 10px ${dept.color}80` }}
                        />
                        <h3 className="text-white font-bold text-base">{dept.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenDeptModal(dept)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-white/10 transition-colors"
                          title="แก้ไขแผนก"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteDeptModal(dept)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                          title="ลบแผนก"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-300 text-xs line-clamp-2 min-h-[32px] mb-4">
                      {dept.description || 'ไม่มีคำอธิบาย'}
                    </p>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                      <span>สมาชิกในแผนก:</span>
                      <span className="font-bold text-white px-2.5 py-0.5 rounded-full bg-white/10 font-mono">
                        {dept.employee_count || 0} คน
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════ */}
        {/* TAB 2: EMPLOYEES                              */}
        {/* ═════════════════════════════════════════════ */}
        {activeTab === 'employees' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header + Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white">จัดการพนักงาน (Employees)</h2>
                <p className="text-slate-400 text-xs mt-0.5">เพิ่ม ลบ หรือแก้ไขข้อมูลพนักงานและสายการบังคับบัญชา</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={fetchEmployeesData}
                  className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
                  title="รีเฟรชข้อมูล / Refresh"
                >
                  <RefreshCw size={15} className={empLoading ? 'animate-spin' : ''} />
                </button>

                {/* ปุ่มส่งออก Excel (.xlsx แท้) */}
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:text-white transition-all shadow-sm cursor-pointer"
                  title="ສົ່ງອອກໄຟລ໌ Excel (.xlsx) / Export Excel"
                >
                  <FileSpreadsheet size={14} className="text-emerald-400" />
                  <span>ສົ່ງອອກ Excel</span>
                </button>

                {/* ปุ่มนำเข้า Excel / CSV (Import Excel) */}
                <button
                  type="button"
                  onClick={() => {
                    setImportPreviewRows([]);
                    setImportFileName('');
                    setImportModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:text-white transition-all shadow-sm cursor-pointer"
                  title="ນຳເຂົ້າໄຟລ໌ Excel (.xlsx, .xls, .csv) / Import Excel"
                >
                  <Upload size={14} className="text-amber-400" />
                  <span>ນຳເຂົ້າ Excel</span>
                </button>

                <button
                  onClick={() => { setEditEmployee(null); setEmpModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-lg cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 15px rgba(37,99,235,0.4)' }}
                >
                  <Plus size={16} />
                  <span>{t('add_employee')}</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="ຄົ້ນຫາຊື່, ຕຳແໜ່ງ ຫຼື ພະແນກ / ค้นหาชื่อ, ตำแหน่ง หรือแผนก..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500 outline-none border border-white/10 bg-white/5 focus:border-blue-500 transition-all"
                />
              </div>

              {/* ─── Department Custom Glassmorphism Dropdown Filter ─── */}
              <div className="relative w-full sm:w-64" ref={adminDeptRef}>
                <button
                  type="button"
                  onClick={() => setIsAdminDeptOpen(!isAdminDeptOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm text-white outline-none border border-white/10 bg-slate-900/80 hover:bg-slate-900/95 transition-all cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 size={15} className="text-blue-400 flex-shrink-0" />
                    <span className="truncate">
                      {selectedDeptFilter === 'ALL' ? t('filter_all_dept_title') : selectedDeptFilter}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 ${isAdminDeptOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isAdminDeptOpen && (
                  <div
                    className="absolute right-0 mt-2 w-full rounded-2xl shadow-2xl z-50 overflow-hidden border border-white/15 animate-fade-in"
                    style={{
                      background: 'rgba(15, 23, 42, 0.96)',
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
                    }}
                  >
                    <div className="p-1.5 max-h-60 overflow-y-auto space-y-1">
                      <button
                        type="button"
                        onClick={() => { setSelectedDeptFilter('ALL'); setIsAdminDeptOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          selectedDeptFilter === 'ALL'
                            ? 'bg-blue-600/35 text-white border border-blue-500/40'
                            : 'text-slate-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                          <span>{t('filter_all_dept_title')}</span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                          {employees.length}
                        </span>
                      </button>

                      {departments.map((d) => {
                        const isSelected = selectedDeptFilter === d.name;
                        const countInDept = employees.filter((e) => e.department === d.name).length;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => { setSelectedDeptFilter(d.name); setIsAdminDeptOpen(false); }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600/35 text-white border border-blue-500/40'
                                : 'text-slate-300 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: d.color || '#3b82f6' }}
                              />
                              <span className="truncate">{d.name}</span>
                            </div>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 shrink-0 font-mono">
                              {countInDept}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Table */}
            <div
              className="rounded-2xl overflow-hidden border border-white/10"
              style={{ background: 'rgba(15, 33, 71, 0.5)' }}
            >
              {empLoading ? (
                <div className="py-20 text-center"><div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : filteredEmployees.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <div className="text-4xl mb-2">🔍</div>
                  <p>ບໍ່ພົບລາຍຊື່ພະນັກງານທີ່ກົງກັບເງື່ອນໄຂ / ไม่พบรายชื่อพนักงานที่ตรงกับเงื่อนไข</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/10 bg-black/30 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-5 py-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('id')}>#</th>
                        <th className="px-5 py-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('full_name')}>{t('col_name')}</th>
                        <th className="px-5 py-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('position')}>{t('col_position')}</th>
                        <th className="px-5 py-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('department')}>{t('col_department')}</th>
                        <th className="px-5 py-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('rank')}>{t('col_rank')}</th>
                        <th className="px-5 py-3.5">{t('col_reports_to')}</th>
                        <th className="px-5 py-3.5 text-right">{t('col_actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEmployees.map((emp, idx) => (
                        <tr
                          key={emp.id}
                          className="border-b border-white/5 hover:bg-blue-500/5 transition-colors"
                        >
                          <td className="px-5 py-3 text-xs font-mono text-slate-500">#{emp.id}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-sm"
                                style={{ background: 'linear-gradient(135deg, #1e3a8a, #1e40af)' }}
                              >
                                {emp.avatar_url ? (
                                  <img src={emp.avatar_url} alt={emp.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-white font-black">{(emp.name || '?').charAt(0)}</span>
                                )}
                              </div>
                              <div>
                                <div className="text-white font-bold text-sm">{emp.name || emp.full_name}</div>
                                <div className="text-slate-400 text-xs">{emp.email || emp.phone || emp.social || '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-200">{emp.position}</td>
                          <td className="px-5 py-3">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-xs font-semibold inline-block"
                              style={{
                                backgroundColor: `${getDeptColor(emp.department)}20`,
                                color: getDeptColor(emp.department),
                                border: `1px solid ${getDeptColor(emp.department)}40`,
                              }}
                            >
                              {emp.department}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {renderRankBadge(emp.rank)}
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-300">{getParentName(emp.parent_id)}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setEditEmployee(emp); setEmpModalOpen(true); }}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Pencil size={12} />
                                <span>{t('edit')}</span>
                              </button>
                              <button
                                onClick={() => setDeleteEmpModal(emp)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 size={12} />
                                <span>{t('delete')}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ─── Pagination Control Bar ─── */}
              {filteredEmployees.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-4 border-t border-white/10 bg-black/20 text-xs text-slate-400 select-none">
                  {/* แสดงสถิติจำนวนรายการ */}
                  <div className="flex items-center gap-1.5">
                    <span>{t('pagination_showing')}</span>
                    <strong className="text-white font-bold">{startIndex + 1}</strong>
                    <span>{t('pagination_to')}</span>
                    <strong className="text-white font-bold">{endIndex}</strong>
                    <span>{t('pagination_of')}</span>
                    <strong className="text-blue-400 font-bold">{filteredEmployees.length}</strong>
                    <span>{t('pagination_items')}</span>
                  </div>

                  {/* ปุ่มเปลี่ยนหน้า Pagination */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <ChevronLeft size={14} />
                      <span>{t('pagination_prev')}</span>
                    </button>

                    {/* หมายเลขหน้า */}
                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                        .map((p, idx, arr) => (
                          <React.Fragment key={p}>
                            {idx > 0 && arr[idx - 1] !== p - 1 && (
                              <span className="px-1 text-slate-500">...</span>
                            )}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(p)}
                              className={`w-8 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                currentPage === p
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        ))}
                    </div>

                    <button
                      type="button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <span>{t('pagination_next')}</span>
                      <ChevronRightIcon size={14} />
                    </button>
                  </div>

                  {/* ขนาดจำนวนแถวต่อหน้า (10, 25, 50, 100) */}
                  <div className="flex items-center gap-2" ref={pageSizeRef}>
                    <span>{t('pagination_per_page')}:</span>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsPageSizeOpen(!isPageSizeOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white font-bold text-xs cursor-pointer"
                      >
                        <span>{pageSize}</span>
                        <ChevronDown size={12} className={`transition-transform ${isPageSizeOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isPageSizeOpen && (
                        <div
                          className="absolute right-0 bottom-full mb-2 w-24 rounded-xl shadow-2xl border border-white/15 overflow-hidden z-50 animate-fade-in"
                          style={{ background: 'rgba(15, 23, 42, 0.96)', backdropFilter: 'blur(16px)' }}
                        >
                          {[10, 25, 50, 100].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                setPageSize(size);
                                setIsPageSizeOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-xs font-semibold transition-colors cursor-pointer ${
                                pageSize === size
                                  ? 'bg-blue-600/35 text-blue-300'
                                  : 'text-slate-300 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {size} {t('pagination_items')}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════ */}
        {/* TAB 3: CANVAS LAYOUT EDITOR                   */}
        {/* ═════════════════════════════════════════════ */}
        {activeTab === 'editor' && (
          <div className="space-y-4 animate-fade-in">
            {/* Editor Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white">Interactive Canvas Layout Editor</h2>
                  {hasUnsavedChanges && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      ● มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-xs mt-0.5">
                  คลิกลากขยับการ์ดพนักงานไปยังตำแหน่งที่ต้องการ แล้วกด "บันทึกตำแหน่ง" เพื่อให้หน้าผังหลักแสดงผลตามนี้
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleResetLayout}
                  disabled={savingLayout}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 border border-white/15 hover:bg-white/10 transition-all disabled:opacity-50"
                  title="รีเซ็ตกลับเป็นค่ากึ่งกลางอัตโนมัติ"
                >
                  <RotateCcw size={14} />
                  <span>รีเซ็ต Auto Layout</span>
                </button>

                <button
                  onClick={() => reactFlowInstanceRef.current?.fitView({ padding: 0.2, duration: 500 })}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 border border-white/15 hover:bg-white/10 transition-all"
                  title="จัดกึ่งกลางมุมมอง"
                >
                  <Maximize2 size={14} />
                  <span>จัดกึ่งกลาง</span>
                </button>

                <button
                  onClick={handleSaveLayout}
                  disabled={savingLayout}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-lg disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <Save size={15} />
                  <span>{savingLayout ? 'กำลังบันทึก...' : '💾 บันทึกตำแหน่ง (Save Layout)'}</span>
                </button>
              </div>
            </div>

            {/* React Flow Canvas Container */}
            <div
              className="w-full rounded-3xl overflow-hidden border border-white/15 shadow-2xl relative"
              style={{ height: '70vh', background: 'rgba(10, 22, 40, 0.85)' }}
            >
              <OrgChart
                employees={employees}
                loading={empLoading}
                isEditor={true}
                onNodesUpdate={handleNodesUpdate}
                instanceRef={reactFlowInstanceRef}
              />
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════ */}
        {/* TAB 4: SITE SETTINGS & BRANDING               */}
        {/* ═════════════════════════════════════════════ */}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-black text-white">ตั้งค่าแบรนด์และหน้าตาเว็บไซต์ (Site Settings)</h2>
              <p className="text-slate-400 text-xs mt-0.5">ปรับแต่งโลโก้บริษัท, ภาพพื้นหลัง, และข้อความหัวข้อในหน้า Public</p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Card 1: Branding Info */}
              <div className="p-6 rounded-3xl border border-white/10 bg-white/5 space-y-4">
                <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2 uppercase tracking-wider">
                  <Sparkles size={16} />
                  <span>ข้อมูลบริษัทและข้อความหัวข้อ</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">ชื่อบริษัท (Company Name)</label>
                    <input
                      type="text"
                      value={settings.company_name}
                      onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-black/30 border border-white/10 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">คำบรรยายย่อย (Company Subtitle)</label>
                    <input
                      type="text"
                      value={settings.company_subtitle}
                      onChange={(e) => setSettings({ ...settings, company_subtitle: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-black/30 border border-white/10 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">ข้อความหัวข้อลอย (Header Title)</label>
                    <textarea
                      rows={2}
                      value={settings.header_title}
                      onChange={(e) => setSettings({ ...settings, header_title: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl text-white bg-black/30 border border-white/10 outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">ข้อความบรรยายผัง (Header Subtitle)</label>
                    <textarea
                      rows={2}
                      value={settings.header_subtitle}
                      onChange={(e) => setSettings({ ...settings, header_subtitle: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl text-white bg-black/30 border border-white/10 outline-none focus:border-blue-500 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Assets Upload */}
              <div className="p-6 rounded-3xl border border-white/10 bg-white/5 space-y-5">
                <h3 className="text-sm font-bold text-blue-300 flex items-center gap-2 uppercase tracking-wider">
                  <Image size={16} />
                  <span>รูปภาพโลโก้และพื้นหลังเว็บไซต์</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Logo */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">โลโก้บริษัท (Company Logo)</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center p-2">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                        ) : (
                          <span className="text-2xl">🏢</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setLogoFile(file);
                              setLogoPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">แนะนำรูป PNG พื้นหลังโปร่งใส</p>
                      </div>
                    </div>
                  </div>

                  {/* Background Image */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">ภาพพื้นหลังเว็บไซต์ (Background Image)</label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-16 rounded-2xl bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center">
                        {bgPreview ? (
                          <img src={bgPreview} alt="Background" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-500">ค่าเริ่มต้น</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setBgFile(file);
                              setBgPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">แนะนำความละเอียด 1920x1080px ขึ้นไป</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background Opacity */}
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                    <label className="font-semibold">ความทึบของเลเยอร์สีน้ำเงินทับพื้นหลัง (Overlay Darkening)</label>
                    <span className="font-mono text-blue-400 font-bold">{Math.round(parseFloat(settings.bg_overlay_opacity || 0.85) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="0.95"
                    step="0.05"
                    value={settings.bg_overlay_opacity || '0.85'}
                    onChange={(e) => setSettings({ ...settings, bg_overlay_opacity: e.target.value })}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="px-8 py-3 rounded-2xl text-sm font-bold text-white transition-all shadow-xl disabled:opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    boxShadow: '0 8px 25px rgba(37, 99, 235, 0.4)',
                  }}
                >
                  {settingsLoading ? 'กำลังบันทึกการตั้งค่า...' : '💾 บันทึกการตั้งค่าเว็บไซต์ทั้งหมด'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ───────────────────────────────────────────── */}
      {/* MODAL: ADD / EDIT DEPARTMENT                  */}
      {/* ───────────────────────────────────────────── */}
      {deptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-3xl p-6 border border-white/10 animate-fade-in shadow-2xl"
            style={{ background: 'rgba(15, 33, 71, 0.98)' }}
          >
            <h3 className="text-lg font-black text-white mb-1">
              {editDept ? '✏️ แก้ไขแผนก' : '➕ เพิ่มแผนกใหม่'}
            </h3>
            <p className="text-slate-400 text-xs mb-4">กำหนดชื่อ คำอธิบาย และโทนสีสำหรับระบุแผนก</p>

            <form onSubmit={handleDeptSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">ชื่อแผนก *</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="เช่น Research & Development"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">คำอธิบายแผนก (Description)</label>
                <textarea
                  rows={2}
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  placeholder="รายละเอียดหน้าที่ความรับผิดชอบของแผนก..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">โทนสีของแผนก (Accent Color)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={deptForm.color}
                    onChange={(e) => setDeptForm({ ...deptForm, color: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {['#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#0ea5e9', '#ec4899'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setDeptForm({ ...deptForm, color: c })}
                        className="w-7 h-7 rounded-lg border border-white/20 transition-transform hover:scale-110"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-300 border border-white/10 hover:bg-white/5"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
                >
                  {editDept ? 'บันทึกการแก้ไข' : 'สร้างแผนก'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────── */}
      {/* MODAL: DELETE DEPARTMENT CONFIRMATION         */}
      {/* ───────────────────────────────────────────── */}
      {deleteDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl p-6 border border-red-500/30 bg-slate-900 animate-fade-in text-center shadow-2xl">
            <div className="text-4xl mb-2">🗑️</div>
            <h3 className="text-lg font-bold text-white">ยืนยันการลบแผนก?</h3>
            <p className="text-slate-400 text-xs mt-1 mb-4">
              ต้องการลบแผนก <strong className="text-white">{deleteDeptModal.name}</strong> หรือไม่?<br />
              <span className="text-amber-400 mt-2 block">
                ⚠️ พนักงานในแผนกนี้จะไม่ถูกลบ แต่จะถูกย้ายเป็นแผนก "Other" ชั่วคราว
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteDeptModal(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-300 border border-white/10 hover:bg-white/5"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleDeleteDept(deleteDeptModal.id)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-lg"
              >
                ลบแผนก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────── */}
      {/* MODAL: ADD / EDIT EMPLOYEE                    */}
      {/* ───────────────────────────────────────────── */}
      <EmployeeForm
        isOpen={empModalOpen}
        onClose={() => { setEmpModalOpen(false); setEditEmployee(null); }}
        onSubmit={handleEmployeeSubmit}
        editEmployee={editEmployee}
        employees={employees}
        departments={departments}
      />

      {/* ───────────────────────────────────────────── */}
      {/* MODAL: DELETE EMPLOYEE CONFIRMATION           */}
      {/* ───────────────────────────────────────────── */}
      {deleteEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl p-6 border border-red-500/30 bg-slate-900 animate-fade-in text-center shadow-2xl">
            <div className="text-4xl mb-2">🗑️</div>
            <h3 className="text-lg font-bold text-white">ลบพนักงาน?</h3>
            <p className="text-slate-400 text-xs mt-1 mb-4">
              ยืนยันการลบ <strong className="text-white">{deleteEmpModal.name || deleteEmpModal.full_name}</strong> ออกจากระบบ?<br />
              <span className="text-amber-400 mt-2 block">
                ⚠️ ผู้ใต้บังคับบัญชาจะถูกปรับให้ขึ้นตรงกับหัวหน้าของพนักงานท่านนี้โดยอัตโนมัติ
              </span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteEmpModal(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-300 border border-white/10 hover:bg-white/5"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDeleteEmployee(deleteEmpModal.id)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-lg"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────── */}
      {/* MODAL: IMPORT EMPLOYEES FROM CSV              */}
      {/* ───────────────────────────────────────────── */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fade-in">
          <div
            className="w-full max-w-2xl rounded-3xl p-6 border border-white/15 bg-slate-900 shadow-2xl space-y-5"
            style={{
              background: '#0f172a',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{t('modal_import_title')}</h3>
                  <p className="text-slate-400 text-xs mt-0.5">{t('template_desc')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setImportModalOpen(false); setImportPreviewRows([]); }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Template Download Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet size={18} className="text-emerald-400 flex-shrink-0" />
                <div className="text-xs">
                  <strong className="text-white block font-bold">ດາວໂຫຼດຟອມຕົວຢ່າງ Excel / ดาวน์โหลด Template Excel (.xlsx)</strong>
                  <span className="text-emerald-200/70">ມີຫົວຕາຕະລາງ G1–G5 ແລະ ຕົວຢ່າງຂໍ້ມູນພ້ອມໃຊ້ງານ</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-300 hover:text-white bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 transition-all cursor-pointer whitespace-nowrap"
              >
                <Download size={13} />
                <span>ດາວໂຫຼດ Excel (.xlsx)</span>
              </button>
            </div>

            {/* File Drop / Select Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 hover:border-emerald-400/60 bg-white/5 hover:bg-emerald-500/5 rounded-2xl p-6 text-center cursor-pointer transition-all group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:scale-110 transition-all">
                <FileSpreadsheet size={22} />
              </div>
              <p className="text-white text-xs font-bold mb-1">
                {importFileName ? `ໄຟລ໌ທີ່ເລືອກ: ${importFileName}` : 'ຄລິກເພື່ອເລືອກໄຟລ໌ ຫຼື ລາກໄຟລ໌ Excel / CSV ມາວາງທີ່ນີ້'}
              </p>
              <p className="text-slate-500 text-[11px]">ຮອງຮັບໄຟລ໌ Microsoft Excel (.xlsx, .xls) ແລະ CSV UTF-8</p>
            </div>

            {/* Preview Section */}
            {importPreviewRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">{t('preview_data')} ({importPreviewRows.length} ຄົນ):</span>
                  <span className="text-emerald-400 font-bold">✓ ກວດພົບຂໍ້ມູນຖືກຕ້ອງ</span>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-black/30">
                  <table className="w-full text-left text-[11px]">
                    <thead className="border-b border-white/10 bg-white/5 text-slate-400 uppercase">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">{t('col_name')}</th>
                        <th className="p-2">{t('col_position')}</th>
                        <th className="p-2">{t('col_department')}</th>
                        <th className="p-2">{t('col_rank') || 'ລະດັບ'}</th>
                        <th className="p-2">{t('col_reports_to')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {importPreviewRows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="p-2 text-slate-500">{i + 1}</td>
                          <td className="p-2 font-bold text-white">{row.name}</td>
                          <td className="p-2 text-slate-300">{row.position}</td>
                          <td className="p-2 text-blue-300">{row.department || '—'}</td>
                          <td className="p-2 text-slate-400">{row.rank || '—'}</td>
                          <td className="p-2 text-slate-400">{row.supervisor || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importPreviewRows.length > 5 && (
                  <p className="text-[11px] text-slate-500 text-right">
                    ...ແລະ ອີກ {importPreviewRows.length - 5} ຄົນ
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => { setImportModalOpen(false); setImportPreviewRows([]); }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={importPreviewRows.length === 0 || isImporting}
                onClick={handleConfirmImport}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  boxShadow: '0 4px 15px rgba(37,99,235,0.4)',
                }}
              >
                {isImporting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>{t('importing')}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    <span>{t('confirm_import')} ({importPreviewRows.length} ຄົນ)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
