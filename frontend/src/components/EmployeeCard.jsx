// components/EmployeeCard.jsx
// Horizontal Card Layout — Dark Charcoal Theme + Hexagonal Grid Pattern + Dynamic Border & Glow by Level
// อัปเดต: Legend (G1) Prismatic + Rank Badge ทุกระดับ + G1-G5 Mapping
import React, { memo } from 'react';
import { Phone, Mail } from 'lucide-react';

// ─── 1. นิยามระดับตำแหน่ง (Level Constants) ───────────────
export const LEVEL_TYPES = {
  LEGEND:   'legend',   // G1 — ระดับสูงสุด / CEO / Chairman — Prismatic Rainbow (เหนือ Diamond)
  DIAMOND:  'diamond',  // G2 — ผู้บริหาร / C-Suite — Sparkling Diamond
  GOLD:     'gold',     // G3 — หัวหน้า/Manager — Metallic Gold
  SILVER:   'silver',   // G4 — Senior Staff — Polished Silver
  STANDARD: 'standard', // G5 — General Staff — Clean Standard
};

// ─── 2. ตรวจสอบระดับตำแหน่งอัตโนมัติ (Auto-Detection) ───────────
export function resolveLevel({ level, role, rank, position = '', isRoot = false }) {
  // ── Priority 1: rank G1–G5 จากฐานข้อมูล — ค่าสำคัญที่สุด ──
  const g = String(rank || '').trim().toUpperCase();
  if (g === 'G1') return LEVEL_TYPES.LEGEND;   // G1 = Legend Prismatic
  if (g === 'G2') return LEVEL_TYPES.DIAMOND;  // G2 = Diamond
  if (g === 'G3') return LEVEL_TYPES.GOLD;     // G3 = Gold
  if (g === 'G4') return LEVEL_TYPES.SILVER;   // G4 = Silver
  if (g === 'G5') return LEVEL_TYPES.STANDARD; // G5 = Standard

  // ── Priority 2: explicit level/role keyword ──
  const explicit = String(level || role || '').trim().toLowerCase();
  if (['legend'].includes(explicit)) return LEVEL_TYPES.LEGEND;
  if (['diamond', 'ceo', 'chairman', 'president', 'founder', 'ประธาน'].includes(explicit)) return LEVEL_TYPES.DIAMOND;
  if (['gold', 'c_suite', 'c-suite', 'executive', 'director', 'cto', 'cfo', 'cmo', 'coo', 'vp', 'ผู้บริหาร'].includes(explicit)) return LEVEL_TYPES.GOLD;
  if (['silver', 'head', 'manager', 'lead', 'supervisor', 'หัวหน้า', 'ผู้จัดการ'].includes(explicit)) return LEVEL_TYPES.SILVER;
  if (['standard', 'employee', 'staff', 'ทั่วไป'].includes(explicit)) return LEVEL_TYPES.STANDARD;

  // ── Priority 3: Auto-detect จาก isRoot หรือ Keyword ใน position ──
  if (isRoot) return LEVEL_TYPES.LEGEND;
  const p = position.toLowerCase();
  if (/\b(ceo|chairman|founder|president|ประธาน)\b/i.test(p)) return LEVEL_TYPES.LEGEND;
  if (/\b(cto|cfo|cmo|coo|cio|director|vp|vice president|executive|ผู้บริหาร)\b/i.test(p)) return LEVEL_TYPES.GOLD;
  if (/\b(head|manager|lead|supervisor|หัวหน้า|ผู้จัดการ)\b/i.test(p)) return LEVEL_TYPES.SILVER;

  return LEVEL_TYPES.STANDARD;
}

