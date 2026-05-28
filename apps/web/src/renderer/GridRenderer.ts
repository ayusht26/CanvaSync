import { Camera } from '../canvas/Camera.js';

export class GridRenderer {
  private static readonly GRID_SIZE = 40;
  private static readonly MAJOR_GRID = 200;

  static render(ctx: CanvasRenderingContext2D, camera: Camera) {
    const canvas = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;

    // Visible world bounds
    const left   = -camera.x / camera.zoom;
    const top    = -camera.y / camera.zoom;
    const right  = (W - camera.x) / camera.zoom;
    const bottom = (H - camera.y) / camera.zoom;

    const minorSize = this.GRID_SIZE;
    const majorSize = this.MAJOR_GRID;

    // Detect theme
    const isDark = document.documentElement.classList.contains('dark');
    const minorColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    const majorColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)';

    ctx.save();
    ctx.lineWidth = 1 / camera.zoom;

    // Minor grid lines
    ctx.strokeStyle = minorColor;
    ctx.beginPath();
    const startX = Math.floor(left / minorSize) * minorSize;
    const startY = Math.floor(top / minorSize) * minorSize;
    for (let x = startX; x <= right; x += minorSize) {
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
    }
    for (let y = startY; y <= bottom; y += minorSize) {
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();

    // Major grid lines
    ctx.strokeStyle = majorColor;
    ctx.lineWidth = 1.5 / camera.zoom;
    ctx.beginPath();
    const mStartX = Math.floor(left / majorSize) * majorSize;
    const mStartY = Math.floor(top / majorSize) * majorSize;
    for (let x = mStartX; x <= right; x += majorSize) {
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
    }
    for (let y = mStartY; y <= bottom; y += majorSize) {
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();

    ctx.restore();
  }
}
