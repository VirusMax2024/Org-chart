// components/LanguageSwitcher.jsx — สไตล์ Glassmorphism Dropdown ตามดีไซน์ที่ CEO MAC ชื่นชอบ
import React, { memo, useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';
import { useTranslation } from '../context/LanguageContext';

const LANGS = [
  { code: 'lo', flag: '🇱🇦', label: 'ລາວ', fullName: 'ພາສາລາວ (Lao)' },
  { code: 'th', flag: '🇹🇭', label: 'ไทย', fullName: 'ภาษาไทย (Thai)' },
  { code: 'en', flag: '🇬🇧', label: 'EN', fullName: 'English (US)' },
];

const LanguageSwitcher = memo(({ compact = false }) => {
  const { lang, setLang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = LANGS.find((item) => item.code === lang) || LANGS[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/15 border border-white/15 transition-all shadow-sm cursor-pointer select-none"
        title="ປ່ຽນພາສາ / เปลี่ยนภาษา / Switch Language"
      >
        <span className="text-base leading-none">{currentLang.flag}</span>
        <span className="font-bold tracking-wide">{currentLang.label}</span>
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-2xl shadow-2xl z-50 overflow-hidden border border-white/15 animate-fade-in"
          style={{
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
          }}
        >
          <div className="p-2 border-b border-white/10 flex items-center gap-1.5 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <Globe size={12} className="text-blue-400" />
            <span>ພາສາ / Language</span>
          </div>

          <div className="p-1.5 space-y-1">
            {LANGS.map((item) => {
              const isActive = lang === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setLang(item.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/35 text-white border border-blue-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{item.flag}</span>
                    <div className="text-left">
                      <div className="font-bold">{item.fullName}</div>
                    </div>
                  </div>
                  {isActive && <Check size={14} className="text-blue-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

LanguageSwitcher.displayName = 'LanguageSwitcher';
export default LanguageSwitcher;