// ─── 3. ดีไซน์โทนสีและขอบเงาตามระดับตำแหน่ง (Level Theme Tokens) ────
const LEVEL_STYLES = {
  // ─── G1: LEGEND — Prismatic Rainbow / Holographic (สูงกว่า Diamond) ────────────
  [LEVEL_TYPES.LEGEND]: {
    label: 'Legend — Top Level',
    tag: '🌟 Rank G1',
    cardBorder: 'linear-gradient(#181b24, #181b24) padding-box, linear-gradient(135deg, #ff0080 0%, #ff8c00 15%, #ffd700 30%, #00ff88 45%, #00bfff 60%, #a855f7 75%, #ff0080 90%, #ff8c00 100%) border-box',
    cardGlow: '0 0 28px rgba(255, 0, 128, 0.5), 0 0 50px rgba(0, 191, 255, 0.3), 0 0 70px rgba(168, 85, 247, 0.2), 0 10px 40px rgba(0, 0, 0, 0.75)',
    avatarBorder: 'linear-gradient(#181b24, #181b24) padding-box, linear-gradient(135deg, #ff0080, #ff8c00, #ffd700, #00ff88, #00bfff, #a855f7, #ff0080) border-box',
    avatarGlow: '0 0 22px rgba(255, 0, 128, 0.9), 0 0 38px rgba(0, 191, 255, 0.6), 0 0 55px rgba(168, 85, 247, 0.4)',
    avatarInitialBg: 'linear-gradient(135deg, #ff0080, #ff8c00, #ffd700, #00bfff)',
    badgeBg: 'linear-gradient(135deg, rgba(255,0,128,0.3), rgba(0,191,255,0.3), rgba(168,85,247,0.3))',
    badgeColor: '#ffffff',
    badgeBorder: 'rgba(255, 0, 128, 0.7)',
    badgeShadow: '0 0 14px rgba(255,0,128,0.6), 0 0 22px rgba(0,191,255,0.4)',
    animate: true,
  },
  // ─── G2: DIAMOND ────────────────────────────────────────
  [LEVEL_TYPES.DIAMOND]: {
    label: 'Executive & C-Suite',
    tag: '💎 Rank G2',
    cardBorder: 'linear-gradient(#181b24, #181b24) padding-box, linear-gradient(135deg, #e0f2fe 0%, #38bdf8 25%, #e879f9 50%, #f472b6 75%, #38bdf8 100%) border-box',
    cardGlow: '0 0 22px rgba(56, 189, 248, 0.45), 0 0 38px rgba(232, 121, 249, 0.28), 0 10px 30px rgba(0, 0, 0, 0.7)',
    avatarBorder: 'linear-gradient(#181b24, #181b24) padding-box, linear-gradient(135deg, #e0f2fe, #38bdf8, #e879f9, #f472b6) border-box',
    avatarGlow: '0 0 18px rgba(56, 189, 248, 0.8), 0 0 28px rgba(232, 121, 249, 0.5)',
    avatarInitialBg: 'linear-gradient(135deg, #0284c7, #9333ea)',
    badgeBg: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25), rgba(232, 121, 249, 0.25))',
    badgeColor: '#7dd3fc',
    badgeBorder: 'rgba(56, 189, 248, 0.5)',
    badgeShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
    animate: false,
  },
  // ─── G3: GOLD ──────────────────────────────────────────
  [LEVEL_TYPES.GOLD]: {
    label: 'Manager & Head',
    tag: '☀️ Rank G3',
    cardBorder: 'linear-gradient(#181b24, #181b24) padding-box, linear-gradient(135deg, #d97706 0%, #fef08a 35%, #b45309 60%, #fbbf24 85%, #f59e0b 100%) border-box',
    cardGlow: '0 0 20px rgba(245, 158, 11, 0.45), 0 0 34px rgba(217, 119, 6, 0.25), 0 10px 30px rgba(0, 0, 0, 0.7)',
    avatarBorder: 'linear-gradient(#181b24, #181b24) padding-box, linear-gradient(135deg, #f59e0b, #fef08a, #d97706, #fbbf24) border-box',
    avatarGlow: '0 0 16px rgba(245, 158, 11, 0.75), 0 0 24px rgba(217, 119, 6, 0.4)',
    avatarInitialBg: 'linear-gradient(135deg, #b45309, #f59e0b)',
    badgeBg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.25))',
    badgeColor: '#fde047',
    badgeBorder: 'rgba(245, 158, 11, 0.5)',
    badgeShadow: '0 0 10px rgba(245, 158, 11, 0.35)',
    animate: false,
  },
  // ─── G4: SILVER ────────────────────────────────────────
  [LEVEL_TYPES.SILVER]: {
    label: 'Senior Staff',
    tag: '❄️ Rank G4',
    cardBorder: 'linear-gradient(#181b24, #181b24) padding-box, linear-gradient(135deg, #64748b 0%, #ffffff 30%, #94a3b8 60%, #cbd5e1 85%, #e2e8f0 100%) border-box',
    cardGlow: '0 0 18px rgba(226, 232, 240, 0.4), 0 0 30px rgba(148, 163, 184, 0.2), 0 10px 30px rgba(0, 0, 0, 0.7)',
    avatarBorder: 'linear-gradient(#181b24, #181b24) padding-box, linear-gradient(135deg, #94a3b8, #ffffff, #64748b, #cbd5e1) border-box',
    avatarGlow: '0 0 14px rgba(226, 232, 240, 0.6), 0 0 22px rgba(148, 163, 184, 0.3)',
    avatarInitialBg: 'linear-gradient(135deg, #475569, #94a3b8)',
    badgeBg: 'linear-gradient(135deg, rgba(226, 232, 240, 0.2), rgba(148, 163, 184, 0.2))',
    badgeColor: '#e2e8f0',
    badgeBorder: 'rgba(226, 232, 240, 0.4)',
    badgeShadow: '0 0 8px rgba(226, 232, 240, 0.25)',
    animate: false,
  },
  // ─── G5: STANDARD ─────────────────────────────────────
  [LEVEL_TYPES.STANDARD]: {
    label: 'General Staff',
    tag: '🔥 Rank G5',
    cardBorder: 'linear-gradient(#181b24, #181b24) padding-box, linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08)) border-box',
    cardGlow: '0 8px 26px rgba(0, 0, 0, 0.55)',
    avatarBorder: '3px solid rgba(255, 255, 255, 0.9)',
    avatarGlow: '0 0 12px rgba(255, 255, 255, 0.3)',
    avatarInitialBg: 'linear-gradient(135deg, #1e293b, #334155)',
    badgeBg: 'linear-gradient(135deg, rgba(249, 115, 22, 0.18), rgba(239, 68, 68, 0.18))',
    badgeColor: '#fb923c',
    badgeBorder: 'rgba(249, 115, 22, 0.4)',
    badgeShadow: '0 0 8px rgba(249, 115, 22, 0.25)',
  },
};

