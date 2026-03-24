'use client';

import { useRef, useEffect } from 'react';

const REPO_URL = 'https://github.com/DanielWLiu07/CFM';

const TECH_STACK = {
  frontend: [
    'Next.js 16',
    'React 19',
    'TypeScript',
    'Tailwind CSS 4',
    'Three.js / R3F',
  ],
  backend: [
    'Vercel Edge',
    'Node.js',
  ],
  tools: [
    'Turbopack',
    'ESLint',
    'Blender',
    'Claude Code',
  ],
};

export default function GithubSection({ onVisibilityChange }: { onVisibilityChange?: (visible: boolean) => void }) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onVisibilityChange || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => onVisibilityChange(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [onVisibilityChange]);

  return (
    <section className="relative flex flex-col items-center justify-center px-6" style={{ background: 'transparent', paddingTop: '6vh', paddingBottom: 0 }}>
      <div ref={sentinelRef} className="absolute top-0 left-0 w-full h-24" />

      {/* Terminal box */}
      <div style={{
        width: '100%',
        maxWidth: 700,
        border: '2px solid #333',
        background: 'rgba(0,0,0,0.9)',
        boxShadow: '3px 3px 0 #000, 0 0 40px rgba(255,255,255,0.03)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Scanline overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 4px)',
          zIndex: 1,
        }} />

        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2" style={{ borderBottom: '1px solid #222', background: '#0a0a0a' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block', boxShadow: '0 0 6px rgba(255,255,255,0.5)' }} />
          <span style={{ fontFamily: 'var(--font-arcade)', fontSize: 12, letterSpacing: '0.1em', color: '#fff' }}>SOURCE CODE</span>
          <span style={{ display: 'inline-block', width: 7, height: 12, background: '#fff', animation: 'terminal-cursor-blink 1s step-end infinite' }} />
        </div>

        {/* Content */}
        <div className="relative p-6" style={{ zIndex: 2 }}>
          {/* Prompt line */}
          <div style={{ fontFamily: 'var(--font-arcade)', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 20, letterSpacing: '0.08em' }}>
            {'>'} cat tech_stack.txt
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div style={{ fontFamily: 'var(--font-arcade)', fontSize: 12, color: '#fff', letterSpacing: '0.1em', marginBottom: 12 }}>
                FRONTEND
              </div>
              {TECH_STACK.frontend.map((item) => (
                <div key={item} style={{ fontFamily: 'var(--font-arcade)', fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 6, letterSpacing: '0.05em' }}>
                  {'> '}{item}
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-arcade)', fontSize: 12, color: '#fff', letterSpacing: '0.1em', marginBottom: 12 }}>
                BACKEND
              </div>
              {TECH_STACK.backend.map((item) => (
                <div key={item} style={{ fontFamily: 'var(--font-arcade)', fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 6, letterSpacing: '0.05em' }}>
                  {'> '}{item}
                </div>
              ))}
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-arcade)', fontSize: 12, color: '#fff', letterSpacing: '0.1em', marginBottom: 12 }}>
                TOOLS
              </div>
              {TECH_STACK.tools.map((item) => (
                <div key={item} style={{ fontFamily: 'var(--font-arcade)', fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 6, letterSpacing: '0.05em' }}>
                  {'> '}{item}
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #222', margin: '24px 0' }} />

          {/* Contribute CTA */}
          <div style={{ fontFamily: 'var(--font-arcade)', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 16, letterSpacing: '0.08em' }}>
            {'>'} THIS PROJECT IS OPEN SOURCE.
          </div>
          <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20, lineHeight: 1.6 }}>
            CFM students — PRs welcome. Add yourself to the webring, fix bugs, or build new features.
          </div>

          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-btn"
            style={{
              fontFamily: 'var(--font-arcade)',
              fontSize: 11,
              letterSpacing: '0.1em',
              color: '#fff',
              border: '1px solid #444',
              padding: '10px 0',
              background: 'rgba(255,255,255,0.04)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              width: '100%',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            STAR  &  CONTRIBUTE
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        fontFamily: 'var(--font-arcade)',
        fontSize: 9,
        color: 'rgba(255,255,255,0.15)',
        marginTop: 32,
        letterSpacing: '0.12em',
        textAlign: 'center',
      }}>
        BUILT BY CFM STUDENTS  //  2026
      </div>
    </section>
  );
}
