import React, { useState } from 'react';
import { Users } from 'lucide-react';

interface JoinRoomModalProps {
  onJoin: (name: string, color: string) => void;
}

const COLORS = [
  '#F87171', '#FB923C', '#FBBF24', '#34D399',
  '#22D3EE', '#818CF8', '#C084FC', '#F472B6'
];

const LS_NAME_KEY = 'canvasync-user-name';
const LS_COLOR_KEY = 'canvasync-user-color';

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ onJoin }) => {
  const [name, setName] = useState(() => localStorage.getItem(LS_NAME_KEY) || '');
  const [selectedColor, setSelectedColor] = useState(
    () => localStorage.getItem(LS_COLOR_KEY) || COLORS[Math.floor(Math.random() * COLORS.length)]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      localStorage.setItem(LS_NAME_KEY, trimmed);
      localStorage.setItem(LS_COLOR_KEY, selectedColor);
      onJoin(trimmed, selectedColor);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="px-8 pt-8 pb-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: 'var(--accent)', boxShadow: '0 0 20px var(--accent-glow)' }}
            >
              <Users size={20} color="white" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Join Board</h2>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Choose how you'll appear to others
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name input */}
            <div>
              <label htmlFor="join-name" className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Your Name
              </label>
              <input
                type="text"
                id="join-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                  '--tw-ring-color': 'var(--accent)',
                } as any}
                autoFocus
                required
              />
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                Cursor Color
              </label>
              <div className="grid grid-cols-4 gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className="h-10 rounded-lg transition-all transform hover:scale-105"
                    style={{
                      backgroundColor: color,
                      outline: selectedColor === color ? `3px solid white` : 'none',
                      outlineOffset: '2px',
                      transform: selectedColor === color ? 'scale(1.1)' : undefined,
                      opacity: selectedColor === color ? 1 : 0.7,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase shrink-0"
                style={{ backgroundColor: selectedColor }}
              >
                {name.trim().charAt(0) || '?'}
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {name.trim() || 'Your name here'}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  This is how collaborators see you
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 4px 15px var(--accent-glow)',
              }}
              onMouseEnter={e => { if (name.trim()) e.currentTarget.style.background = 'var(--accent-hover)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; }}
            >
              Join Board
            </button>
          </form>
        </div>

        <div
          className="px-8 py-4"
          style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}
        >
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            Your cursor and name will be visible to other collaborators.
          </p>
        </div>
      </div>
    </div>
  );
};
