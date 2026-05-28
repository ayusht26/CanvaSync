import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore.js';

export const ZoomControls: React.FC = () => {
  const { camera, updateCamera } = useCanvasStore();
  const pct = Math.round(camera.zoom * 100);

  return (
    <div
      className="fixed bottom-4 right-4 z-40 flex items-center gap-0.5 rounded-xl p-1 animate-slide-bottom"
      style={{
        background: 'var(--toolbar-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <button
        onClick={() => updateCamera({ zoom: Math.max(0.05, camera.zoom / 1.25) })}
        title="Zoom Out"
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <Minus size={14} />
      </button>

      <button
        onClick={() => updateCamera({ zoom: 1, x: 0, y: 0 })}
        className="px-2 h-8 text-[11px] font-semibold tabular-nums rounded-lg transition-colors"
        style={{ color: 'var(--text-secondary)', minWidth: '44px' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        {pct}%
      </button>

      <button
        onClick={() => updateCamera({ zoom: Math.min(20, camera.zoom * 1.25) })}
        title="Zoom In"
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        <Plus size={14} />
      </button>
    </div>
  );
};
