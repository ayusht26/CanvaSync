import { RectangleShape } from '@canvasync/shared';

export class RectangleRenderer {
  static draw(ctx: CanvasRenderingContext2D, shape: RectangleShape) {
    ctx.beginPath();
    
    const { x, y, width, height, cornerRadius, strokeColor, fillColor, strokeWidth, strokeStyle } = shape;
    
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

    if (cornerRadius > 0) {
      ctx.roundRect(x, y, width, height, cornerRadius);
    } else {
      ctx.rect(x, y, width, height);
    }

    if (fillColor !== 'transparent') {
      ctx.fill();
    }
    
    if (strokeWidth > 0) {
      ctx.stroke();
    }
  }
}
