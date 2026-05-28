import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

const RoomCanvas: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { canvasRef, sceneGraph } = useCanvas();
  const { setRoomId, localUser, setLocalUser } = useRoomStore();
  const activeTool = useCanvasStore((state) => state.activeTool);
  const [showJoin, setShowJoin] = useState(!useRoomStore.getState().localUser);

  useResize(canvasRef);
  useMultiplayer(showJoin ? null : id ?? null, sceneGraph);

  useEffect(() => {
    if (id) setRoomId(id);
    return () => setRoomId(null);
  }, [id, setRoomId]);

  const handleJoin = (name: string, color: string) => {
    setLocalUser({ name, color });
    setShowJoin(false);
  };

  const getCursorClass = () => {
    switch (activeTool) {
      case ToolName.PAN: return 'cursor-grab active:cursor-grabbing';
      case ToolName.PEN: return 'cursor-pen';
      case ToolName.ERASER: return 'cursor-eraser';
      case ToolName.TEXT: return 'cursor-text';
      default: return 'cursor-crosshair';
    }
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${getCursorClass()}`}
      style={{ background: 'var(--bg-primary)' }}>
      <TopBar />
      <StylePanel sceneGraph={sceneGraph} />
      <RoomPanel />

      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none"
        style={{ marginTop: '48px', height: 'calc(100vh - 48px)' }}
      />

      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.2)] z-10" />

      {showJoin && <JoinRoomModal onJoin={handleJoin} />}
    </div>
  );
};

export default RoomCanvas;
