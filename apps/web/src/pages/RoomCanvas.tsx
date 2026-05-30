import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCanvas } from '../hooks/useCanvas.js';
import { useMultiplayer } from '../hooks/useMultiplayer.js';
import { TopBar } from '../ui/components/TopBar.js';
import { StylePanel } from '../ui/components/StylePanel.js';
import { JoinRoomModal } from '../ui/components/JoinRoomModal.js';
import { RoomPanel } from '../ui/components/RoomPanel.js';
import { useResize } from '../hooks/useResize.js';
import { useRoomStore } from '../store/useRoomStore.js';
import { useCanvasStore } from '../store/useCanvasStore.js';
import { HistoryControls } from '../ui/components/HistoryControls.js';
import { ToolName } from '@canvasync/shared';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog.js';

const LS_NAME_KEY = 'canvasync-user-name';
const LS_COLOR_KEY = 'canvasync-user-color';

const RoomCanvas: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canvasRef, sceneGraph } = useCanvas();
  const { setRoomId, localUser, setLocalUser, localUserId, ownerId, collaborators } = useRoomStore();
  const activeTool = useCanvasStore((state) => state.activeTool);

  const [roomExpired, setRoomExpired] = useState(false);
  const [sessionEndedAlert, setSessionEndedAlert] = useState(false);

  // Check if user already set their identity (from localStorage or in-session)
  const existingName = localStorage.getItem(LS_NAME_KEY);
  const existingColor = localStorage.getItem(LS_COLOR_KEY);

  const [showJoin, setShowJoin] = useState(
    // Show join modal only if no local user identity is available
    !useRoomStore.getState().localUser && !existingName
  );

  useResize(canvasRef);
  const { provider } = useMultiplayer(showJoin ? null : (id ?? null), sceneGraph);

  // ── Fetch room details & validate old/expired link ────────────
  useEffect(() => {
    if (id) {
      setRoomId(id);
      
      // Fetch room details (name, ownerId) to populate UI
      import('../multiplayer/RoomManager.js').then(({ RoomManager }) => {
        RoomManager.getRoom(id).then((room) => {
          if (room) {
            useRoomStore.getState().setRoomDetails(room.name, room.ownerId);
          } else {
            // Room is invalid or expired!
            setRoomExpired(true);
          }
        });
      });
    }
    return () => {
      setRoomId(null);
      useRoomStore.getState().setRoomDetails(null, null);
    };
  }, [id, setRoomId]);

  // ── Sync ownerId from Yjs metadata & listen to sessionEnded ──
  useEffect(() => {
    if (!provider) return;

    const handleMetadataChange = () => {
      const currentOwner = provider.metadata.get('ownerId');
      if (currentOwner) {
        useRoomStore.getState().setRoomDetails(
          useRoomStore.getState().roomName,
          currentOwner
        );
      }

      const sessionEnded = provider.metadata.get('sessionEnded');
      if (sessionEnded?.ended) {
        setSessionEndedAlert(true);
      }
    };

    provider.metadata.observe(handleMetadataChange);
    handleMetadataChange(); // Initial run

    return () => {
      provider.metadata.unobserve(handleMetadataChange);
    };
  }, [provider]);

  // ── Decentralized Takeover elector ────────────────────────────
  useEffect(() => {
    if (!provider || !id || !ownerId) return;

    const onlineUsers = Array.from(collaborators.values()) as any[];
    if (onlineUsers.length === 0) return;

    // Check if the current owner is online
    const isOwnerOnline = onlineUsers.some(u => u.userId === ownerId);
    if (!isOwnerOnline) {
      // Elector: sort candidates by the oldest joinedAt timestamp
      const candidates = onlineUsers
        .filter(u => u.userId && u.joinedAt)
        .sort((a, b) => a.joinedAt - b.joinedAt);

      const oldest = candidates[0];
      if (oldest && oldest.userId === localUserId) {
        console.log(`[Takeover] Current owner ${ownerId} is offline. We are the oldest collaborator. Taking over room ownership.`);
        provider.metadata.set('ownerId', localUserId);
      }
    }
  }, [collaborators, ownerId, provider, id, localUserId]);

  // Auto-restore user identity from localStorage if available (skip join modal)
  useEffect(() => {
    if (!useRoomStore.getState().localUser && existingName && existingColor) {
      setLocalUser({ name: existingName, color: existingColor });
      setShowJoin(false);
    }
  }, [existingName, existingColor, setLocalUser]);

  const handleJoin = (name: string, color: string) => {
    setLocalUser({ name, color });
    setShowJoin(false);
  };

  const getCursorClass = () => {
    switch (activeTool) {
      case ToolName.SELECTION: return 'cursor-default';
      case ToolName.PAN: return 'cursor-grab active:cursor-grabbing';
      case ToolName.PEN: return 'cursor-pen';
      case ToolName.ERASER: return 'cursor-none';
      case ToolName.TEXT: return 'cursor-text';
      default: return 'cursor-crosshair';
    }
  };

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden ${getCursorClass()}`}
      style={{ background: 'var(--bg-primary)' }}
    >
      <TopBar />
      <StylePanel sceneGraph={sceneGraph} />
      <RoomPanel />
      <HistoryControls />

      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none"
        style={{
          marginTop: '48px',
          height: 'calc(100vh - 48px)',
          cursor: activeTool === ToolName.ERASER ? 'none' : undefined,
        }}
      />

      {/* Edge vignette effect */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.2)] z-10" />

      {showJoin && <JoinRoomModal onJoin={handleJoin} />}

      {/* ROOM EXPIRED ALERT MODAL overlay */}
      <AlertDialog open={roomExpired} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Room Expired or Invalid Link</AlertDialogTitle>
            <AlertDialogDescription>
              This room has expired due to inactivity, or the link is invalid. Please join a valid room or create a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setRoomExpired(false);
                navigate('/');
              }}
            >
              Return to Local Board
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SESSION ENDED ALERT MODAL overlay */}
      <AlertDialog open={sessionEndedAlert} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Session Ended</AlertDialogTitle>
            <AlertDialogDescription>
              The multiplayer session has been ended by the room owner. You will now return to your original canvas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setSessionEndedAlert(false);
                navigate('/');
              }}
            >
              Return to Canvas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RoomCanvas;

