import { create } from 'zustand';
import { ToolName } from '@canvasync/shared';

interface Camera {
  x: number;
  y: number;
  zoom: number;
}

interface CanvasState {
  activeTool: ToolName;
  theme: 'dark' | 'light';
  camera: Camera;
  isSpacebarHeld: boolean;
  
  setActiveTool: (tool: ToolName) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  updateCamera: (camera: Partial<Camera>) => void;
  setSpacebarHeld: (held: boolean) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  activeTool: ToolName.SELECTION,
  theme: 'light',
  camera: { x: 0, y: 0, zoom: 1 },
  isSpacebarHeld: false,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setTheme: (theme) => set({ theme }),
  updateCamera: (cameraUpdate) =>
    set((state) => ({
      camera: { ...state.camera, ...cameraUpdate },
    })),
  setSpacebarHeld: (held) => set({ isSpacebarHeld: held }),
}));
