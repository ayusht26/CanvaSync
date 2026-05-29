import { Shape } from '@canvasync/shared';
import { Camera } from '../canvas/Camera.js';
import { Anchor, getShapeConnectionPoint } from '../canvas/ArrowConnections.js';

/**
 * Draws the snap-to-shape overlay when the Arrow tool is active.
 * Called from Renderer in world-space (after camera transform is applied).
 */
export class ArrowHoverOverlay {
  /** The shape currently being hovered (set by ArrowTool) */
  static hoveredShapeId: string | null = null;
  /** Nearest anchor on the hovered shape (set by ArrowTool) */
  static nearestAnchor: Anchor | null = null;

  static draw(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    shapes: Shape[]
  ) {
    if (!this.hoveredShapeId) return;

    const shape = shapes.find(s => s.id === this.hoveredShapeId);
    if (!shape) return;

    const isDark = document.documentElement.classList.contains('dark');
    const accentColor = '#6366f1';
    const glowAlpha   = isDark ? 0.6 : 0.5;

    ctx.save();

    // 1. Draw accent glow outline around the shape
    ctx.strokeStyle = accentColor;
    ctx.lineWidth   = 2 / camera.zoom;
    ctx.globalAlpha = glowAlpha;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur  = 8 / camera.zoom;
    ctx.setLineDash([]);

    this.strokeShapeOutline(ctx, shape, camera);

    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;

    // 2. Draw a single snap anchor dot at the closest point
    if (this.nearestAnchor) {
      const { x, y } = getShapeConnectionPoint(shape, this.nearestAnchor);
      const dotR = 6 / camera.zoom;
      
      ctx.beginPath();
      ctx.arc(x, y, dotR, 0, Math.PI * 2);
      ctx.fillStyle   = accentColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = 1.5 / camera.zoom;
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  private static strokeShapeOutline(
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    camera: Camera
  ) {
    const { x, y, width: w, height: h } = shape;

    switch (shape.type) {
      case 'ellipse': {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'triangle': {
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case 'rhombus': {
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h / 2);
        ctx.lineTo(x + w / 2, y + h);
        ctx.lineTo(x, y + h / 2);
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case 'text': {
        const cr = 6 / camera.zoom;
        ctx.beginPath();
        ctx.roundRect(x - cr, y - cr, w + cr * 2, h + cr * 2, cr);
        ctx.stroke();
        break;
      }
      default: {
        // Rectangle and everything else: rounded rect
        const cr = Math.min(8 / camera.zoom, (w / 2), (h / 2));
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, cr);
        ctx.stroke();
        break;
      }
    }
  }
}
