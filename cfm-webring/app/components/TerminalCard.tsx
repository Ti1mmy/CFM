'use client';

import { useRef, useCallback, useState, forwardRef } from 'react';

interface TerminalCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function makePixelExtrusion() {
  const steps = Array.from({ length: 6 }, (_, j) => {
    const y = (j + 1) * 2;
    const x = Math.round(y * 0.4);
    const v = Math.max(0, 30 - j * 5);
    return `${x}px ${y}px 0 rgb(${v},${v},${v})`;
  });
  return steps.join(', ');
}

const TerminalCard = forwardRef<HTMLDivElement, TerminalCardProps>(
  function TerminalCard({ title, children, className = '', style = {} }, ref) {
    const innerRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState(false);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      const card = innerRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
    }, []);

    const handleMouseLeave = useCallback(() => {
      const card = innerRef.current;
      if (!card) return;
      card.style.transform = 'rotateY(0deg) rotateX(0deg)';
      setHovered(false);
    }, []);

    return (
      <div ref={ref} className={className} style={{ perspective: 1000, ...style }}>
        <div
          ref={innerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{
            transition: 'transform 0.15s ease-out',
            border: '2px solid #2a2a2a',
            boxShadow: `${makePixelExtrusion()}, 0 0 15px rgba(255, 255, 255, 0.08)`,
            animation: hovered ? 'terminal-glow 2s ease-in-out infinite' : 'terminal-glow 4s ease-in-out infinite',
            background: '#0a0a0a',
            position: 'relative',
            overflow: 'hidden',
            height: '100%',
          }}
        >
          {/* Scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
            }}
          />

          {/* Terminal title bar */}
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ borderBottom: '1px solid #2a2a2a', background: '#050505' }}
          >
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontFamily: 'var(--font-arcade)',
                  fontSize: 14,
                  letterSpacing: '0.1em',
                  color: '#ccc',
                }}
              >
                {title}
              </span>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 16,
                  background: '#aaa',
                  animation: 'terminal-cursor-blink 1s step-end infinite',
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#aaa',
                  display: 'inline-block',
                  boxShadow: '0 0 4px rgba(255,255,255,0.4)',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-arcade)',
                  fontSize: 10,
                  color: '#aaa',
                  letterSpacing: '0.1em',
                }}
              >
                LIVE
              </span>
            </div>
          </div>

          {/* Terminal body */}
          <div
            className="p-6 md:p-8"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              lineHeight: 1.8,
              color: '#e0e0e0',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);

export default TerminalCard;
