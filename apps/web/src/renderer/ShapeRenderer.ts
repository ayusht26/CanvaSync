import { Shape } from '@canvasync/shared';
import { RectangleRenderer } from './shapes/RectangleRenderer.js';
import { EllipseRenderer } from './shapes/EllipseRenderer.js';
import { useCanvasStore } from '../store/useCanvasStore.js';
import { PenRenderer } from './shapes/PenRenderer.js';
import { TriangleRenderer } from './shapes/TriangleRenderer.js';
import { RhombusRenderer } from './shapes/RhombusRenderer.js';
import { LineRenderer } from './shapes/LineRenderer.js';
import { ArrowRenderer } from './shapes/ArrowRenderer.js';
import { TextRenderer } from './shapes/TextRenderer.js';
import { ImageRenderer } from './shapes/ImageRenderer.js';

export class ShapeRenderer {
  static draw(
    ctx: CanvasRenderingContext2D,
    shape: Shape,
    getShapeById?: (id: string) => Shape | undefined
  ) {
    ctx.save();
    ctx.globalAlpha = shape.opacity ?? 1;

    // Resolve adaptive blend color
    const originalStroke = shape.strokeColor;
    const isBlendStroke = originalStroke === 'blend';
    if (isBlendStroke) {
      const theme = useCanvasStore.getState().theme;
      shape.strokeColor = theme === 'dark' ? '#ffffff' : '#09090b';
    }

    const textShape = shape as any;
    const originalTextColor = textShape.textColor;
    const isBlendText = originalTextColor === 'blend';
    if (isBlendText) {
      const theme = useCanvasStore.getState().theme;
      textShape.textColor = theme === 'dark' ? '#ffffff' : '#09090b';
    }

    if (shape.type !== 'pen' && shape.type !== 'line' && shape.type !== 'arrow') {
      const isText = shape.type === 'text';
      const textMeasured = isText ? TextRenderer.measure(shape as any) : null;
      const w = textMeasured ? textMeasured.width : (shape.width || 0);
      const h = textMeasured ? textMeasured.height : (shape.height || 0);

      let shapeY = shape.y;
      if (isText) {
        shapeY += (shape.fontSize || 20) * 0.15;
      }

      const cx = shape.x + w / 2;
      const cy = shapeY + h / 2;
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
      case 'arrow':     ArrowRenderer.draw(ctx, shape as any, getShapeById); break;
      case 'text':      TextRenderer.draw(ctx, shape as any); break;
      case 'image':     ImageRenderer.draw(ctx, shape as any); break;
      default:
        console.warn('No renderer for:', (shape as any).type);
    }

    // Restore original blend color properties
    if (isBlendStroke) {
      shape.strokeColor = originalStroke;
    }
    if (isBlendText) {
      textShape.textColor = originalTextColor;
    }

    ctx.restore();
  }
}
