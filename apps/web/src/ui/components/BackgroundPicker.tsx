import React, { useState, useRef, useEffect } from 'react';
import { Grid3x3, Minus, Circle, Square } from 'lucide-react';
import { useCanvasStore, GridStyle } from '../../store/useCanvasStore.js';

/* ── tiny SVG canvas previews for each mode ─────────────────────────────── */
const GridPreview: React.FC<{ style: GridStyle; active: boolean; isDark: boolean }> = ({ style, active, isDark }) => {
  const bg   = isDark ? '#18181b' : '#ffffff';
  const line = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.15)';
  const maj  = isDark ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.28)';
  const dot  = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.30)';
  const W = 52, H = 52;

  const content = () => {
    if (style === 'none') return null;

    if (style === 'grid') {
      const minorLines: React.ReactNode[] = [];
      for (let x = 0; x <= W; x += 10) minorLines.push(<line key={`vx${x}`} x1={x} y1={0} x2={x} y2={H} stroke={line} strokeWidth={0.7} />);
      for (let y = 0; y <= H; y += 10) minorLines.push(<line key={`hy${y}`} x1={0} y1={y} x2={W} y2={y} stroke={line} strokeWidth={0.7} />);
      for (let x = 0; x <= W; x += 26) minorLines.push(<line key={`Vx${x}`} x1={x} y1={0} x2={x} y2={H} stroke={maj} strokeWidth={1.2} />);
      for (let y = 0; y <= H; y += 26) minorLines.push(<line key={`Hy${y}`} x1={0} y1={y} x2={W} y2={y} stroke={maj} strokeWidth={1.2} />);
      return minorLines;
    }

    if (style === 'lines') {
      const lines: React.ReactNode[] = [];
      for (let y = 8; y <= H; y += 8) {
        const isMajor = Math.round(y / 8) % 5 === 0;
        lines.push(<line key={y} x1={0} y1={y} x2={W} y2={y} stroke={isMajor ? maj : line} strokeWidth={isMajor ? 1 : 0.7} />);
      }
      return lines;
    }

    if (style === 'dots') {
      const dots: React.ReactNode[] = [];
      for (let x = 10; x < W; x += 10)
        for (let y = 10; y < H; y += 10)
          dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={1.2} fill={dot} />);
      return dots;
    }

    return null;
  };

  return (
    <svg
      width={W} height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{
        borderRadius: 8,
        border: active ? '2px solid var(--accent)' : '1.5px solid var(--border)',
        background: bg,
        boxShadow: active ? '0 0 0 3px var(--accent-glow)' : 'none',
        transition: 'border-color 150ms, box-shadow 150ms',
        display: 'block',
        flexShrink: 0,
      }}
    >
      {content()}
    </svg>
  );
};

const GRID_OPTIONS: { id: GridStyle; label: string; Icon: React.ElementType }[] = [
  { id: 'none',  label: 'None',  Icon: Square  },
  { id: 'grid',  label: 'Grid',  Icon: Grid3x3 },
  { id: 'lines', label: 'Lines', Icon: Minus   },
  { id: 'dots',  label: 'Dots',  Icon: Circle  },
];

export const BackgroundPicker: React.FC = () => {
  const gridStyle    = useCanvasStore((s) => s.gridStyle);
  const setGridStyle = useCanvasStore((s) => s.setGridStyle);
  const theme        = useCanvasStore((s) => s.theme);
  const isDark       = theme === 'dark';

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const ActiveIcon = GRID_OPTIONS.find(o => o.id === gridStyle)?.Icon ?? Grid3x3;

  return (
    <div ref={ref} className="relative flex-shrink-0">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg transition-all text-xs font-medium"
        style={{
          border: '1.5px solid var(--border)',
          color: open ? 'var(--text-primary)' : 'var(--text-secondary)',
          background: open ? 'var(--bg-elevated)' : 'transparent',
        }}
        onMouseEnter={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
          }
        }}
        title="Canvas background"
      >
        <ActiveIcon size={14} />
        <span className="hidden sm:inline">Background</span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute z-[300] animate-scale-in"
          style={{
            top: 'calc(100% + 8px)',
            right: 0,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            boxShadow: 'var(--shadow-lg)',
            padding: '14px',
            minWidth: 200,
          }}
        >
          <div
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            Canvas Background
          </div>

          <div className="grid grid-cols-4 gap-4">
            {GRID_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setGridStyle(id); setOpen(false); }}
                className="flex flex-col items-center gap-2 group outline-none"
                title={label}
              >
                <GridPreview style={id} active={gridStyle === id} isDark={isDark} />
                <span
                  className="text-[10px] font-medium transition-colors"
                  style={{ color: gridStyle === id ? 'var(--accent)' : 'var(--text-muted)' }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
