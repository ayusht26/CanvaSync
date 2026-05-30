import React from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { useHistoryStore } from '../../store/useHistoryStore.js';
import { SceneGraphService } from '../../canvas/SceneGraphService.js';

export const HistoryControls: React.FC = () => {
  const { canUndo, canRedo, undo, redo } = useHistoryStore();

  const handleUndo = () => {
    const sg = SceneGraphService.get();
    if (sg) undo(sg);
  };

  const handleRedo = () => {
    const sg = SceneGraphService.get();
    if (sg) redo(sg);
  };

  return (
    <div
      className="fixed bottom-4 left-4 z-40 flex items-center gap-0.5 rounded-xl p-1 animate-slide-bottom"
      style={{
        background: 'var(--toolbar-bg)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        style={{
          color: canUndo ? 'var(--accent)' : 'var(--text-secondary)',
          filter: canUndo ? 'drop-shadow(0 0 4px var(--accent-glow))' : 'none',
        }}
        onMouseEnter={e => {
          if (canUndo) {
            e.currentTarget.style.background = 'var(--bg-elevated)';
            e.currentTarget.style.color = 'var(--accent)';
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = canUndo ? 'var(--accent)' : 'var(--text-secondary)';
        }}
      >
        <Undo2 size={15} />
      </button>

      <button
        onClick={handleRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        style={{
          color: canRedo ? 'var(--accent)' : 'var(--text-secondary)',
          filter: canRedo ? 'drop-shadow(0 0 4px var(--accent-glow))' : 'none',
        }}
        onMouseEnter={e => {
          if (canRedo) {
            e.currentTarget.style.background = 'var(--bg-elevated)';
            e.currentTarget.style.color = 'var(--accent)';
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = canRedo ? 'var(--accent)' : 'var(--text-secondary)';
        }}
      >
        <Redo2 size={15} />
      </button>
    </div>
  );
};
