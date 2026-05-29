import { create } from 'zustand';
import { ToolName } from '@canvasync/shared';

interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export type GridStyle = 'grid' | 'lines' | 'dots' | 'none';

interface CanvasState {
  activeTool: ToolName;
  theme: 'dark' | 'light';
  gridStyle: GridStyle;
  camera: Camera;
  isSpacebarHeld: boolean;
  
  setActiveTool: (tool: ToolName) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setGridStyle: (style: GridStyle) => void;
  updateCamera: (camera: Partial<Camera>) => void;
  setSpacebarHeld: (held: boolean) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  activeTool: ToolName.SELECTION,
  theme: 'light',
  gridStyle: (localStorage.getItem('canvasync-grid') as GridStyle) || 'grid',
  camera: { x: 0, y: 0, zoom: 1 },
  isSpacebarHeld: false,

  setActiveTool: (tool) => set({ activeTool: tool }),
  setTheme: (theme) => set({ theme }),
  setGridStyle: (gridStyle) => {
    localStorage.setItem('canvasync-grid', gridStyle);
    set({ gridStyle });
  },
  updateCamera: (cameraUpdate) =>
    set((state) => ({
      camera: { ...state.camera, ...cameraUpdate },
    })),
  setSpacebarHeld: (held) => set({ isSpacebarHeld: held }),
}));
