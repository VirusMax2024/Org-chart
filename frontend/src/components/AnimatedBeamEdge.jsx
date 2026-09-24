// components/AnimatedBeamEdge.jsx — Vercel / Next.js Style Animated Glowing Beams
// เส้นเชื่อมต่อลำแสงนีออนเรืองแสง วิ่งจากหัวหน้าลงมายังลูกน้องตามสายบังคับบัญชา
import React, { memo } from 'react';
import { getSmoothStepPath, Position } from 'reactflow';

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
  const strokeColor = data?.colorGradient ? `url(#${data.colorGradient})` : beamColor;
  const shadowFilter = data?.filter || `drop-shadow(0 0 4px ${beamColor}) drop-shadow(0 0 9px ${glowColor})`;

  return (
    <g className="animated-beam-group">
      <defs>
        {/* ลำแสงสีรุ้ง Prismatic Rainbow สำหรับระดับ G1 / Legend */}
        <linearGradient id="beam-grad-rainbow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff0080" />
          <stop offset="25%" stopColor="#ff8c00" />
          <stop offset="50%" stopColor="#ffd700" />
          <stop offset="75%" stopColor="#00bfff" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        {/* ลำแสงสีเพชร Sparkling Diamond สำหรับระดับ G2 */}
        <linearGradient id="beam-grad-diamond" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#e879f9" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        {/* ลำแสงสีทองคำแท้ 24K สำหรับระดับ G3 */}
        <linearGradient id="beam-grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        {/* ลำแสงสีเงินพรีเมียม สำหรับระดับ G4 */}
        <linearGradient id="beam-grad-silver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
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

      {/* ── 2. Outer Neon Aura Glow (แสดงเมื่อเปิดลำแสงเท่านั้น) ── */}
      {isEnabled && (
        <path
          d={edgePath}
          fill="none"
          stroke={data?.colorGradient ? strokeColor : glowColor}
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

      {/* ── 3. High-Intensity Core Laser (แสดงเมื่อเปิดลำแสงเท่านั้น) ── */}
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
