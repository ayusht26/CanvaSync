import React, { useState } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import { Copy, Check, Users, Link2, Share2 } from 'lucide-react';

export const RoomPanel: React.FC = () => {
  const { roomId, collaborators } = useRoomStore();
  const [copied, setCopied] = useState(false);

  if (!roomId) return null;

  const shareUrl = `${window.location.origin}/#/room/${roomId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
      {/* Collaborators List */}
      <div className="flex flex-col gap-2 mb-2 pointer-events-auto">
        {Array.from(collaborators.values()).map((col, idx) => (
          <div 
            key={idx}
            className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-3 py-1.5 rounded-full shadow-lg transition-all animate-in slide-in-from-right-4 duration-300"
          >
            <div 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: col.user.color }} 
            />
            <span className="text-xs font-medium text-slate-200">{col.user.name}</span>
          </div>
        ))}
      </div>

      {/* Share Panel */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden p-4 w-72 pointer-events-auto">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-accent/20 text-accent rounded-lg">
            <Share2 size={16} />
          </div>
          <h3 className="text-sm font-bold text-white">Share Board</h3>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-xl p-1.5 pl-3 mb-4">
          <Link2 size={14} className="text-slate-500 shrink-0" />
          <input 
            type="text" 
            readOnly 
            value={shareUrl}
            className="bg-transparent border-none text-[10px] text-slate-300 focus:outline-none w-full truncate"
          />
          <button 
            onClick={copyLink}
            className={`p-2 rounded-lg transition-all shrink-0 ${
              copied ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium px-1">
          <div className="flex items-center gap-1.5">
            <Users size={12} />
            <span>{collaborators.size} active now</span>
          </div>
          <span>Public board</span>
        </div>
      </div>
    </div>
  );
};
