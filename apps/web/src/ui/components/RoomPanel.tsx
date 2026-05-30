import React, { useState } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import { Copy, Check, Users, Link2, Share2, ChevronDown, ChevronUp } from 'lucide-react';

export const RoomPanel: React.FC = () => {
  const { roomId, collaborators } = useRoomStore();
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!roomId) return null;

  // BrowserRouter uses /room/:id paths (no # hash)
  const shareUrl = `${window.location.origin}/room/${roomId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const collabList = Array.from(collaborators.values());

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 pointer-events-none">
      {/* Collaborators */}
      {collabList.length > 0 && (
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          {collabList.map((col: any, idx) => (
            <div
              key={col.id || idx}
              className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-3 py-1.5 rounded-full shadow-lg transition-all"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full ring-1 ring-white/20"
                style={{ backgroundColor: col.color || '#888' }}
              />
              <span className="text-xs font-medium text-slate-200">{col.name || 'Anonymous'}</span>
              {/* Pulsing indicator for active collaborators */}
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Share Panel */}
      <div
        className="pointer-events-auto rounded-2xl shadow-2xl overflow-hidden w-72"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.2)', color: 'var(--accent)' }}>
              <Share2 size={14} />
            </div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Share Board</h3>
            {/* Live badge */}
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
            >
              LIVE
            </span>
          </div>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {!collapsed && (
          <div className="px-4 pb-4">
            {/* Link row */}
            <div
              className="flex items-center gap-2 rounded-xl p-1.5 pl-3 mb-3"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <Link2 size={14} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
              <input
                type="text"
                readOnly
                value={shareUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="bg-transparent border-none text-[10px] focus:outline-none w-full truncate"
                style={{ color: 'var(--text-secondary)' }}
              />
              <button
                onClick={copyLink}
                className="p-2 rounded-lg shrink-0 transition-all"
                style={
                  copied
                    ? { background: 'rgba(34,197,94,0.2)', color: '#22c55e' }
                    : { background: 'var(--bg-elevated)', color: 'var(--text-primary)' }
                }
                title="Copy link"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-[10px] px-1" style={{ color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-1.5 font-medium">
                <Users size={11} />
                <span>
                  {collabList.length} collaborator{collabList.length !== 1 ? 's' : ''} online
                </span>
              </div>
              <span className="font-medium">Public board</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
