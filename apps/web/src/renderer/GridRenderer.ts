import { Camera } from '../canvas/Camera.js';
import { useCanvasStore } from '../store/useCanvasStore.js';

export class GridRenderer {
  private static readonly GRID_SIZE  = 40;
  private static readonly MAJOR_GRID = 200;
  private static readonly DOT_SPACING = 40;

  static render(ctx: CanvasRenderingContext2D, camera: Camera) {
    const gridStyle = useCanvasStore.getState().gridStyle;
    if (gridStyle === 'none') return;

    const canvas = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;

    // Visible world bounds
    const left   = -camera.x / camera.zoom;
    const top    = -camera.y / camera.zoom;
    const right  = (W - camera.x) / camera.zoom;
    const bottom = (H - camera.y) / camera.zoom;

    const isDark = document.documentElement.classList.contains('dark');

    ctx.save();

    if (gridStyle === 'grid') {
      this.renderGrid(ctx, camera, left, top, right, bottom, isDark);
    } else if (gridStyle === 'lines') {
      this.renderLines(ctx, camera, left, top, right, bottom, isDark);
    } else if (gridStyle === 'dots') {
      this.renderDots(ctx, camera, left, top, right, bottom, isDark);
    }

    ctx.restore();
  }

  /** Current default: dual minor+major checkered grid */
  private static renderGrid(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    left: number, top: number, right: number, bottom: number,
    isDark: boolean
  ) {
    const minorColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    const majorColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)';

    const minorSize = this.GRID_SIZE;
    const majorSize = this.MAJOR_GRID;

    ctx.lineWidth = 1 / camera.zoom;

    // Minor grid lines
    ctx.strokeStyle = minorColor;
    ctx.beginPath();
    const startX = Math.floor(left / minorSize) * minorSize;
    const startY = Math.floor(top  / minorSize) * minorSize;
    for (let x = startX; x <= right;  x += minorSize) { ctx.moveTo(x, top);  ctx.lineTo(x, bottom); }
    for (let y = startY; y <= bottom; y += minorSize) { ctx.moveTo(left, y); ctx.lineTo(right, y);  }
    ctx.stroke();

    // Major grid lines
    ctx.strokeStyle = majorColor;
    ctx.lineWidth = 1.5 / camera.zoom;
    ctx.beginPath();
    const mStartX = Math.floor(left / majorSize) * majorSize;
    const mStartY = Math.floor(top  / majorSize) * majorSize;
    for (let x = mStartX; x <= right;  x += majorSize) { ctx.moveTo(x, top);  ctx.lineTo(x, bottom); }
    for (let y = mStartY; y <= bottom; y += majorSize) { ctx.moveTo(left, y); ctx.lineTo(right, y);  }
    ctx.stroke();
  }

  /** Ruled notebook lines — horizontal only, evenly spaced */
  private static renderLines(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    left: number, top: number, right: number, bottom: number,
    isDark: boolean
  ) {
    const lineSpacing = this.GRID_SIZE; // 40 world-units
    const majorEvery  = 5;             // every 5th line is slightly bolder

    const faint  = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    const medium = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.11)';

    const startY = Math.floor(top / lineSpacing) * lineSpacing;
    let lineIdx  = Math.round(startY / lineSpacing);

    ctx.beginPath();
    let majorPath = new Path2D();
    let minorPath = new Path2D();

    for (let y = startY; y <= bottom; y += lineSpacing, lineIdx++) {
      if (lineIdx % majorEvery === 0) {
        majorPath.moveTo(left, y);
        majorPath.lineTo(right, y);
      } else {
        minorPath.moveTo(left, y);
        minorPath.lineTo(right, y);
      }
    }

    ctx.lineWidth = 1 / camera.zoom;
    ctx.strokeStyle = faint;
    ctx.stroke(minorPath);

    ctx.lineWidth = 1.5 / camera.zoom;
    ctx.strokeStyle = medium;
    ctx.stroke(majorPath);
  }

  /** Dot grid — like Notion / Miro dot paper */
  private static renderDots(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    left: number, top: number, right: number, bottom: number,
    isDark: boolean
  ) {
    const spacing = this.DOT_SPACING;
    const dotR    = 1.2 / camera.zoom;   // dot radius in world space

    // Only draw dots when reasonably zoomed in (avoid thousands of tiny dots)
    if (dotR * camera.zoom < 0.4) return;

    const color = isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.18)';
    ctx.fillStyle = color;

    const startX = Math.floor(left  / spacing) * spacing;
    const startY = Math.floor(top   / spacing) * spacing;

    ctx.beginPath();
    for (let x = startX; x <= right;  x += spacing) {
      for (let y = startY; y <= bottom; y += spacing) {
        ctx.moveTo(x + dotR, y);
        ctx.arc(x, y, dotR, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }
}
