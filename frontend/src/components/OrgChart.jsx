import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Download, Plus, Minus, Maximize2, Users, Building2, Crown, Monitor, Sparkles, X, Check } from 'lucide-react';
import EmployeeCard from './EmployeeCard';
import ExportModal from './ExportModal';
import EmployeeDetailModal from './EmployeeDetailModal';
import AnimatedBeamEdge from './AnimatedBeamEdge';
import { useTranslation } from '../context/LanguageContext';

// ─── Custom Node Component พร้อม React Flow Handles (Memoized for max performance) ───
const EmployeeCardNode = React.memo(function EmployeeCardNode({ data }) {
  const isRoot = Boolean(data?.isRoot);
  const handleColor = data?.handleColor || '#38bdf8';
  const handleGlow = data?.handleGlow || 'rgba(56, 189, 248, 0.85)';

  return (
    <div
      onClick={(e) => {
        if (!data?.isEditor && data?.onSelect) {
          e.stopPropagation();
          data.onSelect(data);
        }
      }}
      style={{ position: 'relative', cursor: data?.isEditor ? 'grab' : 'pointer' }}
    >
      {/* Connector Target (ด้านบน) — รับเส้นเชื่อมจากหัวหน้า */}
      {!isRoot && (
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: handleColor,
            width: 10,
            height: 10,
            border: '2px solid #0f172a',
            top: -5,
            boxShadow: `0 0 6px ${handleGlow}`,
            transition: 'background 0.25s ease, box-shadow 0.25s ease',
          }}
        />
      )}

      {/* บัตรพนักงาน */}
      <EmployeeCard data={data} variant="node" />

      {/* Connector Source (ด้านล่าง) — ส่งเส้นเชื่อมต่อไปยังลูกน้อง */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: handleColor,
          width: 10,
          height: 10,
          border: '2px solid #0f172a',
          bottom: -5,
          boxShadow: `0 0 6px ${handleGlow}`,
          transition: 'background 0.25s ease, box-shadow 0.25s ease',
        }}
      />
    </div>
  );
});

const nodeTypes = {
  employeeCard: EmployeeCardNode,
};

const edgeTypes = {
  animatedBeam: AnimatedBeamEdge,
};

// ─── คำนวณสีและการเปิด/ปิดของ Animated Beam ตามการตั้งค่าของผู้ใช้ ───
function getBeamConfig(rank, depth = 0, totalDuration = 4.0, colorMode = 'cyan', enabled = true) {
  const r = String(rank || '').toUpperCase();
  const delay = `${(depth * 0.80).toFixed(2)}s`;
  const duration = `${totalDuration.toFixed(2)}s`;

  // กรณีปิดเส้นแสง (Static Lines)
  if (!enabled) {
    return {
      enabled: false,
      color: 'transparent',
      glowColor: 'transparent',
      trackColor: 'rgba(148, 163, 184, 0.28)',
      duration,
      delay,
    };
  }

  // 1. สีขาว (Pure White / Ice Silver)
  if (colorMode === 'white') {
    return {
      enabled: true,
      color: '#ffffff',
      glowColor: 'rgba(255, 255, 255, 0.90)',
      trackColor: 'rgba(255, 255, 255, 0.22)',
      duration,
      delay,
    };
  }

  // 2. สีทอง (Luxury Gold 24K — สไตล์ EASY GOLD)
  if (colorMode === 'gold') {
    return {
      enabled: true,
      color: '#fbbf24',
      glowColor: 'rgba(251, 191, 36, 0.90)',
      trackColor: 'rgba(245, 158, 11, 0.22)',
      duration,
      delay,
    };
  }

  // 3. หลากสีสัน Colorful (ตามลำดับขั้น Rank เหมือนเวอร์ชันแรก)
  if (colorMode === 'colorful') {
    if (r === 'G1') {
      return {
        enabled: true,
        color: '#fef08a',
        glowColor: 'rgba(251, 191, 36, 0.95)',
        trackColor: 'rgba(251, 191, 36, 0.25)',
        duration,
        delay,
      };
    }
    if (r === 'G2') {
      return {
        enabled: true,
        color: '#38bdf8',
        glowColor: 'rgba(56, 189, 248, 0.90)',
        trackColor: 'rgba(56, 189, 248, 0.22)',
        duration,
        delay,
      };
    }
    if (r === 'G3') {
      return {
        enabled: true,
        color: '#c084fc',
        glowColor: 'rgba(192, 132, 252, 0.90)',
        trackColor: 'rgba(192, 132, 252, 0.22)',
        duration,
        delay,
      };
    }
    return {
      enabled: true,
      color: '#34d399',
      glowColor: 'rgba(52, 211, 153, 0.90)',
      trackColor: 'rgba(52, 211, 153, 0.22)',
      duration,
      delay,
    };
  }

  // 4. สีฟ้า (Cyan Sky Blue — ค่าเริ่มต้น)
  return {
    enabled: true,
    color: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.90)',
    trackColor: 'rgba(56, 189, 248, 0.20)',
    duration,
    delay,
  };
}

