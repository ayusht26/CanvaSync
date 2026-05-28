import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCanvasStore } from '../store/useCanvasStore.js';
import { useShapeStore } from '../store/useShapeStore.js';
import { useCanvas } from '../hooks/useCanvas.js';
import { ToolName } from '@canvasync/shared';
import { TopBar } from '../ui/components/TopBar.js';
import { StylePanel } from '../ui/components/StylePanel.js';
import { CreateRoomModal } from '../ui/components/CreateRoomModal.js';
import { RoomManager } from '../multiplayer/RoomManager.js';
import { useResize } from '../hooks/useResize.js';
import { usePersistence } from '../hooks/usePersistence.js';

const LocalCanvas: React.FC = () => {
  const { canvasRef, sceneGraph } = useCanvas();
  const activeTool = useCanvasStore((state) => state.activeTool);
  const elements = useShapeStore((state) => state.elements);
  const [showShare, setShowShare] = useState(false);
  const [canvasName, setCanvasName] = useState('Untitled');
  const navigate = useNavigate();

  // Handle window resize to keep canvas full-screen
  useResize(canvasRef);
  
  // Handle local persistence
  usePersistence(sceneGraph);

  const getCursorClass = () => {
    switch (activeTool) {
      case ToolName.SELECTION: return 'cursor-default';
      case ToolName.PAN: return 'cursor-grab active:cursor-grabbing';
      case ToolName.PEN: return 'cursor-pen'; // Defined in globals.css
      case ToolName.ERASER: return ''; // Custom circle cursor drawn on canvas
      case ToolName.TEXT: return 'cursor-text';
      default: return 'cursor-crosshair';
    }
  };


  const handleCreateRoom = async ({ name, includeElements }: { name?: string; includeElements: boolean }) => {
    try {
      const roomId = await RoomManager.createRoom(name || canvasName, includeElements ? elements : []);
      setShowShare(false);
      RoomManager.navigateToRoom(roomId, navigate);
    } catch (err) {
      console.error('Failed to create room:', err);
    }
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden ${getCursorClass()}`} style={{ background: 'var(--bg-primary)' }}>
      {/* Unified TopBar (includes tools) */}
      <TopBar
        onShareClick={() => setShowShare(true)}
        canvasName={canvasName}
        onNameChange={setCanvasName}
      />
      <StylePanel sceneGraph={sceneGraph} />

      {/* Main Canvas */}
      <canvas
        ref={canvasRef}
        className="block w-full h-full touch-none"
        style={{
          marginTop: '48px',
          height: 'calc(100vh - 48px)',
          cursor: activeTool === ToolName.ERASER ? 'none' : undefined,
        }}
      />

      {/* Modern Vignette / Edge Effect */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.2)] z-10" />

      {showShare && (
        <CreateRoomModal
          onClose={() => setShowShare(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </div>
  );
};

export default LocalCanvas;
