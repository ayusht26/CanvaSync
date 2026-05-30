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
import { ToolName } from '@canvasync/shared';

const LS_NAME_KEY = 'canvasync-user-name';
const LS_COLOR_KEY = 'canvasync-user-color';

const RoomCanvas: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canvasRef, sceneGraph } = useCanvas();
  const { setRoomId, localUser, setLocalUser } = useRoomStore();
  const activeTool = useCanvasStore((state) => state.activeTool);

  // Check if user already set their identity (from localStorage or in-session)
  const existingName = localStorage.getItem(LS_NAME_KEY);
  const existingColor = localStorage.getItem(LS_COLOR_KEY);

  const [showJoin, setShowJoin] = useState(
    // Show join modal only if no local user identity is available
    !useRoomStore.getState().localUser && !existingName
  );

  useResize(canvasRef);
  useMultiplayer(showJoin ? null : (id ?? null), sceneGraph);

  useEffect(() => {
    if (id) {
      setRoomId(id);
      
      // Fetch room details (name, ownerId) to populate UI
      import('../multiplayer/RoomManager.js').then(({ RoomManager }) => {
        RoomManager.getRoom(id).then((room) => {
          if (room) {
            useRoomStore.getState().setRoomDetails(room.name, room.ownerId);
          }
        });
      });
    }
    return () => {
      setRoomId(null);
      useRoomStore.getState().setRoomDetails(null, null);
    };
  }, [id, setRoomId]);

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
    </div>
  );
};

export default RoomCanvas;
