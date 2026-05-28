import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ToolButtonProps {
  icon: LucideIcon;
  label: string;
  shortcut?: string;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
  horizontal?: boolean; // when true, tooltip shows below instead of to the right
}

export const ToolButton: React.FC<ToolButtonProps> = ({ icon: Icon, label, shortcut, isActive, onClick, horizontal }) => {
  return (
    <div className="relative group flex-shrink-0">
      <button
        onClick={onClick}
        title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 active:scale-90"
        style={{
          background: isActive ? 'var(--accent)' : 'transparent',
          color: isActive ? '#ffffff' : 'var(--text-secondary)',
          boxShadow: isActive ? '0 0 12px var(--accent-glow)' : 'none',
        }}
        onMouseEnter={e => {
          if (!isActive) e.currentTarget.style.background = 'var(--bg-elevated)';
          e.currentTarget.style.color = isActive ? '#ffffff' : 'var(--text-primary)';
        }}
        onMouseLeave={e => {
          if (!isActive) e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = isActive ? '#ffffff' : 'var(--text-secondary)';
        }}
      >
        <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
        {isActive && !horizontal && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
            style={{ background: '#ffffff', opacity: 0.7 }}
          />
        )}
        {isActive && horizontal && (
          <span
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-t-full"
            style={{ background: '#ffffff', opacity: 0.7 }}
          />
        )}
      </button>

      {/* Tooltip — shows below in horizontal mode, right in vertical mode */}
      <div
        className={`absolute pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-[100] ${
          horizontal
            ? 'top-full mt-2 left-1/2 -translate-x-1/2'
            : 'left-full ml-2.5 top-1/2 -translate-y-1/2'
        }`}
      >
        <div
          className="flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {label}
          {shortcut && (
            <kbd
              className="text-[10px] px-1 py-0.5 rounded"
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontFamily: 'monospace' }}
            >
              {shortcut}
            </kbd>
          )}
        </div>
        {/* Arrow */}
        {horizontal ? (
          <div
            className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent"
            style={{ borderBottomColor: 'var(--border)' }}
          />
        ) : (
          <div
            className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent"
            style={{ borderRightColor: 'var(--border)' }}
          />
        )}
      </div>
    </div>
  );
};
