import { create } from 'zustand';
import { Shape } from '@canvasync/shared';
import { SceneGraph } from '../canvas/SceneGraph.js';

interface HistoryState {
  undoStack: Shape[][];
  redoStack: Shape[][];
  canUndo: boolean;
  canRedo: boolean;
  
  recordState: (shapes: Shape[]) => void;
  popUndo: () => void;
  undo: (sceneGraph: SceneGraph) => void;
  redo: (sceneGraph: SceneGraph) => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,

  recordState: (shapes) => {
    const snapshot = JSON.parse(JSON.stringify(shapes));
    set((state) => {
      const newUndoStack = [...state.undoStack, snapshot].slice(-50);
      return {
        undoStack: newUndoStack,
        redoStack: [],
        canUndo: newUndoStack.length > 0,
        canRedo: false,
      };
    });
  },

  popUndo: () => {
    set((state) => {
      const newUndoStack = state.undoStack.slice(0, -1);
      return {
        undoStack: newUndoStack,
        canUndo: newUndoStack.length > 0,
      };
    });
  },

  undo: (sceneGraph) => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return;

    const currentShapes = JSON.parse(JSON.stringify(sceneGraph.getElements()));
    const previousShapes = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    const newRedoStack = [...redoStack, currentShapes];

    set({
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      canUndo: newUndoStack.length > 0,
      canRedo: true,
    });

    sceneGraph.setShapes(previousShapes);
  },

  redo: (sceneGraph) => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) return;

    const currentShapes = JSON.parse(JSON.stringify(sceneGraph.getElements()));
    const nextShapes = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    const newUndoStack = [...undoStack, currentShapes];

    set({
      undoStack: newUndoStack,
      redoStack: newRedoStack,
      canUndo: true,
      canRedo: newRedoStack.length > 0,
    });

    sceneGraph.setShapes(nextShapes);
  },

  clearHistory: () => {
    set({ undoStack: [], redoStack: [], canUndo: false, canRedo: false });
  },
}));
