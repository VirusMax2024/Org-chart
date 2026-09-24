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

  const beamColor = data?.color || '#38bdf8';
  const glowColor = data?.glowColor || 'rgba(56, 189, 248, 0.85)';
  const animationDelay = data?.delay || '0s';
  const duration = data?.duration || '4.0s';

  return (
    <g className="animated-beam-group">
      {/* ── 1. Base Static Track (เส้นไกด์สีฟ้าบางเฉียบ คมชัด ไฮเทค) ── */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke="rgba(56, 189, 248, 0.20)"
        strokeWidth={2}
        className="beam-base-track"
      />

      {/* ── 2. Outer Neon Aura Glow (แสงเรืองฟุ้งสีฟ้ารอบตัวลำแสง) ── */}
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

      {/* ── 3. High-Intensity Core Laser (แกนลำแสงสีฟ้าคมชัดวิ่งตามเส้นทางจากบนลงล่าง) ── */}
      <path
        d={edgePath}
        fill="none"
        stroke={beamColor}
        strokeWidth={2.4}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray="18 82"
        className="beam-core-laser"
        style={{
          animationDuration: duration,
          animationDelay,
          filter: `drop-shadow(0 0 4px ${beamColor}) drop-shadow(0 0 9px ${glowColor})`,
        }}
      />

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
