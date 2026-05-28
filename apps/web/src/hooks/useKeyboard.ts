import { useEffect } from 'react';
import { useCanvasStore } from '../store/useCanvasStore.js';
import { useSelectionStore } from '../store/useSelectionStore.js';
import { useShapeStore } from '../store/useShapeStore.js';
import { ToolName } from '@canvasync/shared';
import { nanoid } from 'nanoid';
import { SceneGraphService } from '../canvas/SceneGraphService.js';

export const useKeyboard = () => {
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);
  const setSpacebarHeld = useCanvasStore((state) => state.setSpacebarHeld);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const selectedIds = useSelectionStore.getState().selectedIds;
      const { removeShape, addShape, elements } = useShapeStore.getState();

      switch (e.key.toLowerCase()) {
        case 'v': setActiveTool(ToolName.SELECTION); break;
        case 'h': setActiveTool(ToolName.PAN); break;
        case 'p': setActiveTool(ToolName.PEN); useSelectionStore.getState().clearSelection(); break;
        case 'r': setActiveTool(ToolName.RECTANGLE); useSelectionStore.getState().clearSelection(); break;
        case 'e': setActiveTool(ToolName.ELLIPSE); useSelectionStore.getState().clearSelection(); break;
        case 'g': setActiveTool(ToolName.TRIANGLE); useSelectionStore.getState().clearSelection(); break;
        case 'd': if (!e.ctrlKey && !e.metaKey) { setActiveTool(ToolName.RHOMBUS); useSelectionStore.getState().clearSelection(); } break;
        case 'l': setActiveTool(ToolName.LINE); useSelectionStore.getState().clearSelection(); break;
        case 'a': if (!e.ctrlKey && !e.metaKey) { setActiveTool(ToolName.ARROW); useSelectionStore.getState().clearSelection(); } break;
        case 't': setActiveTool(ToolName.TEXT); useSelectionStore.getState().clearSelection(); break;
        case 'x': setActiveTool(ToolName.ERASER); useSelectionStore.getState().clearSelection(); break;
        case ' ': e.preventDefault(); setSpacebarHeld(true); break;
        case 'escape':
          useSelectionStore.getState().clearSelection();
          setActiveTool(ToolName.SELECTION);
          break;
        case 'delete':
        case 'backspace':
          selectedIds.forEach((id) => {
            // Route through SceneGraph (source of truth), not just Zustand store
            SceneGraphService.remove(id);
          });
          useSelectionStore.getState().clearSelection();
          break;
        case '[':
          // send backward — handled via sceneGraph directly; emit custom event
          window.dispatchEvent(new CustomEvent('canvas:layer', { detail: { action: 'backward' } }));
          break;
        case ']':
          window.dispatchEvent(new CustomEvent('canvas:layer', { detail: { action: 'forward' } }));
          break;
      }

      // Ctrl+A — select all
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const allIds = new Set(elements.map(s => s.id));
        useSelectionStore.getState().setSelectedIds(allIds);
      }

      // Ctrl+D — duplicate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const sg = SceneGraphService.get();
        selectedIds.forEach((id) => {
          if (sg) {
            sg.duplicate(id);
          } else {
            // fallback to store
            const shape = elements.find(s => s.id === id);
            if (!shape) return;
            const copy = { ...shape, id: nanoid(), x: shape.x + 20, y: shape.y + 20, createdAt: Date.now(), updatedAt: Date.now() };
            addShape(copy as any);
          }
        });
      }

      // Ctrl+Z — undo (stub — wire to useHistoryStore)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        // TODO: useHistoryStore.getState().undo()
      }

      // Ctrl+Shift+Z — redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault();
        // TODO: useHistoryStore.getState().redo()
      }
    };

    const up = (e: KeyboardEvent) => {
      if (e.key === ' ') setSpacebarHeld(false);
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [setActiveTool, setSpacebarHeld]);
};
