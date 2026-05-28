import { EllipseShape } from '@canvasync/shared';

export class EllipseRenderer {
  static draw(ctx: CanvasRenderingContext2D, shape: EllipseShape) {
    ctx.beginPath();
    
    const { x, y, width, height, strokeColor, fillColor, strokeWidth, strokeStyle } = shape;
    
    // Set styles
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.fillStyle = fillColor;

    if (strokeStyle === 'dashed') {
      ctx.setLineDash([10, 5]);
    } else if (strokeStyle === 'dotted') {
      ctx.setLineDash([2, 2]);
    } else {
      ctx.setLineDash([]);
    }

    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radiusX = Math.abs(width / 2);
    const radiusY = Math.abs(height / 2);

    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);

    if (fillColor !== 'transparent') {
      ctx.fill();
    }
    
    if (strokeWidth > 0) {
      ctx.stroke();
    }
  }
}
