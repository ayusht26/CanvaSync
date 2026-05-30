import { Camera } from './Camera.js';
import { SceneGraph } from './SceneGraph.js';
import { Renderer } from '../renderer/Renderer.js';
import { useRoomStore } from '../store/useRoomStore.js';
import { useCanvasStore } from '../store/useCanvasStore.js';

export class CanvasEngine {
  public readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private sceneGraph: SceneGraph;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver;

  // Problem 5 fix: camera flyover animation state
  private cameraAnimId: number | null = null;

  constructor(canvas: HTMLCanvasElement, camera: Camera, sceneGraph: SceneGraph) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get 2d context');
    this.ctx = context;
    this.camera = camera;
    this.sceneGraph = sceneGraph;

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.canvas);
    this.handleResize();
  }

  private handleResize() {
    const rect = this.canvas.parentElement?.getBoundingClientRect() || this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.render();
  }

  start() {
    if (this.animationFrameId !== null) return;
    const loop = () => {
      this.render();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public render() {
    const collaborators = useRoomStore.getState().collaborators;
    Renderer.render(this.ctx, this.sceneGraph, this.camera, collaborators);
  }

  /**
   * Problem 5 fix: Animate the camera to center on a world-space point.
   * Uses an ease-out-expo curve over `durationMs` milliseconds.
   * Also gently zooms in to a "comfortable" zoom level if currently zoomed out.
   */
  public animateCamera(
    targetWorldX: number,
    targetWorldY: number,
    durationMs = 900
  ) {
    // Cancel any in-flight animation
    if (this.cameraAnimId !== null) {
      cancelAnimationFrame(this.cameraAnimId);
      this.cameraAnimId = null;
    }

    const canvasEl = this.canvas;
    const viewW = canvasEl.offsetWidth;
    const viewH = canvasEl.offsetHeight;

    // Target zoom: zoom in to 1.0 if currently < 0.6, otherwise keep current
    const startZoom = this.camera.zoom;
    const targetZoom = startZoom < 0.6 ? Math.min(1.0, startZoom * 1.8) : startZoom;

    // Target camera offset: center the world point in the viewport
    const targetCamX = viewW / 2 - targetWorldX * targetZoom;
    const targetCamY = viewH / 2 - targetWorldY * targetZoom;

    const startCamX = this.camera.x;
    const startCamY = this.camera.y;

    const startTime = performance.now();

    // Ease-out-expo: feels like a premium "fly to" animation
    const easeOutExpo = (t: number): number =>
      t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const rawT = Math.min(elapsed / durationMs, 1);
      const t = easeOutExpo(rawT);

      this.camera.x = startCamX + (targetCamX - startCamX) * t;
      this.camera.y = startCamY + (targetCamY - startCamY) * t;
      this.camera.zoom = startZoom + (targetZoom - startZoom) * t;

      // Keep Zustand store in sync so TopBar zoom % updates
      useCanvasStore.getState().updateCamera({
        x: this.camera.x,
        y: this.camera.y,
        zoom: this.camera.zoom,
      });

      this.render();

      if (rawT < 1) {
        this.cameraAnimId = requestAnimationFrame(tick);
      } else {
        this.cameraAnimId = null;
      }
    };

    this.cameraAnimId = requestAnimationFrame(tick);
  }

  public getSceneGraph() { return this.sceneGraph; }
  public getCamera() { return this.camera; }

  destroy() {
    this.stop();
    if (this.cameraAnimId !== null) cancelAnimationFrame(this.cameraAnimId);
    this.resizeObserver.disconnect();
  }
}
