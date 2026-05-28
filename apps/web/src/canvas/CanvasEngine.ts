import { Camera } from './Camera';
import { SceneGraph } from './SceneGraph';
import { Renderer } from '../renderer/Renderer';

export class CanvasEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private camera: Camera;
  private sceneGraph: SceneGraph;
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver;

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
    
    // The canvas style width/height should be set to match the logical size
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
    Renderer.render(this.ctx, this.sceneGraph, this.camera);
  }

  public getSceneGraph() {
    return this.sceneGraph;
  }

  public getCamera() {
    return this.camera;
  }

  destroy() {
    this.stop();
    this.resizeObserver.disconnect();
  }
}
