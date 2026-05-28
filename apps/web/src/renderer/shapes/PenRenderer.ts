import { PenShape } from '@canvasync/shared';

export class PenRenderer {
  static draw(ctx: CanvasRenderingContext2D, shape: PenShape) {
    if (shape.points.length < 2) return;

    ctx.beginPath();
    
    const { strokeColor, strokeWidth, strokeStyle, points } = shape;
    
    // Set styles
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (strokeStyle === 'dashed') {
      ctx.setLineDash([10, 5]);
    } else if (strokeStyle === 'dotted') {
      ctx.setLineDash([2, 2]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.moveTo(points[0].x, points[0].y);

    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y);
    } else {
      for (let i = 1; i < points.length - 2; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      
      // For the last 2 points
      ctx.quadraticCurveTo(
        points[points.length - 2].x,
        points[points.length - 2].y,
        points[points.length - 1].x,
        points[points.length - 1].y
      );
    }

    ctx.stroke();
  }
}
