import React, { useState, useRef, useEffect } from 'react';
import {
  Share2, ChevronDown, Plus, Minus, Copy, Check,
  MousePointer2, Hand, Pencil, Square, Circle,
  Minus as MinusIcon, ArrowRight, Type, Eraser, Triangle, Diamond,
  Trash2, Crown
} from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore.js';
import { useRoomStore } from '../../store/useRoomStore.js';
import { AnimatedThemeToggler } from './AnimatedThemeToggler.js';
import { ToolName } from '@canvasync/shared';
import { SceneGraphService } from '../../canvas/SceneGraphService.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog.js';
import { BackgroundPicker } from './BackgroundPicker.js';

interface TopBarProps {
  onShareClick?: () => void;
  canvasName?: string;
  onNameChange?: (name: string) => void;
}

const TOOL_GROUPS = [
  [
    { id: ToolName.SELECTION, Icon: MousePointer2, label: 'Select', shortcut: 'V' },
    { id: ToolName.PAN, Icon: Hand, label: 'Pan', shortcut: 'H' },
  ],
  [
    { id: ToolName.PEN, Icon: Pencil, label: 'Pen', shortcut: 'P' },
    { id: ToolName.ERASER, Icon: Eraser, label: 'Eraser', shortcut: 'X' },
  ],
  [
    { id: ToolName.RECTANGLE, Icon: Square, label: 'Rectangle', shortcut: 'R' },
    { id: ToolName.ELLIPSE, Icon: Circle, label: 'Ellipse', shortcut: 'E' },
    { id: ToolName.TRIANGLE, Icon: Triangle, label: 'Triangle', shortcut: 'G' },
    { id: ToolName.RHOMBUS, Icon: Diamond, label: 'Diamond', shortcut: 'D' },
  ],
  [
    { id: ToolName.LINE, Icon: MinusIcon, label: 'Line', shortcut: 'L' },
    { id: ToolName.ARROW, Icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
  ],
  [
    { id: ToolName.TEXT, Icon: Type, label: 'Text', shortcut: 'T' },
  ],
];

export const TopBar: React.FC<TopBarProps> = ({ onShareClick, canvasName = 'Untitled', onNameChange }) => {
  const { camera, updateCamera, activeTool, setActiveTool } = useCanvasStore();
  const { roomId, roomName, ownerId, collaborators } = useRoomStore();
  
  // Use fetched roomName if available, else fallback
  const effectiveName = roomName || canvasName;
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [localName, setLocalName] = useState(effectiveName);
  const [linkCopied, setLinkCopied] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setLocalName(effectiveName); }, [effectiveName]);

  const handleShareOrCopy = () => {
    if (roomId) {
      // In a room: copy the share link
      const shareUrl = `${window.location.origin}/room/${roomId}`;
      navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } else {
      onShareClick?.();
    }
  };

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (localName.trim()) onNameChange?.(localName.trim());
    else setLocalName(canvasName);
  };

  const zoomPct = Math.round(camera.zoom * 100);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center gap-1 px-2"
      style={{
        height: '48px',
        background: 'var(--toolbar-bg)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* LOGO */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm text-white mr-0.5"
        style={{ background: 'var(--accent)', boxShadow: '0 0 12px var(--accent-glow)' }}
      >
        C
      </div>

      {/* BOARD NAME */}
      {isEditingName ? (
        <input
          ref={nameInputRef}
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={handleNameSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleNameSubmit();
            if (e.key === 'Escape') { setIsEditingName(false); setLocalName(canvasName); }
          }}
          className="text-sm font-medium bg-transparent border-b outline-none w-[120px]"
          style={{ color: 'var(--text-primary)', borderColor: 'var(--accent)' }}
          autoFocus
        />
      ) : (
        <button
          onClick={() => { setIsEditingName(true); setTimeout(() => nameInputRef.current?.select(), 10); }}
          className="flex items-center gap-1 text-sm font-medium transition-colors rounded px-1.5 py-0.5 hover:bg-[var(--bg-elevated)] group flex-shrink-0"
          style={{ color: 'var(--text-primary)' }}
        >
          <span className="truncate max-w-[120px]">{localName}</span>
          <ChevronDown size={11} className="opacity-40 group-hover:opacity-70" />
        </button>
      )}

      {roomId && (
        <span
          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)' }}
        >
          LIVE
        </span>
      )}

      {/* VERTICAL DIVIDER */}
      <div className="mx-1 h-6 w-px flex-shrink-0" style={{ background: 'var(--border)' }} />

      {/* TOOL GROUPS */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {TOOL_GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 && (
              <div className="mx-0.5 h-5 w-px" style={{ background: 'var(--border)' }} />
            )}
            {group.map(({ id, Icon, label, shortcut }) => {
              const isActive = activeTool === id;
              return (
                <div key={id} className="relative group">
                  <button
                    onClick={() => setActiveTool(id as ToolName)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-100 active:scale-90"
                    style={{
                      background: isActive ? 'var(--accent)' : 'transparent',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      boxShadow: isActive ? '0 0 10px var(--accent-glow)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-primary)'; }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }
                    }}
                  >
                    <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-[200]">
                    <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)' }}>
                      {label}
                      <kbd className="text-[10px] px-1 py-0.5 rounded"
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {shortcut}
                      </kbd>
                    </div>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* SPACER */}
      <div className="flex-1" />

      {/* ZOOM CONTROLS */}
      <div className="flex items-center gap-0.5 rounded-lg p-0.5 flex-shrink-0" style={{ background: 'var(--bg-elevated)' }}>
        <button
          onClick={() => {
            const newZoom = Math.max(0.05, camera.zoom / 1.25);
            updateCamera({ zoom: newZoom });
            window.dispatchEvent(new CustomEvent('canvas:zoom', { detail: { zoom: newZoom } }));
          }}
          className="w-6 h-6 flex items-center justify-center rounded-md transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          title="Zoom Out (−)"
        >
          <Minus size={12} />
        </button>
        <button
          onClick={() => {
            updateCamera({ zoom: 1, x: 0, y: 0 });
            window.dispatchEvent(new CustomEvent('canvas:zoom', { detail: { zoom: 1, x: 0, y: 0 } }));
          }}
          className="px-2 h-6 text-[11px] font-semibold tabular-nums rounded-md transition-colors"
          style={{ color: 'var(--text-secondary)', minWidth: '44px' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          title="Reset Zoom"
        >
          {zoomPct}%
        </button>
        <button
          onClick={() => {
            const newZoom = Math.min(20, camera.zoom * 1.25);
            updateCamera({ zoom: newZoom });
            window.dispatchEvent(new CustomEvent('canvas:zoom', { detail: { zoom: newZoom } }));
          }}
          className="w-6 h-6 flex items-center justify-center rounded-md transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          title="Zoom In (+)"
        >
          <Plus size={12} />
        </button>
      </div>

      <div className="mx-0.5 h-5 w-px flex-shrink-0" style={{ background: 'var(--border)' }} />

      {/* BACKGROUND PICKER */}
      <BackgroundPicker />



      {/* RESET CANVAS */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all active:scale-95 hover:bg-[var(--bg-elevated)]"
            style={{
              border: '1.5px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            title="Reset Canvas"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset the canvas?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently erase all shapes and drawings on this canvas. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => SceneGraphService.get()?.clear()}
            >
              Reset Canvas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* THEME TOGGLE */}
      <AnimatedThemeToggler
        variant="circle"
        duration={400}
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-elevated)]"
        style={{ color: 'var(--text-secondary)' } as any}
      />

      {/* SHARE / COPY LINK */}
      <button
        onClick={handleShareOrCopy}
        className="flex items-center gap-1.5 text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-all active:scale-95"
        style={{
          background: linkCopied ? 'var(--accent-hover)' : 'var(--accent)',
          boxShadow: '0 2px 8px var(--accent-glow)',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = linkCopied ? 'var(--accent-hover)' : 'var(--accent)')}
        title={roomId ? 'Copy share link' : 'Share & create room'}
      >
        {linkCopied ? <Check size={13} /> : roomId ? <Copy size={13} /> : <Share2 size={13} />}
        <span className="hidden sm:inline">{linkCopied ? 'Copied!' : roomId ? 'Copy Link' : 'Share'}</span>
      </button>
    </div>
  );
};
