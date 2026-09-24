// components/AnimatedBeamEdge.jsx — Vercel / Next.js Style Animated Glowing Beams
// เส้นเชื่อมต่อลำแสงนีออนเรืองแสง วิ่งจากหัวหน้าลงมายังลูกน้องตามสายบังคับบัญชา
import React, { memo } from 'react';
import { getSmoothStepPath, Position } from 'reactflow';

// สี Gradient Preset แยกตามระดับหรือธีม
const GRADIENT_DEFINITIONS = {
  'beam-grad-rainbow': [
    { offset: '0%', color: '#ff0080' },
    { offset: '25%', color: '#ff8c00' },
    { offset: '50%', color: '#ffd700' },
    { offset: '75%', color: '#00bfff' },
    { offset: '100%', color: '#a855f7' },
  ],
  'beam-grad-diamond': [
    { offset: '0%', color: '#38bdf8' },
    { offset: '50%', color: '#e879f9' },
    { offset: '100%', color: '#38bdf8' },
  ],
  'beam-grad-gold': [
    { offset: '0%', color: '#fef08a' },
    { offset: '50%', color: '#fbbf24' },
    { offset: '100%', color: '#d97706' },
  ],
  'beam-grad-silver': [
    { offset: '0%', color: '#ffffff' },
    { offset: '50%', color: '#cbd5e1' },
    { offset: '100%', color: '#94a3b8' },
  ],
};

function AnimatedBeamEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Bottom,
  targetPosition = Position.Top,
  markerEnd,
  data,
}) {
  // คำนวณเส้นทางโค้งมน Smoothstep เชื่อมระหว่างบัตรพนักงาน
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    borderRadius: 18,
  });

  const isEnabled = data?.enabled !== false;
  const trackColor = data?.trackColor || 'rgba(56, 189, 248, 0.20)';
  const beamColor = data?.color || '#38bdf8';
  const glowColor = data?.glowColor || 'rgba(56, 189, 248, 0.85)';
  const animationDelay = data?.delay || '0s';
  const duration = data?.duration || '4.0s';
  const shadowFilter = data?.filter || `drop-shadow(0 0 4px ${beamColor}) drop-shadow(0 0 9px ${glowColor})`;

  // ตรวจสอบและดึงข้อมูล Gradient
  const gradientKey = data?.colorGradient;
  const stops = gradientKey ? GRADIENT_DEFINITIONS[gradientKey] : null;

  // รหัส Unique Gradient ID ประจำเส้น Edge นี้โดยเฉพาะ ป้องกัน ID ชนกันใน SVG DOM
  const cleanId = String(id || 'edge').replace(/[^a-zA-Z0-9-_]/g, '_');
  const uniqueGradId = stops ? `beam-grad-${cleanId}` : null;
  const strokeColor = uniqueGradId ? `url(#${uniqueGradId})` : beamColor;

  // คำนวณพิกัด userSpaceOnUse:
  // แก้ไขข้อผิดพลาดของ SVG มาตรฐาน W3C ที่เมื่อเส้นเป็นแนวตั้งตรง (sourceX === targetX)
  // bounding box width จะเป็น 0 ทำให้ linearGradient แบบ objectBoundingBox ไม่ถูกวาด (กลายเป็นเส้นโปร่งแสง)
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const isDirectVertical = Math.abs(dx) < 1;
  const isDirectHorizontal = Math.abs(dy) < 1;

  let gx1 = sourceX;
  let gy1 = sourceY;
  let gx2 = targetX;
  let gy2 = targetY;

  if (isDirectVertical) {
    gx1 = sourceX;
    gx2 = sourceX;
    gy1 = sourceY;
    gy2 = Math.abs(dy) < 1 ? sourceY + 20 : targetY;
  } else if (isDirectHorizontal) {
    gx1 = sourceX;
    gx2 = Math.abs(dx) < 1 ? sourceX + 20 : targetX;
    gy1 = sourceY;
    gy2 = sourceY;
  }

  return (
    <g className="animated-beam-group">
      <defs>
        {stops && uniqueGradId && (
          <linearGradient
            id={uniqueGradId}
            gradientUnits="userSpaceOnUse"
            x1={gx1}
            y1={gy1}
            x2={gx2}
            y2={gy2}
          >
            {stops.map((stop, index) => (
              <stop key={index} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        )}
      </defs>

      {/* ── 1. Base Static Track (เส้นทางหลัก คมชัด มินิมอล) ── */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={trackColor}
        strokeWidth={isEnabled ? 2 : 1.6}
        className="beam-base-track"
      />

      {/* ── 2. Outer Neon Aura Glow (แสดงเมื่อเปิดลำแสงเท่านั้น — ใช้ glowColor ป้องกันเรนเดอร์หลุด) ── */}
      {isEnabled && (
        <path
          d={edgePath}
          fill="none"
          stroke={glowColor}
          strokeWidth={5}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="22 78"
          className="beam-glow-path"
          style={{
            animationDuration: duration,
            animationDelay,
            filter: 'blur(3px)',
          }}
        />
      )}

      {/* ── 3. High-Intensity Core Laser (แสดงเมื่อเปิดลำแสงเท่านั้น — คมชัดทุกมุมมองแม้เป็นเส้นตรงแนวดิ่ง) ── */}
      {isEnabled && (
        <path
          d={edgePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2.4}
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="18 82"
          className="beam-core-laser"
          style={{
            animationDuration: duration,
            animationDelay,
            filter: shadowFilter,
          }}
        />
      )}

      {/* ── 4. Arrow Head Marker (หัวลูกศรเรืองแสงที่ปลายทาง) ── */}
      {markerEnd && (
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={0}
          markerEnd={markerEnd}
        />
      )}
    </g>
  );
}

export default memo(AnimatedBeamEdge);