// ─── Layout Constants ─────────────────────────────────────────
const CARD_WIDTH  = 420;  // ความกว้าง EmployeeCard (node variant)
const CARD_HEIGHT = 118;  // ความสูง EmployeeCard (node variant)
const H_GAP       = 64;   // ระยะห่างแนวนอนระหว่างการ์ด
const V_GAP       = 130;  // ระยะห่างแนวตั้งระหว่างระดับชั้น
const V_STACK_GAP = 40;   // ระยะห่างแนวตั้งระหว่างการ์ดในโหมด Vertical (Single Column)

// ─── Tree Layout Algorithm ────────────────────────────────────
function computeLayout(employees, isEditor = false, onSelect = null, beamSettings = { enabled: true, colorMode: 'cyan' }) {
  if (!employees || employees.length === 0) {
    return { nodes: [], edges: [] };
  }

  const map = new Map();
  employees.forEach((emp) => {
    map.set(emp.id, { ...emp, children: [] });
  });

  const roots = [];
  employees.forEach((emp) => {
    const parentId = emp.parent_id;
    if (parentId && map.has(parentId) && parentId !== emp.id) {
      map.get(parentId).children.push(map.get(emp.id));
    } else {
      roots.push(map.get(emp.id));
    }
  });

  if (roots.length === 0 && employees.length > 0) {
    roots.push(map.get(employees[0].id));
  }

  const isVerticalLayout = (n) => {
    if (!n) return false;
    if (n.layout_type === 'vertical') return true;
    if (n.children && n.children.length > 0) {
      return n.children.some((c) => c.layout_type === 'vertical');
    }
    return false;
  };

  // คำนวณความกว้างรวมของ Subtree
  const subtreeWidthCache = new Map();
  function getSubtreeWidth(node, visited = new Set()) {
    if (visited.has(node.id)) return CARD_WIDTH;
    if (subtreeWidthCache.has(node.id)) return subtreeWidthCache.get(node.id);

    visited.add(node.id);
    if (!node.children || node.children.length === 0) {
      subtreeWidthCache.set(node.id, CARD_WIDTH);
      return CARD_WIDTH;
    }

    const isVertical = isVerticalLayout(node);

    if (isVertical) {
      // โหมด Vertical: ลูกน้องเรียงต่อลงมาเป็นคอลัมน์เดียว ความกว้างคือ max(CARD_WIDTH, ความกว้างสูงสุดของลูก)
      let maxChildWidth = CARD_WIDTH;
      node.children.forEach((child) => {
        const w = getSubtreeWidth(child, new Set(visited));
        if (w > maxChildWidth) maxChildWidth = w;
      });
      const totalWidth = Math.max(CARD_WIDTH, maxChildWidth);
      subtreeWidthCache.set(node.id, totalWidth);
      return totalWidth;
    } else {
      // โหมด Horizontal: ลูกน้องกระจายออกแนวนอน ความกว้างคือผลรวมของลูกน้องทั้งหมด + ช่องว่าง
      const childrenWidth = node.children.reduce((sum, child) => {
        return sum + getSubtreeWidth(child, new Set(visited)) + H_GAP;
      }, 0) - H_GAP;

      const totalWidth = Math.max(CARD_WIDTH, childrenWidth);
      subtreeWidthCache.set(node.id, totalWidth);
      return totalWidth;
    }
  }

  // คำนวณความสูงรวมของ Subtree (สำหรับโหมด Vertical เพื่อไม่ให้ node ถัดไปทับซ้อน)
  const subtreeHeightCache = new Map();
  function getSubtreeHeight(node, visited = new Set()) {
    if (visited.has(node.id)) return CARD_HEIGHT;
    if (subtreeHeightCache.has(node.id)) return subtreeHeightCache.get(node.id);

    visited.add(node.id);
    if (!node.children || node.children.length === 0) {
      subtreeHeightCache.set(node.id, CARD_HEIGHT);
      return CARD_HEIGHT;
    }

    const isVertical = isVerticalLayout(node);

    if (isVertical) {
      // โหมด Vertical: ผลรวมความสูงของลูกน้องทั้งหมด + gap แนวตั้ง
      const childrenTotalHeight = node.children.reduce((sum, child) => {
        return sum + getSubtreeHeight(child, new Set(visited)) + V_STACK_GAP;
      }, 0) - V_STACK_GAP;

      const totalHeight = CARD_HEIGHT + V_GAP + childrenTotalHeight;
      subtreeHeightCache.set(node.id, totalHeight);
      return totalHeight;
    } else {
      // โหมด Horizontal: ความสูงคือ CARD_HEIGHT + V_GAP + ความสูงของลูกที่สูงที่สุด
      let maxChildHeight = CARD_HEIGHT;
      node.children.forEach((child) => {
        const h = getSubtreeHeight(child, new Set(visited));
        if (h > maxChildHeight) maxChildHeight = h;
      });

      const totalHeight = CARD_HEIGHT + V_GAP + maxChildHeight;
      subtreeHeightCache.set(node.id, totalHeight);
      return totalHeight;
    }
  }

  const resultNodes = [];
  const resultEdges = [];
  const assignedSet = new Set();
  let maxTreeDepth = 0;

  // คำนวณความลึกสูงสุดของสายงาน (Tree Depth) เพื่อกะจังหวะรอบ Waterfall Pulse ให้สมบูรณ์แบบ
  function findMaxDepth(node, currentDepth = 0, seen = new Set()) {
    if (!node || seen.has(node.id)) return currentDepth;
    seen.add(node.id);
    let maxD = currentDepth;
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        const d = findMaxDepth(child, currentDepth + 1, seen);
        if (d > maxD) maxD = d;
      });
    }
    return maxD;
  }

  roots.forEach((root) => {
    const d = findMaxDepth(root, 0, new Set());
    if (d > maxTreeDepth) maxTreeDepth = d;
  });

  const totalCycleDuration = Math.max(3.6, (maxTreeDepth + 1) * 0.85);

  function assignPositions(node, x, y, isRoot = false, visited = new Set(), depth = 0) {
    if (visited.has(node.id) || assignedSet.has(node.id)) return;
    visited.add(node.id);
    assignedSet.add(node.id);

    const subtreeWidth = getSubtreeWidth(node);
    
    // ถ้ามีการบันทึกพิกัด X, Y ไว้ในฐานข้อมูล ให้ใช้พิกัดที่บันทึก
    const hasCustomPos = node.position_x !== null && node.position_x !== undefined && node.position_y !== null && node.position_y !== undefined;
    const nodeX = hasCustomPos ? parseFloat(node.position_x) : x + (subtreeWidth - CARD_WIDTH) / 2;
    const nodeY = hasCustomPos ? parseFloat(node.position_y) : y;

    // คำนวณสี Handle ตามการเปิดปิดและโหมดสี
    let handleColor = '#38bdf8';
    let handleGlow = 'rgba(56, 189, 248, 0.85)';
    if (!beamSettings.enabled) {
      handleColor = '#64748b';
      handleGlow = 'rgba(100, 116, 139, 0.3)';
    } else if (beamSettings.colorMode === 'white') {
      handleColor = '#ffffff';
      handleGlow = 'rgba(255, 255, 255, 0.85)';
    } else if (beamSettings.colorMode === 'gold') {
      handleColor = '#fbbf24';
      handleGlow = 'rgba(251, 191, 36, 0.85)';
    } else if (beamSettings.colorMode === 'colorful') {
      const rankConfig = getBeamConfig(node.rank, 0, 4.0, 'colorful', true);
      handleColor = rankConfig.color;
      handleGlow = rankConfig.glowColor;
    }

    resultNodes.push({
      id: String(node.id),
      type: 'employeeCard',
      position: { x: nodeX, y: nodeY },
      data: { ...node, isRoot, isEditor, onSelect, handleColor, handleGlow },
      draggable: isEditor, // ลากได้เฉพาะในโหมด Admin Editor
    });

    if (node.children && node.children.length > 0) {
      const isVertical = isVerticalLayout(node);

      if (isVertical) {
        // ── โหมด Vertical: จัดลูกน้องเรียงต่อลงมาเป็นเส้นตรงแนวตั้ง 1 แถว (Single Column) ──
        let currentChildY = nodeY + CARD_HEIGHT + V_GAP;

        node.children.forEach((child) => {
          const childSubtreeWidth = getSubtreeWidth(child);
          // จัดกึ่งกลางลูกน้องให้อยู่ตรงแนวเดียวกับหัวหน้า
          const childX = x + (subtreeWidth - childSubtreeWidth) / 2;

          const beam = getBeamConfig(node.rank, depth, totalCycleDuration, beamSettings.colorMode, beamSettings.enabled);
          resultEdges.push({
            id: `e-${node.id}-${child.id}`,
            source: String(node.id),
            target: String(child.id),
            type: 'animatedBeam',
            data: {
              enabled: beam.enabled,
              color: beam.color,
              glowColor: beam.glowColor,
              trackColor: beam.trackColor,
              duration: beam.duration,
              delay: beam.delay,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: beam.enabled ? beam.color : (beam.trackColor || '#64748b'),
              width: 12,
              height: 12,
            },
          });

          assignPositions(child, childX, currentChildY, false, new Set(visited), depth + 1);

          // คำนวณระยะ Y ของลูกคนถัดไปตามความสูง subtree ของลูกคนนี้
          const childHeight = getSubtreeHeight(child);
          currentChildY += childHeight + V_STACK_GAP;
        });
      } else {
        // ── โหมด Horizontal: กระจายลูกน้องออกเป็นเส้นแยกแนวนอนขนานกัน (Multi Branch) ──
        let childX = x;
        const childY = nodeY + CARD_HEIGHT + V_GAP;

        node.children.forEach((child) => {
          const beam = getBeamConfig(node.rank, depth, totalCycleDuration, beamSettings.colorMode, beamSettings.enabled);
          resultEdges.push({
            id: `e-${node.id}-${child.id}`,
            source: String(node.id),
            target: String(child.id),
            type: 'animatedBeam',
            data: {
              enabled: beam.enabled,
              color: beam.color,
              glowColor: beam.glowColor,
              trackColor: beam.trackColor,
              duration: beam.duration,
              delay: beam.delay,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: beam.enabled ? beam.color : (beam.trackColor || '#64748b'),
              width: 12,
              height: 12,
            },
          });

          const childWidth = getSubtreeWidth(child);
          assignPositions(child, childX, childY, false, new Set(visited), depth + 1);
          childX += childWidth + H_GAP;
        });
      }
    }
  }

  let currentX = 0;
  roots.forEach((root) => {
    const rootWidth = getSubtreeWidth(root);
    assignPositions(root, currentX, 0, true, new Set(), 0);
    currentX += rootWidth + H_GAP * 2;
  });

  return { nodes: resultNodes, edges: resultEdges };
}

