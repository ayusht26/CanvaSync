import { LineShape } from '@canvasync/shared';

export class LineRenderer {
  static draw(ctx: CanvasRenderingContext2D, shape: LineShape) {
    if (!shape.points || shape.points.length < 2) return;
    const [p1, p2] = shape.points;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = shape.strokeColor;
    ctx.lineWidth = shape.strokeWidth;
    ctx.lineCap = 'round';
    if (shape.strokeStyle === 'dashed') ctx.setLineDash([10,5]);
    else if (shape.strokeStyle === 'dotted') ctx.setLineDash([2,4]);
    else ctx.setLineDash([]);
    ctx.stroke();
  }
}