// ─── 4. ลวดลาย Hexagonal Grid เวกเตอร์ (SVG Corners) ─────────
const LeftHexagons = () => (
  <svg
    className="absolute left-0 top-0 bottom-0 h-full w-32 pointer-events-none opacity-15"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon points="12,24 22,18 32,24 32,36 22,42 12,36" stroke="white" strokeWidth="1.2" />
    <polygon points="2,48 12,42 22,48 22,60 12,66 2,60" stroke="white" strokeWidth="1.2" />
    <polygon points="22,54 32,48 42,54 42,66 32,72 22,66" stroke="white" strokeWidth="1.2" />
    <polygon points="12,78 22,72 32,78 32,90 22,96 12,90" stroke="white" strokeWidth="1.2" />
    <polygon points="32,84 42,78 52,84 52,96 42,102 32,96" stroke="white" strokeWidth="1" opacity="0.6" />
  </svg>
);

const RightHexagons = () => (
  <svg
    className="absolute right-0 top-0 bottom-0 h-full w-32 pointer-events-none opacity-15"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon points="68,14 78,8 88,14 88,26 78,32 68,26" stroke="white" strokeWidth="1.2" />
    <polygon points="78,34 88,28 98,34 98,46 88,52 78,46" stroke="white" strokeWidth="1.2" />
    <polygon points="58,40 68,34 78,40 78,52 68,58 58,52" stroke="white" strokeWidth="1.2" />
    <polygon points="72,58 82,52 92,58 92,70 82,76 72,70" stroke="white" strokeWidth="1.2" />
    <polygon points="84,76 93,71 102,76 102,86 93,91 84,86" stroke="white" strokeWidth="1" opacity="0.5" />
  </svg>
);

