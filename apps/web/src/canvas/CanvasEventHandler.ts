import { CanvasEngine } from './CanvasEngine.js';
import { Camera } from './Camera.js';
import { SceneGraph } from './SceneGraph.js';
import { TransformUtils } from './TransformUtils.js';
import { ToolManager } from '../tools/ToolManager.js';
import { ToolEvent } from '../tools/BaseTool.js';
import { useCanvasStore } from '../store/useCanvasStore.js';
import { useSelectionStore } from '../store/useSelectionStore.js';
import { useStyleStore } from '../store/useStyleStore.js';
import { useRoomStore } from '../store/useRoomStore.js';
import { Renderer } from '../renderer/Renderer.js';

export class CanvasEventHandler {
  private canvas: HTMLCanvasElement;
  private engine: CanvasEngine;
  private camera: Camera;
  private sceneGraph: SceneGraph;
  private toolManager: ToolManager;
  private isMiddlePanning = false;
  private middlePanLast = { x: 0, y: 0 };

  // Problem 3 fix: pending cursor world position for rAF flush
  private pendingCursorWorld: { x: number; y: number } | null = null;
  private cursorRafId: number | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    engine: CanvasEngine,
    camera: Camera,
    sceneGraph: SceneGraph,
    toolManager: ToolManager
  ) {
    this.canvas = canvas;
    this.engine = engine;
    this.camera = camera;
    this.sceneGraph = sceneGraph;
    this.toolManager = toolManager;
    this.setupListeners();
  }

  private setupListeners() {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public cleanup() {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    if (this.cursorRafId !== null) {
      cancelAnimationFrame(this.cursorRafId);
      this.cursorRafId = null;
    }
  }

  private createToolEvent(e: PointerEvent): ToolEvent {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPoint = TransformUtils.screenToWorld({ x: screenX, y: screenY }, this.camera);
    return {
      screenX,
      screenY,
      worldX: worldPoint.x,
      worldY: worldPoint.y,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey || e.metaKey,
      pressure: e.pressure,
      sceneGraph: this.sceneGraph,
      selectionStore: useSelectionStore,
      canvasStore: useCanvasStore,
      styleStore: useStyleStore,
    };
  }

  // Problem 3 fix: rAF-based cursor broadcast — called once per animation frame
  private scheduleCursorFlush(worldX: number, worldY: number) {
    this.pendingCursorWorld = { x: worldX, y: worldY };
    if (this.cursorRafId !== null) return; // already scheduled
    this.cursorRafId = requestAnimationFrame(() => {
      this.cursorRafId = null;
      if (!this.pendingCursorWorld) return;
      const presenceManager = useRoomStore.getState().presenceManager;
      if (presenceManager) {
        presenceManager.updateCursor(
          this.pendingCursorWorld.x,
          this.pendingCursorWorld.y
        );
      }
      this.pendingCursorWorld = null;
    });
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      this.isMiddlePanning = true;
      this.middlePanLast = { x: e.clientX, y: e.clientY };
      this.canvas.setPointerCapture(e.pointerId);
      return;
    }
    this.canvas.setPointerCapture(e.pointerId);
    const toolEvent = this.createToolEvent(e);
    const activeTool = this.toolManager.getActiveTool();
    if (activeTool) activeTool.onPointerDown(toolEvent);
  };

  private handlePointerMove = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    Renderer.mouseScreen = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    if (this.isMiddlePanning) {
      const dx = e.clientX - this.middlePanLast.x;
      const dy = e.clientY - this.middlePanLast.y;
      this.middlePanLast = { x: e.clientX, y: e.clientY };
      this.camera.panBy(dx, dy);
      useCanvasStore.getState().updateCamera({ x: this.camera.x, y: this.camera.y, zoom: this.camera.zoom });
      this.engine.render();
      return;
    }

    const toolEvent = this.createToolEvent(e);

    // Problem 3 fix: schedule cursor broadcast via rAF (max 60fps, non-blocking)
    this.scheduleCursorFlush(toolEvent.worldX, toolEvent.worldY);

    const activeTool = this.toolManager.getActiveTool();
    if (activeTool) activeTool.onPointerMove(toolEvent);
    this.engine.render();
  };

  private handlePointerUp = (e: PointerEvent) => {
    this.canvas.releasePointerCapture(e.pointerId);
    if (e.button === 1) {
      this.isMiddlePanning = false;
      return;
    }
    const toolEvent = this.createToolEvent(e);
    const activeTool = this.toolManager.getActiveTool();
    if (activeTool) activeTool.onPointerUp(toolEvent);
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (e.ctrlKey || e.metaKey) {
      let normalizedDelta = e.deltaY;
      if (e.deltaMode === 1) normalizedDelta *= 16;
      if (e.deltaMode === 2) normalizedDelta *= 400;
      const zoomFactor = Math.pow(0.999, normalizedDelta);
      this.camera.zoomAt(screenX, screenY, zoomFactor);
    } else {
      this.camera.panBy(-e.deltaX, -e.deltaY);
    }

    useCanvasStore.getState().updateCamera({
      x: this.camera.x,
      y: this.camera.y,
      zoom: this.camera.zoom,
    });
    this.engine.render();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    const activeTool = this.toolManager.getActiveTool();
    if (activeTool && activeTool.onKeyDown) activeTool.onKeyDown(e);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const activeTool = this.toolManager.getActiveTool();
    if (activeTool && activeTool.onKeyUp) activeTool.onKeyUp(e);
  };
}
