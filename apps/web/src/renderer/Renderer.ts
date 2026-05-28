import { Camera } from '../canvas/Camera.js';
import { SceneGraph } from '../canvas/SceneGraph.js';
import { TransformUtils } from '../canvas/TransformUtils.js';
import { GridRenderer } from './GridRenderer.js';
import { ShapeRenderer } from './ShapeRenderer.js';
import { CursorRenderer } from './CursorRenderer.js';
import { SelectionRenderer } from './SelectionRenderer.js';
import { useSelectionStore } from '../store/useSelectionStore.js';
import { useCanvasStore } from '../store/useCanvasStore.js';
import { ToolName } from '@canvasync/shared';

export class Renderer {
  // Track mouse position in screen space for eraser cursor
  static mouseScreen = { x: 0, y: 0 };

  static render(
    ctx: CanvasRenderingContext2D, 
    sceneGraph: SceneGraph, 
    camera: Camera,
    collaborators: Map<string, any> = new Map()
  ) {
    const { selectedIds, selectionBox } = useSelectionStore.getState();
    const elements = sceneGraph.getElements();

    // Clear canvas using physical pixels
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Save state before camera transform
    ctx.save();
    
    // Apply Camera Transform
    TransformUtils.applyTransform(ctx, camera);

    // Draw Grid (World Space)
    GridRenderer.render(ctx, camera);

    // Draw Shapes
    for (const shape of elements) {
      ShapeRenderer.draw(ctx, shape);
    }

    // Restore state (remove camera transform)
    ctx.restore();

    // Draw UI Overlays (World Space logic internal to SelectionRenderer)
    SelectionRenderer.draw(ctx, selectedIds, elements, camera, selectionBox);

    // Draw UI Overlays (Screen Space)
    CursorRenderer.draw(ctx, collaborators, camera);

    // Draw eraser cursor overlay
    const { activeTool } = useCanvasStore.getState();
    if (activeTool === ToolName.ERASER) {
      this.drawEraserCursor(ctx, camera);
    }
  }

  private static drawEraserCursor(ctx: CanvasRenderingContext2D, camera: Camera) {
    const eraserSize: number = (window as any).__eraserSize || 20;
    const { x, y } = this.mouseScreen;
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Outer ring (eraser boundary)
    ctx.beginPath();
    ctx.arc(x, y, eraserSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.stroke();

    // Thin dark ring for contrast
    ctx.beginPath();
    ctx.arc(x, y, eraserSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();

    ctx.restore();
  }

  private static renderUI(_ctx: CanvasRenderingContext2D) {
    // UI overlays like selection bounds, handles, etc. go here
  }
}
