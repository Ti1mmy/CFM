'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';

interface WebringSectionProps {
  onVisibilityChange: (visible: boolean) => void;
}

interface WebringEntry {
  name: string;
  url: string;
  description: string;
  cohort: string;
}

const WEBRING_ENTRIES: WebringEntry[] = [
  { name: 'Daniel Liu', url: 'https://danielwliu.com', description: 'SWE @ building things', cohort: '2029' },
  { name: 'Alice Chen', url: '#', description: 'quant dev in training', cohort: '2028' },
  { name: 'Bob Zhang', url: '#', description: 'full-stack fintech', cohort: '2029' },
  { name: 'Carol Wu', url: '#', description: 'ML + markets', cohort: '2027' },
  { name: 'David Park', url: '#', description: 'systems engineer', cohort: '2028' },
  { name: 'Eve Singh', url: '#', description: 'crypto & distributed', cohort: '2029' },
  { name: 'Frank Li', url: '#', description: 'product & design', cohort: '2027' },
  { name: 'Grace Kim', url: '#', description: 'data science', cohort: '2028' },
];

const ALL_COHORTS = [...new Set(WEBRING_ENTRIES.map(e => e.cohort))].sort();

// Deterministic seed-based positions
function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  entry: WebringEntry;
  index: number;
  targetX: number;
  targetY: number;
}

interface Edge {
  from: number;
  to: number;
}

function buildGraph(entries: WebringEntry[], w: number, h: number): { nodes: Node[]; edges: Edge[] } {
  const padX = 80;
  const padY = 80;
  const nodes: Node[] = entries.map((entry, i) => {
    const x = padX + seededRandom(i * 2) * (w - padX * 2);
    const y = padY + seededRandom(i * 2 + 1) * (h - padY * 2);
    return { x, y, vx: 0, vy: 0, entry, index: i, targetX: x, targetY: y };
  });

  const edges: Edge[] = [];
  for (let i = 0; i < entries.length; i++) {
    edges.push({ from: i, to: (i + 1) % entries.length });
  }
  for (let i = 0; i < entries.length; i++) {
    const jump = 2 + Math.floor(seededRandom(i * 7 + 3) * 3);
    const target = (i + jump) % entries.length;
    if (!edges.some(e => (e.from === i && e.to === target) || (e.from === target && e.to === i))) {
      edges.push({ from: i, to: target });
    }
  }

  return { nodes, edges };
}

function simulate(nodes: Node[], edges: Edge[], w: number, h: number) {
  const REPULSION = 8000;
  const SPRING = 0.005;
  const SPRING_LEN = 180;
  const DAMPING = 0.85;
  const PAD = 60;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = REPULSION / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      nodes[i].vx -= fx;
      nodes[i].vy -= fy;
      nodes[j].vx += fx;
      nodes[j].vy += fy;
    }
  }

  for (const edge of edges) {
    const a = nodes[edge.from];
    const b = nodes[edge.to];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const force = (dist - SPRING_LEN) * SPRING;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  const cx = w / 2;
  const cy = h / 2;
  for (const node of nodes) {
    node.vx += (cx - node.x) * 0.0003;
    node.vy += (cy - node.y) * 0.0003;
  }

  for (const node of nodes) {
    node.vx *= DAMPING;
    node.vy *= DAMPING;
    node.x += node.vx;
    node.y += node.vy;
    node.x = Math.max(PAD, Math.min(w - PAD, node.x));
    node.y = Math.max(PAD, Math.min(h - PAD, node.y));
  }
}