// ─── Main OrgChart Component ──────────────────────────────────
export default function OrgChart({
  employees = [],
  allEmployees,
  departments = [],
  loading = false,
  isEditor = false,
  onNodesUpdate, // Callback ส่งกลับ nodes เมื่อขยับใน Editor
  instanceRef,   // Ref สำหรับควบคุม reactFlowInstance จากภายนอก
  companyName = 'BORCELLE',
}) {
  const { t } = useTranslation();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const reactFlowRef = useRef(null);
  const flowWrapperRef = useRef(null);

  // จัดการการเปิด-ปิด และการเลือกสีเส้นแสง (จำค่าใน localStorage)
  const [beamEnabled, setBeamEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('org_chart_beam_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [beamColorMode, setBeamColorMode] = useState(() => {
    try {
      const saved = localStorage.getItem('org_chart_beam_color');
      return ['cyan', 'white', 'gold', 'colorful'].includes(saved) ? saved : 'cyan';
    } catch {
      return 'cyan';
    }
  });

  const [beamSettingsOpen, setBeamSettingsOpen] = useState(false);
  const beamPopoverRef = useRef(null);

  // ปิด Popover เมื่อคลิกนอกขอบเขต
  useEffect(() => {
    function handleClickOutside(event) {
      if (beamPopoverRef.current && !beamPopoverRef.current.contains(event.target)) {
        setBeamSettingsOpen(false);
      }
    }
    if (beamSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [beamSettingsOpen]);

  const handleToggleBeam = useCallback(() => {
    setBeamEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('org_chart_beam_enabled', String(next));
      } catch {}
      return next;
    });
  }, []);

  const handleChangeBeamColor = useCallback((mode) => {
    setBeamColorMode(mode);
    try {
      localStorage.setItem('org_chart_beam_color', mode);
    } catch {}
    if (!beamEnabled) {
      setBeamEnabled(true);
      try {
        localStorage.setItem('org_chart_beam_enabled', 'true');
      } catch {}
    }
  }, [beamEnabled]);

  // เมื่อคลิกที่การ์ดพนักงานในโหมด View-Only จะเปิด Modal รายละเอียด
  const handleSelectEmployee = useCallback((empData) => {
    if (!isEditor) {
      setSelectedEmployee(empData);
    }
  }, [isEditor]);

  const handleNodeClick = useCallback((event, node) => {
    if (!isEditor && node?.data) {
      setSelectedEmployee(node.data);
    }
  }, [isEditor]);

  // คำนวณสถิติสรุปสำหรับ Floating Toolbar
  const deptCount = useMemo(() => {
    return [...new Set(employees.map((e) => e.department))].filter(Boolean).length;
  }, [employees]);

  const execCount = useMemo(() => {
    return employees.filter((e) => !e.parent_id).length;
  }, [employees]);

  // คำนวณ Layout เมื่อ employees หรือการตั้งค่าเส้นแสงเปลี่ยน
  const prevEmpIdsRef = useRef('');
  useEffect(() => {
    if (!employees || employees.length === 0) {
      setNodes([]);
      setEdges([]);
      prevEmpIdsRef.current = '';
      return;
    }
    const { nodes: newNodes, edges: newEdges } = computeLayout(
      employees,
      isEditor,
      handleSelectEmployee,
      { enabled: beamEnabled, colorMode: beamColorMode }
    );
    setNodes(newNodes);
    setEdges(newEdges);

    // ปรับมุมมองให้อยู่กึ่งกลางเฉพาะเมื่อรายการพนักงานเปลี่ยน (เช่น เปลี่ยนฟิลเตอร์แผนก)
    // เพื่อไม่ให้รบกวนมุมมองที่ผู้ใช้ซูมหรือเลื่อนดูอยู่
    const currentIds = employees.map((e) => e.id).sort().join(',');
    if (prevEmpIdsRef.current !== currentIds) {
      prevEmpIdsRef.current = currentIds;
      const timer = setTimeout(() => {
        if (reactFlowRef.current) {
          reactFlowRef.current.fitView({ padding: 0.25, duration: 400 });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [employees, isEditor, handleSelectEmployee, beamEnabled, beamColorMode, setNodes, setEdges]);

  // แจ้ง Parent ทราบเมื่อมีการลากขยับ Node
  const handleNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes);
      if (isEditor && onNodesUpdate) {
        // ให้ React state อัปเดตเสร็จสิ้นก่อนอ่านตำแหน่งใหม่
        setTimeout(() => {
          if (reactFlowRef.current) {
            const currentNodes = reactFlowRef.current.getNodes();
            onNodesUpdate(currentNodes);
          }
        }, 50);
      }
    },
    [onNodesChange, isEditor, onNodesUpdate]
  );

  const onInit = useCallback(
    (reactFlowInstance) => {
      reactFlowRef.current = reactFlowInstance;
      if (instanceRef) instanceRef.current = reactFlowInstance;
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.25, duration: 600 });
      }, 150);
    },
    [instanceRef]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-blue-300 text-sm font-medium">กำลังโหลดโครงสร้างองค์กร...</p>
        </div>
      </div>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="text-center p-8 rounded-2xl"
          style={{
            background: 'rgba(15, 33, 71, 0.7)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="text-5xl mb-3">🏢</div>
          <p className="text-white font-bold text-lg">ยังไม่มีข้อมูลพนักงานในระบบ</p>
          <p className="text-blue-300 text-sm mt-1">สามารถเพิ่มพนักงานได้ที่หน้า Admin Panel</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={flowWrapperRef} className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={1.6}
        nodesDraggable={isEditor}
        nodesConnectable={false}
        elementsSelectable={isEditor}
        zoomOnScroll={true}
        panOnScroll={false}
        panOnDrag={true}
        preventScrolling={false}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.2}
          color="rgba(99, 148, 236, 0.22)"
        />

        {/* ── Floating MiniMap (เปิด/ปิด ผ่านไอคอนขวาสุดของ Floating Bar) ── */}
        {showMiniMap && (
          <MiniMap
            nodeColor={(n) => (n.data?.isRoot ? '#3b82f6' : '#1e3a8a')}
            maskColor="rgba(10, 22, 40, 0.75)"
            style={{
              bottom: 82,
              right: 24,
              width: 140,
              height: 90,
              borderRadius: 14,
              background: 'rgba(15, 33, 71, 0.9)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
            }}
          />
        )}

        {/* ── Unified Floating Glass Control Bar (ถอดแบบจาก Admin Panel) ── */}
        <div
          className="export-exclude"
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            maxWidth: '92%',
          }}
        >
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-2xl shadow-2xl"
            style={{
              background: 'rgba(11, 21, 40, 0.88)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.15)',
            }}
          >
            {/* ฝั่งซ้าย: ปุ่มควบคุมการซูม (+ ซูมเข้า, - ซูมออก, ปุ่มรีเซ็ตมุมมอง) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => reactFlowRef.current?.zoomIn({ duration: 300 })}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="ซูมเข้า (Zoom In)"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={() => reactFlowRef.current?.zoomOut({ duration: 300 })}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="ซูมออก (Zoom Out)"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                onClick={() => reactFlowRef.current?.fitView({ padding: 0.25, duration: 400 })}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                title="จัดกึ่งกลาง / รีเซ็ตมุมมอง (Fit View)"
              >
                <Maximize2 size={14} />
              </button>
            </div>

            {/* เส้นคั่น 1 */}
            <div className="h-5 w-px bg-white/15" />

            {/* ตรงกลาง: ข้อมูลสถิติสรุป (จำนวนบุคลากรทั้งหมด, แผนกทั้งหมด, ผู้บริหารสูงสุด) */}
            <div className="hidden sm:flex items-center gap-4 text-xs px-1">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Users size={13} className="text-blue-400" />
                <span>บุคลากร:</span>
                <strong className="text-white font-bold">{employees.length}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Building2 size={13} className="text-blue-400" />
                <span>แผนก:</span>
                <strong className="text-blue-300 font-bold">{deptCount}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Crown size={13} className="text-amber-400" />
                <span>ผู้บริหารสูงสุด:</span>
                <strong className="text-amber-300 font-bold">{execCount}</strong>
              </div>
            </div>

            {/* เส้นคั่น 2 */}
            <div className="hidden sm:block h-5 w-px bg-white/15" />

            {/* ฝั่งขวา: ปุ่ม Export + ตั้งค่าลำแสง + ไอคอน Minimap */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExportModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-md cursor-pointer hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  boxShadow: '0 2px 10px rgba(37, 99, 235, 0.4)',
                }}
                title="ส่งออกผังองค์กร (Export Options: PNG, PDF, JSON, CSV)"
              >
                <Download size={13} />
                <span>Export</span>
              </button>

              {/* ── ปุ่มเปิด/ปิด และตั้งค่าสีเส้นแสงแอนิเมชัน ── */}
              <div className="relative" ref={beamPopoverRef}>
                <button
                  type="button"
                  onClick={() => setBeamSettingsOpen((v) => !v)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                    beamEnabled
                      ? 'bg-sky-500/20 border-sky-500/40 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.35)]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                  title={t('beam_control_title')}
                >
                  <Sparkles size={15} className={beamEnabled ? 'animate-pulse' : ''} />
                </button>

                {/* Popover Card การตั้งค่าลำแสง */}
                {beamSettingsOpen && (
                  <div
                    className="absolute bottom-11 right-0 w-64 rounded-2xl p-3.5 shadow-2xl z-50 text-xs"
                    style={{
                      background: 'rgba(11, 21, 40, 0.96)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.2)',
                    }}
                  >
                    {/* Popover Header */}
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className={beamEnabled ? 'text-sky-400' : 'text-slate-400'} />
                        <span className="font-bold text-white tracking-wide">{t('beam_control_title')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBeamSettingsOpen(false)}
                        className="w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>

                    {/* สวิตช์ เปิด/ปิด ลำแสง */}
                    <div className="flex items-center justify-between py-1 mb-3">
                      <div className="flex flex-col">
                        <span className="text-slate-200 font-semibold">{t('beam_toggle')}</span>
                        <span className="text-[10px] text-slate-400">
                          {beamEnabled ? t('beam_enabled') : t('beam_disabled')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleBeam}
                        className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          beamEnabled ? 'bg-sky-500 shadow-[0_0_10px_rgba(56,189,248,0.5)]' : 'bg-slate-700'
                        }`}
                        title={beamEnabled ? t('beam_disabled') : t('beam_enabled')}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            beamEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* รายการเลือกสี 4 สี */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                        {t('beam_color_label')}
                      </span>

                      {/* 1. สีฟ้า Cyan Sky */}
                      <button
                        type="button"
                        onClick={() => handleChangeBeamColor('cyan')}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          beamColorMode === 'cyan' && beamEnabled
                            ? 'bg-sky-500/20 border-sky-400 text-sky-200 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                            : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                          <span className="font-medium">{t('beam_color_cyan')}</span>
                        </div>
                        {beamColorMode === 'cyan' && beamEnabled && (
                          <Check size={13} className="text-sky-400 font-bold" />
                        )}
                      </button>

                      {/* 2. สีขาว Pure White */}
                      <button
                        type="button"
                        onClick={() => handleChangeBeamColor('white')}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          beamColorMode === 'white' && beamEnabled
                            ? 'bg-white/15 border-white text-white shadow-[0_0_10px_rgba(255,255,255,0.3)]'
                            : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
                          <span className="font-medium">{t('beam_color_white')}</span>
                        </div>
                        {beamColorMode === 'white' && beamEnabled && (
                          <Check size={13} className="text-white font-bold" />
                        )}
                      </button>

                      {/* 3. สีทอง Luxury Gold */}
                      <button
                        type="button"
                        onClick={() => handleChangeBeamColor('gold')}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          beamColorMode === 'gold' && beamEnabled
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.25)]'
                            : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                          <span className="font-medium">{t('beam_color_gold')}</span>
                        </div>
                        {beamColorMode === 'gold' && beamEnabled && (
                          <Check size={13} className="text-amber-400 font-bold" />
                        )}
                      </button>

                      {/* 4. หลากสีสัน Colorful */}
                      <button
                        type="button"
                        onClick={() => handleChangeBeamColor('colorful')}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          beamColorMode === 'colorful' && beamEnabled
                            ? 'bg-purple-500/20 border-purple-400 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                            : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                            style={{ background: 'linear-gradient(135deg, #fbbf24, #38bdf8, #c084fc)' }}
                          />
                          <span className="font-medium">{t('beam_color_colorful')}</span>
                        </div>
                        {beamColorMode === 'colorful' && beamEnabled && (
                          <Check size={13} className="text-purple-400 font-bold" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowMiniMap((v) => !v)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                  showMiniMap
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 shadow-sm'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
                title={showMiniMap ? 'ซ่อนแผนที่ย่อ (Hide Minimap)' : 'แสดงแผนที่ย่อ (Show Minimap)'}
              >
                <Monitor size={15} />
              </button>
            </div>
          </div>
        </div>
      </ReactFlow>
      </div>

      {/* ── Export Options Modal (อยู่นอก flowWrapperRef เพื่อไม่ให้ติดลงในภาพ Export) ── */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        employees={employees}
        companyName={companyName}
        reactFlowWrapperRef={flowWrapperRef}
      />

      {/* ── View-Only Employee Detail Modal (เปิดเมื่อกดที่การ์ดพนักงาน แก้ไขไม่ได้) ── */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          allEmployees={allEmployees || employees}
          departments={departments}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </>
  );
}
