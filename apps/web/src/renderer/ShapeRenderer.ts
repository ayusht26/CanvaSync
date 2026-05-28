import { Shape } from '@canvasync/shared';
import { RectangleRenderer } from './shapes/RectangleRenderer.js';
import { EllipseRenderer } from './shapes/EllipseRenderer.js';
import { PenRenderer } from './shapes/PenRenderer.js';
import { TriangleRenderer } from './shapes/TriangleRenderer.js';
import { RhombusRenderer } from './shapes/RhombusRenderer.js';
import { LineRenderer } from './shapes/LineRenderer.js';
import { ArrowRenderer } from './shapes/ArrowRenderer.js';
import { TextRenderer } from './shapes/TextRenderer.js';

export class ShapeRenderer {
  static draw(ctx: CanvasRenderingContext2D, shape: Shape) {
    ctx.save();
    ctx.globalAlpha = shape.opacity ?? 1;

    if (shape.type !== 'pen' && shape.type !== 'line' && shape.type !== 'arrow') {
      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate(shape.rotation ?? 0);
      ctx.translate(-cx, -cy);
    }

    switch (shape.type) {
      case 'rectangle': RectangleRenderer.draw(ctx, shape as any); break;
      case 'ellipse':   EllipseRenderer.draw(ctx, shape as any); break;
      case 'pen':       PenRenderer.draw(ctx, shape as any); break;
      case 'triangle':  TriangleRenderer.draw(ctx, shape as any); break;
      case 'rhombus':   RhombusRenderer.draw(ctx, shape as any); break;
      case 'line':      LineRenderer.draw(ctx, shape as any); break;
      case 'arrow':     ArrowRenderer.draw(ctx, shape as any); break;
      case 'text':      TextRenderer.draw(ctx, shape as any); break;
      default:
        console.warn('No renderer for:', (shape as any).type);
    }

    ctx.restore();
  }
}