// ─── 5. ข้อมูลติดต่อพร้อมไอคอนวงกลมสีขาว (Compact Single-Row Item) ───
const ContactItem = ({ icon: Icon, text, customIcon }) => {
  if (!text) return null;

  return (
    <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
      {/* ไอคอนทรงกลมสีขาว ขนาดกะทัดรัด */}
      <div
        className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm"
        style={{ color: '#181b24' }}
      >
        {customIcon ? (
          <span className="text-[9px] font-black leading-none select-none">{customIcon}</span>
        ) : (
          <Icon size={8} strokeWidth={2.8} />
        )}
      </div>
      {/* ข้อความขนาดกะทัดรัด ไม่ขึ้นบรรทัดใหม่ */}
      <span className="text-[10px] font-medium text-slate-300 truncate max-w-[108px] select-none tracking-tight whitespace-nowrap">
        {text}
      </span>
    </div>
  );
};

// ─── 6. Main EmployeeCard Component ───────────────────────────
const EmployeeCard = memo((props) => {
  const data = props.data || {};
  const name       = props.name       || data.name       || data.full_name  || '—';
  const position   = props.position   || data.position   || 'Position';
  const phone      = props.phone      || data.phone      || '';
  const email      = props.email      || data.email      || '';
  const social     = props.social     || data.social     || '';
  const avatarUrl  = props.avatarUrl  || props.avatar_url || data.avatar_url || data.avatarUrl || '';
  const isRoot     = Boolean(props.isRoot ?? data.isRoot);
  const variant    = props.variant    || 'node';
  const isBanner   = variant === 'banner' || variant === 'list';

  // ตรวจสอบระดับตำแหน่งพนักงาน (รองรับ rank G1-G5 จาก DB)
  const currentLevel = resolveLevel({
    level: props.level || data.level,
    role:  props.role  || data.role,
    rank:  props.rank  || data.rank,
    position,
    isRoot,
  });

  const levelStyle = LEVEL_STYLES[currentLevel];

  // ขนาดภาพโปรไฟล์สี่เหลี่ยมมุมมนใหญ่ขึ้นเป็น 88px (Banner 96px)
  const avatarSize = isBanner ? 96 : 88;
  const cardWidth  = isBanner ? '100%' : '420px';
  const cardHeight = isBanner ? 'auto' : '118px';

  return (
    <div
      className={`employee-card relative flex items-center select-none ${props.className || ''}`}
      style={{
        width: cardWidth,
        minWidth: isBanner ? '380px' : '420px',
        maxWidth: isBanner ? '660px' : '420px',
        height: cardHeight,
        // เปิด overflow: visible เพื่อให้รูปโปรไฟล์ทรงเหลี่ยมยื่นล้นออกนอกขอบซ้ายได้
        overflow: 'visible',
        transition: 'all 0.25s ease',
        ...props.style,
      }}
    >
      {/* ─── กล่องการ์ดพื้นหลัง (Inner Container ตัดขอบมนพร้อมขอบ Gradient) ─── */}
      <div
        className="absolute inset-0 rounded-[26px] overflow-hidden"
        style={{
          backgroundColor: '#181b24',
          border: '2px solid transparent',
          background: levelStyle.cardBorder,
          boxShadow: levelStyle.cardGlow,
        }}
      >
        <LeftHexagons />
        <RightHexagons />
      </div>

      {/* ─── Role Badge ชิดมุมขวาบน (แสดงทุกระดับ — ALL LEVELS) ─── */}
      <div
        className="absolute top-2.5 right-3.5 z-20 flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase select-none"
        style={{
          background: levelStyle.badgeBg,
          color: levelStyle.badgeColor,
          border: `1px solid ${levelStyle.badgeBorder}`,
          boxShadow: levelStyle.badgeShadow,
          backdropFilter: 'blur(8px)',
          // LEGEND level: animate gradient
          ...(currentLevel === LEVEL_TYPES.LEGEND ? {
            background: 'linear-gradient(135deg, rgba(255,0,128,0.35), rgba(0,191,255,0.35), rgba(168,85,247,0.35))',
            animation: 'legendBadgePulse 2.5s ease-in-out infinite',
          } : {}),
        }}
      >
        <span>{levelStyle.tag}</span>
      </div>

      {/* ─── ฝั่งซ้าย: รูปโปรไฟล์ทรงสี่เหลี่ยมมุมมนขนาดใหญ่ (ยื่นล้นออกนอกขอบซ้าย) ─── */}
      <div
        className="relative z-20 flex-shrink-0 flex items-center justify-center"
        style={{
          marginLeft: '-12px', // ดันทรงสี่เหลี่ยมมุมมนยื่นล้นออกนอกการ์ดด้านซ้ายอย่างโดดเด่น
          width: avatarSize,
          height: avatarSize,
        }}
      >
        <div
          className="w-full h-full rounded-2xl overflow-hidden flex items-center justify-center transition-all duration-300 shadow-xl"
          style={{
            borderRadius: '20px',
            border: levelStyle.avatarBorder.includes('border-box') ? '3.5px solid transparent' : levelStyle.avatarBorder,
            background: levelStyle.avatarBorder.includes('border-box') ? levelStyle.avatarBorder : undefined,
            boxShadow: levelStyle.avatarGlow,
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full object-cover"
              style={{ borderRadius: '16px' }}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}

          {/* Fallback ตัวอักษรย่อตัวใหญ่ในกรอบสี่เหลี่ยมมุมมน */}
          <div
            className="w-full h-full items-center justify-center font-black text-white text-2xl tracking-tight select-none"
            style={{
              display: avatarUrl ? 'none' : 'flex',
              background: levelStyle.avatarInitialBg,
              borderRadius: '16px',
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* ─── ฝั่งขวา: ข้อมูลพนักงาน (จัดระยะห่าง Spacing โปร่งสบาย) ─── */}
      <div className="relative z-10 flex-1 min-w-0 pl-3.5 pr-4 py-2 flex flex-col justify-center gap-1.5">
        {/* บรรทัดบน: ชื่อพนักงาน (สีขาว ตัวหนาเด่น ไม่ชิดขอบบน) */}
        <div className="flex items-center pr-16">
          <h3 className="text-white font-black text-[17px] leading-tight truncate tracking-tight">
            {name}
          </h3>
        </div>

        {/* บรรทัดกลาง: ตำแหน่ง (Badge สีขาว อักษรเข้ม) */}
        <div className="flex items-center">
          <span className="bg-white text-slate-900 text-[11px] font-bold px-3 py-0.5 rounded-full shadow-sm select-none tracking-tight">
            {position}
          </span>
        </div>

        {/* บรรทัดล่าง: ข้อมูลติดต่อแบบแถวเดียวจบ (Single Row Flexbox) ─── */}
        {(phone || social || email) && (
          <div className="flex items-center gap-2 mt-0.5 flex-nowrap w-full overflow-hidden">
            {phone  && <ContactItem icon={Phone} text={phone} />}
            {social && <ContactItem customIcon="@" text={social} />}
            {email  && <ContactItem icon={Mail}  text={email} />}
          </div>
        )}
      </div>
    </div>
  );
});

EmployeeCard.displayName = 'EmployeeCard';
export default EmployeeCard;
