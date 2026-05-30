import { useEffect } from 'react';
import { useCanvasStore } from '../store/useCanvasStore.js';
import { useSelectionStore } from '../store/useSelectionStore.js';
import { useShapeStore } from '../store/useShapeStore.js';
import { useStyleStore } from '../store/useStyleStore.js';
import { useHistoryStore } from '../store/useHistoryStore.js';
import { ToolName } from '@canvasync/shared';
import { nanoid } from 'nanoid';
import { SceneGraphService } from '../canvas/SceneGraphService.js';
import { TransformUtils } from '../canvas/TransformUtils.js';
import { ShapeFactory } from '../shapes/ShapeFactory.js';

export const useKeyboard = () => {
  const setActiveTool = useCanvasStore((state) => state.setActiveTool);
  const setSpacebarHeld = useCanvasStore((state) => state.setSpacebarHeld);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const selectedIds = useSelectionStore.getState().selectedIds;
      const { elements } = useShapeStore.getState();

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
          if (selectedIds.size > 0) {
            const sg = SceneGraphService.get();
            if (sg) {
              // Record history snapshot before deleting elements!
              useHistoryStore.getState().recordState(sg.getElements());
              selectedIds.forEach((id) => {
                sg.remove(id);
              });
            }
            useSelectionStore.getState().clearSelection();
          }
          break;
        case '[':
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
        if (sg && selectedIds.size > 0) {
          // Record history snapshot before duplicating elements!
          useHistoryStore.getState().recordState(sg.getElements());
          
          const newSelectedIds = new Set<string>();
          selectedIds.forEach((id) => {
            const copy = sg.duplicate(id);
            if (copy) newSelectedIds.add(copy.id);
          });
          
          // Auto-select the duplicated copies
          useSelectionStore.getState().setSelectedIds(newSelectedIds);
        }
      }

      // Ctrl+Z — undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        const sg = SceneGraphService.get();
        if (sg) {
          useHistoryStore.getState().undo(sg);
        }
      }

      // Ctrl+Y / Ctrl+Shift+Z — redo
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        const sg = SceneGraphService.get();
        if (sg) {
          useHistoryStore.getState().redo(sg);
        }
      }
    };

    const up = (e: KeyboardEvent) => {
      if (e.key === ' ') setSpacebarHeld(false);
    };

    const handlePaste = async (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      const sg = SceneGraphService.get();
      if (!sg) return;

      const engine = SceneGraphService.getEngine();
      if (!engine) return;

      const dpr = window.devicePixelRatio || 1;
      const screenCenterX = (engine.canvas.width / dpr) / 2;
      const screenCenterY = (engine.canvas.height / dpr) / 2;
      const worldCenter = TransformUtils.screenToWorld(
        { x: screenCenterX, y: screenCenterY },
        engine.getCamera()
      );

      const style = useStyleStore.getState();

      // Look for an image in the clipboard
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;

          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (!dataUrl) return;

            const img = new Image();
            img.onload = () => {
              // Scale image to fit nicely within a max of 400px (world space)
              let w = img.naturalWidth;
              let h = img.naturalHeight;
              const maxDim = 400;
              if (w > maxDim || h > maxDim) {
                const ratio = Math.min(maxDim / w, maxDim / h);
                w *= ratio;
                h *= ratio;
              }

              const shape = ShapeFactory.createShape('image', worldCenter.x - w / 2, worldCenter.y - h / 2, {
                strokeColor: style.strokeColor,
                fillColor: style.fillColor,
                strokeWidth: style.strokeWidth,
                strokeStyle: style.strokeStyle,
                opacity: style.opacity,
              }) as any;
              shape.width = w;
              shape.height = h;
              shape.dataUrl = dataUrl;

              // Record state before modifications!
              useHistoryStore.getState().recordState(sg.getElements());

              sg.add(shape);

              // Auto-select and activate selection tool
              setActiveTool(ToolName.SELECTION);
              useSelectionStore.getState().setSelectedIds(new Set([shape.id]));

              engine.render();
            };
            img.src = dataUrl;
          };
          reader.readAsDataURL(file);
          return; // Handled image paste
        }
      }

      // If no image, look for text
      const text = e.clipboardData?.getData('text/plain');
      if (text) {
        e.preventDefault();

        // Create text shape centered
        const shape = ShapeFactory.createShape('text', worldCenter.x - 100, worldCenter.y - 20, {
          strokeColor: style.strokeColor,
          fillColor: style.fillColor,
          strokeWidth: style.strokeWidth,
          strokeStyle: style.strokeStyle,
          opacity: style.opacity,
        }) as any;
        shape.content = text;
        shape.width = 200;
        shape.height = 40;

        // Record state before modifications!
        useHistoryStore.getState().recordState(sg.getElements());

        sg.add(shape);

        // Auto-select and activate selection tool
        setActiveTool(ToolName.SELECTION);
        useSelectionStore.getState().setSelectedIds(new Set([shape.id]));

        engine.render();
      }
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('paste', handlePaste);
    };
  }, [setActiveTool, setSpacebarHeld]);
};
