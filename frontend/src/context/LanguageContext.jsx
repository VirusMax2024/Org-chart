// context/LanguageContext.jsx — Multi-Language Support: TH | EN | LO
// ระบบภาษา 3 ภาษา บันทึกใน localStorage เพื่อ persist หลัง refresh
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import translations from '../i18n';

const LanguageContext = createContext(null);

// ── LanguageProvider: ครอบ App ทั้งหมด ──────────────────────────
export function LanguageProvider({ children }) {
  // อ่านภาษาจาก localStorage หรือค่าเริ่มต้นเป็น 'lo' (ພາສາລາວ) ตามคำสั่งของ CEO MAC
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('org_chart_lang');
      return ['lo', 'th', 'en'].includes(saved) ? saved : 'lo';
    } catch {
      return 'lo';
    }
  });

  // อัปเดต attribute ของ <html> ทันทีเมื่อภาษาเปลี่ยน เพื่อให้ font-family สลับอย่างสมบูรณ์
  useEffect(() => {
    try {
      document.documentElement.lang = lang;
      document.documentElement.setAttribute('data-lang', lang);
    } catch {}
  }, [lang]);

  // เปลี่ยนภาษาและบันทึกลง localStorage
  const setLang = useCallback((newLang) => {
    if (['lo', 'th', 'en'].includes(newLang)) {
      setLangState(newLang);
      try { localStorage.setItem('org_chart_lang', newLang); } catch {}
    }
  }, []);

  // ฟังก์ชัน t(key) — แปลคีย์เป็นข้อความตามภาษาปัจจุบัน โดย fallback ไปที่ 'lo' และ 'th'
  const t = useCallback((key) => {
    return translations[lang]?.[key] ?? translations['lo']?.[key] ?? translations['th']?.[key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ── Hook: useTranslation() ───────────────────────────────────────
export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used inside <LanguageProvider>');
  return ctx;
}

export default LanguageContext;
