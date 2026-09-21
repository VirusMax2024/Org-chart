// components/LanguageSwitcher.jsx — ปุ่มเปลี่ยนภาษา TH / EN / LO
// แสดงเป็น 3 ปุ่มธง พร้อม active state และ smooth transition
import React, { memo } from 'react';
import { useTranslation } from '../context/LanguageContext';

const LANGS = [
  { code: 'th', flag: '🇹🇭', shortLabel: 'TH' },
  { code: 'en', flag: '🇬🇧', shortLabel: 'EN' },
  { code: 'lo', flag: '🇱🇦', shortLabel: 'LO' },
];

const LanguageSwitcher = memo(({ compact = false }) => {
  const { lang, setLang } = useTranslation();

  return (
    <div
      className="flex items-center gap-1 rounded-xl p-1"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      {LANGS.map(({ code, flag, shortLabel }) => {
        const isActive = lang === code;
        return (
          <button
            key={code}
            onClick={() => setLang(code)}
            title={code.toUpperCase()}
            className="flex items-center justify-center gap-1.5 w-[54px] py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer select-none"
            style={{
              background: isActive
                ? 'linear-gradient(135deg, rgba(59,130,246,0.6), rgba(37,99,235,0.6))'
                : 'transparent',
              color: isActive ? '#ffffff' : '#94a3b8',
              border: isActive ? '1px solid rgba(96,165,250,0.6)' : '1px solid transparent',
              boxShadow: isActive ? '0 2px 8px rgba(37,99,235,0.4)' : 'none',
            }}
          >
            <span className="text-sm leading-none">{flag}</span>
            {!compact && (
              <span className="tracking-wider font-semibold" style={{ fontSize: 11 }}>{shortLabel}</span>
            )}
          </button>
        );
      })}
    </div>
  );
});

LanguageSwitcher.displayName = 'LanguageSwitcher';
export default LanguageSwitcher;
