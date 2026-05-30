import React, { useState } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { Copy, Check, Users, Link2, Share2, ChevronDown, ChevronUp, Crown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { SceneGraphService } from '../../canvas/SceneGraphService.js';
import { useNavigate } from 'react-router-dom';
import { openDB } from 'idb';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog.js';

export const RoomPanel: React.FC = () => {
  const { roomId, ownerId, collaborators, localUserId, provider } = useRoomStore();
  const { updateCamera } = useCanvasStore();
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const navigate = useNavigate();

  if (!roomId) return null;

  const shareUrl = `${window.location.origin}/room/${roomId}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const collabList = Array.from(collaborators.values());

  const jumpToUser = (user: any) => {
    if (!user.cursor) return;

    const engine = SceneGraphService.getEngine();
    if (!engine) return;

    // Problem 5 fix: use CanvasEngine.animateCamera() — proper rAF loop
    // with ease-out-expo, syncs camera class AND Zustand store every frame
    engine.animateCamera(user.cursor.x, user.cursor.y, 900);
  };

  const handleEndSessionKeepCanvas = async () => {
    setShowEndDialog(false);
    
    // Copy the multiplayer board shapes to local IndexedDB before redirect
    try {
      const shapes = SceneGraphService.get()?.getElements() || [];
      const db = await openDB('canvasync-db', 1);
      await db.put('local-canvas', shapes, 'shapes');
      console.log('[RoomPanel] Successfully cloned multiplayer elements to local IndexedDB.');
    } catch (err) {
      console.error('[RoomPanel] Failed to save board locally:', err);
    }

    if (provider) {
      provider.metadata.set('sessionEnded', { ended: true });
    }

    // Call DELETE to clean up the room backend immediately
    if (roomId) {
      const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';
      fetch(`${baseUrl}/rooms/${roomId}`, { method: 'DELETE' }).catch(console.error);
    }

    navigate('/');
  };

  const handleEndSessionNewCanvas = () => {
    setShowEndDialog(false);

    if (provider) {
      provider.metadata.set('sessionEnded', { ended: true });
    }

    // Call DELETE to clean up the room backend immediately
    if (roomId) {
      const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';
      fetch(`${baseUrl}/rooms/${roomId}`, { method: 'DELETE' }).catch(console.error);
    }

    navigate('/');
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 pointer-events-none" style={{ fontFamily: 'Geist, sans-serif' }}>
      <motion.div
        layout
        className="pointer-events-auto rounded-2xl shadow-2xl overflow-hidden w-72"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          backdropFilter: 'blur(24px) saturate(150%)',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
        }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
          onClick={() => setCollapsed(c => !c)}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg" style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 0 10px var(--accent-glow)' }}>
              <Share2 size={14} strokeWidth={2.5} />
            </div>
            <h3 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Share Board</h3>
            {/* Live badge */}
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}
            >
              LIVE
            </span>
          </div>
          <button
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="px-4 pb-4">
                {/* Link row */}
                <div
                  className="flex items-center gap-2 rounded-xl p-1.5 pl-3 mb-3"
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  <Link2 size={14} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="bg-transparent border-none text-[11px] font-medium focus:outline-none w-full truncate"
                    style={{ color: 'var(--text-secondary)' }}
                  />
                  <button
                    onClick={copyLink}
                    className="p-2 rounded-lg shrink-0 transition-all active:scale-95"
                    style={
                      copied
                        ? { background: 'rgba(34,197,94,0.2)', color: '#22c55e' }
                        : { background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }
                    }
                    title="Copy link"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>

                {/* Stats / Toggle Users */}
                <div 
                  className="flex items-center justify-between text-[11px] px-1 cursor-pointer group" 
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => setShowUsers(s => !s)}
                >
                  <div className="flex items-center gap-1.5 font-medium group-hover:text-[var(--text-primary)] transition-colors">
                    <Users size={12} />
                    <span>
                      {collabList.length} collaborator{collabList.length !== 1 ? 's' : ''} online
                    </span>
                    {showUsers ? <ChevronUp size={12} className="opacity-50" /> : <ChevronDown size={12} className="opacity-50" />}
                  </div>
                  <span className="font-medium">Public board</span>
                </div>

                {/* Expandable User List */}
                <AnimatePresence>
                  {showUsers && (
                    <motion.div
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                        {collabList.map((col: any) => {
                          const isOwner = col.userId && ownerId && col.userId === ownerId;
                          return (
                            <div
                              key={col.id}
                              onClick={() => jumpToUser(col)}
                              className="flex items-center gap-3 px-2.5 py-2 rounded-lg cursor-pointer transition-colors hover:bg-[var(--bg-elevated)] group border border-transparent hover:border-[var(--border)]"
                            >
                              <div className="relative">
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-[var(--bg-surface)]"
                                  style={{ backgroundColor: col.color || '#888' }}
                                >
                                  {(col.name || 'A').charAt(0).toUpperCase()}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 border-2 border-[var(--bg-surface)]" />
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
                                  <span className="truncate">{col.name || 'Anonymous'}</span>
                                  {col.isLocal && <span className="text-[10px] font-medium text-[var(--text-muted)]">(You)</span>}
                                  {isOwner && (
                                    <span title="Room Owner" className="flex items-center ml-auto">
                                      <Crown size={12} className="text-amber-500" strokeWidth={2.5} />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Owner End Room Session Button */}
                {localUserId === ownerId && (
                  <div className="mt-4 pt-3.5 border-t" style={{ borderColor: 'var(--border)' }}>
                    <button
                      onClick={() => setShowEndDialog(true)}
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                      style={{
                        background: 'rgba(239, 68, 68, 0.9)',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgb(220, 38, 38)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'}
                    >
                      End Room Session
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* END SESSION CONFIRMATION ALERT DIALOG */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Room Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end the multiplayer session and disconnect all participants. Choose how you would like to continue:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-center w-full">
            <AlertDialogCancel onClick={() => setShowEndDialog(false)} className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
              <button
                onClick={handleEndSessionNewCanvas}
                className="alert-dialog-btn alert-dialog-btn-cancel sm:ml-2 w-full sm:w-auto py-2 px-3.5 rounded-lg text-xs font-semibold hover:bg-[var(--bg-elevated)] transition-colors"
                style={{ border: '1px solid var(--border)', color: 'var(--text-primary)', background: 'transparent' }}
              >
                Discard & Exit
              </button>
              
              <button
                onClick={handleEndSessionKeepCanvas}
                className="alert-dialog-btn alert-dialog-btn-action w-full sm:w-auto py-2 px-3.5 rounded-lg text-xs font-semibold text-white transition-colors"
                style={{ background: 'var(--accent)' }}
              >
                Keep Board (Use Locally)
              </button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

