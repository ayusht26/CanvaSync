import { BaseTool, ToolEvent } from './BaseTool.js';
import { ShapeFactory } from '../shapes/ShapeFactory.js';
import { TextShape } from '@canvasync/shared';
import { TransformUtils } from '../canvas/TransformUtils.js';
import { useCanvasStore } from '../store/useCanvasStore.js';


export const TEXT_FONTS = [
  { id: 'Noto Sans', label: 'Sans', cssFamily: "'Noto Sans', sans-serif" },
  { id: 'Playwrite GB J', label: 'Hand', cssFamily: "'Playwrite GB J', cursive" },
  { id: 'Cascadia Code', label: 'Code', cssFamily: "'Cascadia Code', monospace" },
  { id: 'Roboto', label: 'Roboto', cssFamily: "'Roboto', sans-serif" },
];

export class TextTool extends BaseTool {
  // Drag-to-create textbox
  private isDragging = false;
  private dragStartScreen = { x: 0, y: 0 };
  private dragStartWorld = { x: 0, y: 0 };
  private dragEndScreen = { x: 0, y: 0 };
  private hasMoved = false;

  onPointerDown(e: ToolEvent) {
    this.isDragging = true;
    this.hasMoved = false;
    this.dragStartScreen = { x: e.screenX, y: e.screenY };
    this.dragStartWorld = { x: e.worldX, y: e.worldY };
    this.dragEndScreen = { x: e.screenX, y: e.screenY };
  }

  onPointerMove(e: ToolEvent) {
    if (!this.isDragging) return;
    const dx = e.screenX - this.dragStartScreen.x;
    const dy = e.screenY - this.dragStartScreen.y;
    if (Math.hypot(dx, dy) > 6) {
      this.hasMoved = true;
      this.dragEndScreen = { x: e.screenX, y: e.screenY };
    }
  }

  onPointerUp(e: ToolEvent) {
    if (!this.isDragging) return;
    this.isDragging = false;

    const { sceneGraph, styleStore } = e;
    const styles = styleStore.getState();
    const camera = this.engine.getCamera();

    const fontFamily: string = (window as any).__textFontFamily || 'Playwrite GB J';
    const fontSize: number = (window as any).__textFontSize || 20;
    const textAlign: 'left' | 'center' | 'right' = (window as any).__textAlign || 'left';
    const fontEntry = TEXT_FONTS.find(f => f.id === fontFamily);
    const fontCSS = fontEntry ? fontEntry.cssFamily : "'Playwrite GB J', cursive";

    const shape = ShapeFactory.createShape('text', this.dragStartWorld.x, this.dragStartWorld.y, styles) as TextShape;
    shape.fontSize = fontSize;
    shape.fontFamily = fontFamily;
    shape.textAlign = textAlign;
    shape.content = '';
    shape.textColor = styles.strokeColor;

    let boxWidthScreen: number;
    let boxHeightScreen: number;

    if (this.hasMoved) {
      // Drag mode: use dragged rectangle as textbox
      boxWidthScreen = Math.abs(this.dragEndScreen.x - this.dragStartScreen.x);
      boxHeightScreen = Math.abs(this.dragEndScreen.y - this.dragStartScreen.y);
      shape.width = boxWidthScreen / camera.zoom;
      shape.height = boxHeightScreen / camera.zoom;
    } else {
      // Click mode: use default width, auto-height
      boxWidthScreen = 300 * camera.zoom;
      boxHeightScreen = fontSize * 1.5 * camera.zoom;
      shape.width = 300;
      shape.height = fontSize * 1.5;
    }

    const initialZoom = camera.zoom;

    // Position textarea at screen position
    const screenPos = TransformUtils.worldToScreen(
      { x: this.dragStartWorld.x, y: this.dragStartWorld.y },
      camera
    );
    // Add TopBar(44) + Toolbar(46) offset since canvas is offset
    const canvasEl = document.querySelector('canvas');
    const canvasRect = canvasEl?.getBoundingClientRect();
    const offsetLeft = canvasRect ? canvasRect.left : 0;
    const offsetTop = canvasRect ? canvasRect.top : 0;

    const textarea = document.createElement('textarea');
    textarea.style.cssText = `
      position: fixed;
      left: ${screenPos.x + offsetLeft}px;
      top: ${screenPos.y + offsetTop}px;
      width: ${Math.max(80 * camera.zoom, boxWidthScreen)}px;
      min-height: ${Math.max(fontSize * camera.zoom, boxHeightScreen)}px;
      max-height: ${this.hasMoved ? boxHeightScreen + 'px' : '400px'};
      font-size: ${fontSize * camera.zoom}px;
      font-family: ${fontCSS};
      background: transparent;
      border: none;
      outline: 2px dashed var(--accent);
      outline-offset: 2px;
      resize: none;
      overflow: ${this.hasMoved ? 'auto' : 'hidden'};
      z-index: 9999;
      color: ${styles.strokeColor};
      padding: 4px;
      line-height: 1.5;
      text-align: ${textAlign};
      caret-color: ${styles.strokeColor};
      white-space: pre-wrap;
      word-wrap: break-word;
    `;
    document.body.appendChild(textarea);
    textarea.focus();

    // Auto-resize for click mode
    if (!this.hasMoved) {
      textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      });
    }

    // Dynamic camera tracking for textarea (relative positioning and scaling)
    const unsubscribe = useCanvasStore.subscribe((state) => {
      const currentCamera = state.camera;
      const newScreenPos = TransformUtils.worldToScreen(
        { x: this.dragStartWorld.x, y: this.dragStartWorld.y },
        currentCamera as any
      );
      
      const activeCanvasEl = document.querySelector('canvas');
      const activeCanvasRect = activeCanvasEl?.getBoundingClientRect();
      const currentOffsetLeft = activeCanvasRect ? activeCanvasRect.left : 0;
      const currentOffsetTop = activeCanvasRect ? activeCanvasRect.top : 0;

      textarea.style.left = `${newScreenPos.x + currentOffsetLeft}px`;
      textarea.style.top = `${newScreenPos.y + currentOffsetTop}px`;
      textarea.style.fontSize = `${fontSize * currentCamera.zoom}px`;
      
      const zoomRatio = currentCamera.zoom / initialZoom;
      textarea.style.width = `${Math.max(80 * currentCamera.zoom, boxWidthScreen * zoomRatio)}px`;
      textarea.style.minHeight = `${Math.max(fontSize * currentCamera.zoom, boxHeightScreen * zoomRatio)}px`;
      if (!this.hasMoved) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    });

    let finalized = false;
    const finalize = () => {
      if (finalized) return;
      finalized = true;
      unsubscribe();

      const content = textarea.value.trim();
      if (content) {
        shape.content = content;
        if (!this.hasMoved) {
          // Auto-size based on content
          const lines = content.split('\n');
          const longestLine = Math.max(...lines.map(l => l.length));
          shape.width = Math.max(80, longestLine * fontSize * 0.62);
          shape.height = lines.length * fontSize * 1.5;
        }
        // else keep the dragged dimensions
        sceneGraph.add(shape);
        this.engine.render();
      }
      if (textarea.parentNode) document.body.removeChild(textarea);
    };

    textarea.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { ev.preventDefault(); finalize(); }
      // In drag mode, Enter creates newlines; in click mode, Enter without Shift confirms
      if (ev.key === 'Enter' && !ev.shiftKey && !this.hasMoved) { ev.preventDefault(); finalize(); }
    });
    textarea.addEventListener('blur', finalize);
  }
}