export default function WebringSection({ onVisibilityChange }: WebringSectionProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [search, setSearch] = useState('');
  const [selectedCohorts, setSelectedCohorts] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState(-1);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; entry: WebringEntry } | null>(null);
  const graphRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const rafRef = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);
  const settled = useRef(false);
  const frameCount = useRef(0);

  // Node dragging state (refs so animation loop can read them)
  const draggedNodeRef = useRef(-1);
  const dragStartPosRef = useRef({ x: 0, y: 0 });

  // Draggable + resizable panel state
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState({ x: 32, y: 80 });
  const [panelSize, setPanelSize] = useState({ w: 340, h: 420 });
  const [collapsed, setCollapsed] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);
  // Panel rect ref for physics interaction — updated on drag/resize
  const panelRectRef = useRef({ x: 32, y: 80, w: 340, h: 420 });

  const toggleCohort = useCallback((cohort: string) => {
    setSelectedCohorts(prev => {
      const next = new Set(prev);
      if (next.has(cohort)) next.delete(cohort);
      else next.add(cohort);
      return next;
    });
  }, []);

  const matchingIndices = useMemo(() => {
    const q = search.toLowerCase().trim();
    const set = new Set<number>();
    WEBRING_ENTRIES.forEach((e, i) => {
      const matchesSearch = !q || e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || e.cohort.includes(q);
      const matchesCohort = selectedCohorts.size === 0 || selectedCohorts.has(e.cohort);
      if (matchesSearch && matchesCohort) set.add(i);
    });
    return set;
  }, [search, selectedCohorts]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: panelPos.x, origY: panelPos.y };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      const newPos = { x: dragRef.current.origX + dx, y: dragRef.current.origY + dy };
      setPanelPos(newPos);
      panelRectRef.current = { ...panelRectRef.current, x: newPos.x, y: newPos.y };
      // Re-enable simulation so nodes react to panel movement
      settled.current = false;
      frameCount.current = 100;
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [panelPos]);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: panelSize.w, origH: panelSize.h };

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const dx = ev.clientX - resizeRef.current.startX;
      const dy = ev.clientY - resizeRef.current.startY;
      const newSize = {
        w: Math.max(280, resizeRef.current.origW + dx),
        h: Math.max(300, resizeRef.current.origH + dy),
      };
      setPanelSize(newSize);
      panelRectRef.current = { ...panelRectRef.current, w: newSize.w, h: newSize.h };
      settled.current = false;
      frameCount.current = 100;
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [panelSize]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => onVisibilityChange(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisibilityChange]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };
    resize();

    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;

    if (!graphRef.current) {
      graphRef.current = buildGraph(WEBRING_ENTRIES, w, h);
    }

    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio;

    const draw = () => {
      const graph = graphRef.current!;
      const { nodes, edges } = graph;

      const dragging = draggedNodeRef.current;

      // If a node is being dragged, re-enable simulation so others react
      if (dragging >= 0) {
        settled.current = false;
        frameCount.current = 100; // don't reset fully, just keep sim alive
      }

      if (!settled.current) {
        for (let i = 0; i < 3; i++) simulate(nodes, edges, w, h);
        frameCount.current++;
        if (frameCount.current > 200 && dragging < 0) settled.current = true;
      } else {
        for (const node of nodes) {
          node.x += Math.sin(Date.now() * 0.0005 + node.index * 1.7) * 0.15;
          node.y += Math.cos(Date.now() * 0.0004 + node.index * 2.3) * 0.1;
        }
      }

      // Pin dragged node to mouse — override simulation
      if (dragging >= 0) {
        const dn = nodes[dragging];
        dn.vx = 0;
        dn.vy = 0;
      }

      // Panel repulsion — push nodes out of the search panel area
      const pr = panelRectRef.current;
      const PAD_PANEL = 30; // extra margin around panel
      for (const node of nodes) {
        if (dragging === node.index) continue;
        const px1 = pr.x - PAD_PANEL;
        const py1 = pr.y - PAD_PANEL;
        const px2 = pr.x + pr.w + PAD_PANEL;
        const py2 = pr.y + pr.h + PAD_PANEL;
        if (node.x > px1 && node.x < px2 && node.y > py1 && node.y < py2) {
          // Find nearest edge and push away from it
          const dLeft = node.x - px1;
          const dRight = px2 - node.x;
          const dTop = node.y - py1;
          const dBottom = py2 - node.y;
          const minD = Math.min(dLeft, dRight, dTop, dBottom);
          const pushForce = 8;
          if (minD === dLeft) node.vx -= pushForce;
          else if (minD === dRight) node.vx += pushForce;
          else if (minD === dTop) node.vy -= pushForce;
          else node.vy += pushForce;
        }
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Edges
      for (const edge of edges) {
        const a = nodes[edge.from];
        const b = nodes[edge.to];
        const aMatch = matchingIndices.has(a.index);
        const bMatch = matchingIndices.has(b.index);
        const bothMatch = aMatch && bMatch;
        const eitherHovered = hoveredNode === a.index || hoveredNode === b.index;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);

        if (eitherHovered) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 2;
        } else if (bothMatch) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1;
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
          ctx.lineWidth = 0.5;
        }
        ctx.stroke();
      }

      // Data packets
      const time = Date.now() * 0.001;
      for (const edge of edges) {
        const a = nodes[edge.from];
        const b = nodes[edge.to];
        if (!matchingIndices.has(a.index) && !matchingIndices.has(b.index)) continue;
        const t = ((time * 0.3 + edge.from * 0.5) % 1);
        const px = a.x + (b.x - a.x) * t;
        const py = a.y + (b.y - a.y) * t;
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
      }

      // Nodes
      for (const node of nodes) {
        const isMatch = matchingIndices.has(node.index);
        const isHovered = hoveredNode === node.index;
        const r = isHovered ? 28 : 22;

        if (isHovered) {
          const pulseR = 36 + Math.sin(Date.now() * 0.004) * 6;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? '#fff' : isMatch ? '#0a0a0a' : '#050505';
        ctx.fill();
        ctx.strokeStyle = isMatch ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = isHovered ? 2.5 : isMatch ? 1.5 : 0.5;
        ctx.stroke();

        if (isHovered) {
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        const initials = node.entry.name.split(' ').map(w => w[0]).join('');
        ctx.font = `${isHovered ? 11 : 9}px ArcadeClassic, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isHovered ? '#000' : isMatch ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.15)';
        ctx.fillText(initials, node.x, node.y + 1);
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    const onResize = () => {
      resize();
      const newW = canvas.width / window.devicePixelRatio;
      const newH = canvas.height / window.devicePixelRatio;
      if (graphRef.current) {
        graphRef.current = buildGraph(WEBRING_ENTRIES, newW, newH);
        settled.current = false;
        frameCount.current = 0;
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [matchingIndices, hoveredNode]);

  const findNodeAt = useCallback((mx: number, my: number) => {
    const graph = graphRef.current;
    if (!graph) return -1;
    let closest = -1;
    let closestDist = Infinity;
    for (const node of graph.nodes) {
      const dx = node.x - mx;
      const dy = node.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 30 && dist < closestDist) {
        closest = node.index;
        closestDist = dist;
      }
    }
    return closest;
  }, []);

  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const graph = graphRef.current;
    if (!canvas || !graph) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // If dragging a node, move it
    if (draggedNodeRef.current >= 0) {
      const node = graph.nodes[draggedNodeRef.current];
      node.x = mx;
      node.y = my;
      node.vx = 0;
      node.vy = 0;
      setTooltip({ x: node.x, y: node.y, entry: node.entry });
      return;
    }

    const closest = findNodeAt(mx, my);
    setHoveredNode(closest);
    if (closest >= 0) {
      const node = graph.nodes[closest];
      setTooltip({ x: node.x, y: node.y, entry: node.entry });
      canvas.style.cursor = 'grab';
    } else {
      setTooltip(null);
      canvas.style.cursor = 'default';
    }
  }, [findNodeAt]);

  const handleCanvasDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const hit = findNodeAt(mx, my);
    if (hit >= 0) {
      draggedNodeRef.current = hit;
      dragStartPosRef.current = { x: mx, y: my };
      canvas.style.cursor = 'grabbing';
      setHoveredNode(hit);
    }
  }, [findNodeAt]);

  const handleCanvasUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (draggedNodeRef.current >= 0) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const dx = mx - dragStartPosRef.current.x;
      const dy = my - dragStartPosRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // If barely moved, treat as click → open URL
      if (dist < 5) {
        const entry = WEBRING_ENTRIES[draggedNodeRef.current];
        if (entry.url !== '#') {
          window.open(entry.url, '_blank', 'noopener,noreferrer');
        }
      }

      draggedNodeRef.current = -1;
      canvas.style.cursor = 'grab';
    }
  }, []);

  const handleCanvasLeave = useCallback(() => {
    draggedNodeRef.current = -1;
    setHoveredNode(-1);
    setTooltip(null);
  }, []);

  // Calculate dynamic list height: total panel height minus fixed header content
  const listMaxHeight = panelSize.h - 230;

  return (
    <section ref={sectionRef} className="relative h-screen flex flex-col overflow-hidden" style={{ zIndex: 10 }}>
      <div ref={sentinelRef} className="absolute top-0 left-0 w-full h-24" />

      {/* Draggable + resizable search panel */}
      <div
        ref={panelRef}
        className="absolute z-20"
        style={{
          top: panelPos.y,
          left: panelPos.x,
          width: panelSize.w,
          userSelect: 'none',
        }}
      >
        <div
          style={{
            border: '2px solid #000',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            boxShadow: '3px 3px 0 #000',
            height: collapsed ? 'auto' : panelSize.h,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Scanline */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
            zIndex: 1,
          }} />

          {/* Drag handle — title bar */}
          <div
            onMouseDown={handleDragStart}
            className="flex items-center justify-between px-4 py-2 relative z-10"
            style={{
              borderBottom: '1px solid #222',
              background: '#0a0a0a',
              cursor: 'grab',
              flexShrink: 0,
            }}
          >
            <div className="flex items-center gap-2">
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#fff', display: 'inline-block',
                boxShadow: '0 0 6px rgba(255,255,255,0.5)',
              }} />
              <span style={{
                fontFamily: 'var(--font-arcade)', fontSize: 12,
                letterSpacing: '0.1em', color: '#fff',
              }}>
                SEARCH
              </span>
              <span style={{
                display: 'inline-block', width: 7, height: 12,
                background: '#fff',
                animation: 'terminal-cursor-blink 1s step-end infinite',
              }} />
            </div>
            <div className="flex items-center gap-2">
              <span style={{
                fontFamily: 'var(--font-arcade)', fontSize: 8,
                color: '#444', letterSpacing: '0.1em',
              }}>
                {matchingIndices.size}/{WEBRING_ENTRIES.length}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCollapsed(prev => !prev);
                  // Update panel rect for physics
                  panelRectRef.current = {
                    ...panelRectRef.current,
                    h: collapsed ? panelSize.h : 32,
                  };
                  settled.current = false;
                  frameCount.current = 100;
                }}
                style={{
                  background: 'none',
                  border: '1px solid #333',
                  color: '#888',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  padding: '1px 6px',
                  lineHeight: 1,
                }}
              >
                {collapsed ? '+' : '−'}
              </button>
            </div>
          </div>

          {/* Body — hidden when collapsed */}
          {!collapsed && <div className="flex-1 overflow-hidden flex flex-col px-4 py-3 relative z-10">
            {/* Search input */}
            <div style={{
              border: '1px solid #333',
              background: '#111',
              display: 'flex',
              alignItems: 'center',
              padding: '0 12px',
              flexShrink: 0,
            }}>
              <span style={{ color: '#888', fontFamily: 'var(--font-mono)', fontSize: 13, marginRight: 8 }}>
                {'>'}
              </span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="search..."
                spellCheck={false}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#e0e0e0',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  padding: '8px 0',
                  width: '100%',
                  caretColor: '#fff',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    background: 'none', border: 'none', color: '#666',
                    cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 14,
                    padding: '0 4px',
                  }}
                >
                  x
                </button>
              )}
            </div>

            {/* Cohort filter chips */}
            <div className="flex flex-wrap gap-1 mt-2" style={{ flexShrink: 0 }}>
              {ALL_COHORTS.map(cohort => {
                const active = selectedCohorts.has(cohort);
                return (
                  <button
                    key={cohort}
                    onClick={() => toggleCohort(cohort)}
                    style={{
                      fontFamily: 'var(--font-arcade)',
                      fontSize: 9,
                      letterSpacing: '0.08em',
                      padding: '3px 10px',
                      border: `1px solid ${active ? '#fff' : '#333'}`,
                      background: active ? '#fff' : 'transparent',
                      color: active ? '#000' : '#666',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {cohort}
                  </button>
                );
              })}
              {selectedCohorts.size > 0 && (
                <button
                  onClick={() => setSelectedCohorts(new Set())}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    padding: '3px 8px',
                    border: '1px solid #333',
                    background: 'transparent',
                    color: '#666',
                    cursor: 'pointer',
                  }}
                >
                  clear
                </button>
              )}
            </div>

            {/* Results list */}
            <div
              className="mt-3 flex flex-col gap-1 flex-1 overflow-y-auto"
              style={{ maxHeight: Math.max(80, listMaxHeight) }}
            >
              {WEBRING_ENTRIES.map((entry, i) => {
                if (!matchingIndices.has(i)) return null;
                return (
                  <a
                    key={i}
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block no-underline"
                    onMouseEnter={() => setHoveredNode(i)}
                    onMouseLeave={() => setHoveredNode(-1)}
                    style={{
                      padding: '6px 8px',
                      background: hoveredNode === i ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                      border: `1px solid ${hoveredNode === i ? 'rgba(255, 255, 255, 0.2)' : 'transparent'}`,
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{
                        fontFamily: 'var(--font-arcade)', fontSize: 11,
                        letterSpacing: '0.06em', color: '#fff',
                      }}>
                        {entry.name}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-arcade)', fontSize: 9,
                        color: '#444', letterSpacing: '0.08em',
                      }}>
                        {entry.cohort}
                      </span>
                    </div>
                    <p style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10,
                      color: '#666', margin: 0, marginTop: 2,
                    }}>
                      {entry.description}
                    </p>
                  </a>
                );
              })}
              {matchingIndices.size === 0 && (
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: '#444', padding: '12px 0', textAlign: 'center',
                }}>
                  no results found
                </p>
              )}
            </div>

            {/* Join CTA */}
            <div className="mt-3 pt-2" style={{ borderTop: '1px solid #222', flexShrink: 0 }}>
              <a
                href="https://github.com/DanielWLiu07/CFM"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block no-underline transition-all duration-200"
                style={{
                  fontFamily: 'var(--font-arcade)',
                  fontSize: 9,
                  letterSpacing: '0.15em',
                  color: '#fff',
                  border: '2px solid #fff',
                  boxShadow: '2px 2px 0 #000',
                  padding: '5px 14px',
                  background: 'transparent',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = '#fff';
                  (e.currentTarget as HTMLElement).style.color = '#000';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = '#fff';
                }}
              >
                ADD YOUR SITE
              </a>
            </div>
          </div>}

          {/* Resize handle — bottom-right corner, hidden when collapsed */}
          {!collapsed && (
            <div
              onMouseDown={handleResizeStart}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 16,
                height: 16,
                cursor: 'nwse-resize',
                zIndex: 10,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" style={{ opacity: 0.3 }}>
                <line x1="14" y1="4" x2="4" y2="14" stroke="#fff" strokeWidth="1" />
                <line x1="14" y1="8" x2="8" y2="14" stroke="#fff" strokeWidth="1" />
                <line x1="14" y1="12" x2="12" y2="14" stroke="#fff" strokeWidth="1" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip on hovered node */}
      {tooltip && (
        <div
          className="absolute z-30 pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 50,
            transform: 'translateX(-50%)',
          }}
        >
          <div style={{
            background: 'rgba(0, 0, 0, 0.95)',
            border: '2px solid #fff',
            boxShadow: '2px 2px 0 #000',
            padding: '6px 12px',
            whiteSpace: 'nowrap',
          }}>
            <p style={{
              fontFamily: 'var(--font-arcade)', fontSize: 11,
              color: '#fff', margin: 0, letterSpacing: '0.08em',
            }}>
              {tooltip.entry.name}
            </p>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: '#999', margin: 0, marginTop: 2,
            }}>
              {tooltip.entry.description}
            </p>
          </div>
        </div>
      )}

      {/* Full-screen canvas */}
      <div className="absolute inset-0">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          onMouseDown={handleCanvasDown}
          onMouseMove={handleCanvasMove}
          onMouseUp={handleCanvasUp}
          onMouseLeave={handleCanvasLeave}
        />
      </div>
    </section>
  );
}
