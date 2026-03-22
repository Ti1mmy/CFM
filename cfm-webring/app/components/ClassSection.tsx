'use client';

import { useRef, useEffect, useCallback } from 'react';

interface ClassSectionProps {
  onVisibilityChange: (visible: boolean) => void;
}

interface ClassMember {
  name: string;
  url: string;
  role: string;
}

const COHORTS: { year: string; members: ClassMember[] }[] = [
  {
    year: '2029',
    members: [
      { name: 'Daniel Liu', url: 'https://danielwliu.com', role: 'SWE' },
      { name: 'Bob Zhang', url: '#', role: 'Fintech' },
      { name: 'Eve Singh', url: '#', role: 'Distributed Systems' },
    ],
  },
  {
    year: '2028',
    members: [
      { name: 'Alice Chen', url: '#', role: 'Quant Dev' },
      { name: 'David Park', url: '#', role: 'Systems' },
      { name: 'Grace Kim', url: '#', role: 'Data Science' },
    ],
  },
  {
    year: '2027',
    members: [
      { name: 'Carol Wu', url: '#', role: 'ML' },
      { name: 'Frank Li', url: '#', role: 'Product' },
    ],
  },
];

export default function ClassSection({ onVisibilityChange }: ClassSectionProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

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

  return (
    <section
      className="relative min-h-screen py-24 px-6 md:px-12 lg:px-20 flex flex-col items-center"
      style={{ backgroundColor: 'black' }}
    >
      <div ref={sentinelRef} className="absolute top-0 left-0 w-full h-24" />

      {/* Title */}
      <h2
        style={{
          fontFamily: 'var(--font-arcade)',
          fontSize: 48,
          letterSpacing: '0.15em',
          color: '#fff',
          textShadow: '2px 4px 0 #111, 4px 8px 0 #000',
          marginBottom: 48,
          zIndex: 20,
        }}
      >
        CLASS
      </h2>

      {/* Cohort columns */}
      <div
        className="flex flex-col md:flex-row gap-8 w-full justify-center"
        style={{ maxWidth: 1000, zIndex: 20 }}
      >
        {COHORTS.map(cohort => (
          <div
            key={cohort.year}
            className="flex-1"
            style={{
              border: '2px solid #222',
              background: '#0a0a0a',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Scanline */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
              }}
            />

            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid #222', background: '#050505' }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-arcade)',
                  fontSize: 14,
                  letterSpacing: '0.1em',
                  color: '#fff',
                }}
              >
                CLASS OF {cohort.year}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-arcade)',
                  fontSize: 9,
                  color: '#555',
                  letterSpacing: '0.1em',
                }}
              >
                {cohort.members.length} MEMBERS
              </span>
            </div>

            {/* Members */}
            <div className="p-4 flex flex-col gap-3">
              {cohort.members.map((member, i) => (
                <a
                  key={i}
                  href={member.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block no-underline transition-all duration-150"
                  style={{
                    padding: '8px 10px',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: '#fff',
                          display: 'inline-block',
                          boxShadow: '0 0 4px rgba(255,255,255,0.4)',
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'var(--font-arcade)',
                          fontSize: 11,
                          letterSpacing: '0.06em',
                          color: '#fff',
                        }}
                      >
                        {member.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        color: '#555',
                      }}
                    >
                      {member.role}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
