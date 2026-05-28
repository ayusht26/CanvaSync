import React, { useState } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import { ToolName } from '@canvasync/shared';
import * as DEFAULTS from '@canvasync/shared';

interface JoinRoomModalProps {
  onJoin: (name: string, color: string) => void;
}

const COLORS = [
  '#F87171', '#FB923C', '#FBBF24', '#34D399', 
  '#22D3EE', '#818CF8', '#C084FC', '#F472B6'
];

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ onJoin }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[Math.floor(Math.random() * COLORS.length)]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onJoin(name.trim(), selectedColor);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Join Board</h2>
              <p className="text-sm text-slate-400">Choose how you'll appear to others</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all placeholder:text-slate-500"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Cursor Color
              </label>
              <div className="grid grid-cols-4 gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`h-10 rounded-lg transition-all transform hover:scale-105 ${
                      selectedColor === color 
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' 
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-accent/20 transition-all active:scale-[0.98]"
            >
              Join Board
            </button>
          </form>
        </div>
        
        <div className="bg-slate-800/30 px-8 py-4 border-t border-slate-700/50">
          <p className="text-xs text-center text-slate-500">
            By joining, your cursor and name will be visible to other collaborators.
          </p>
        </div>
      </div>
    </div>
  );
};
