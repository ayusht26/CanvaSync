import { ArrowShape } from '@canvasync/shared';

export class ArrowRenderer {
  static draw(ctx: CanvasRenderingContext2D, shape: ArrowShape) {
    if (!shape.points || shape.points.length < 2) return;
    const [p1, p2] = shape.points;
    ctx.strokeStyle = shape.strokeColor;
    ctx.fillStyle = shape.strokeColor;
    ctx.lineWidth = shape.strokeWidth;
    ctx.lineCap = 'round';
    if (shape.strokeStyle === 'dashed') ctx.setLineDash([10,5]);
    else if (shape.strokeStyle === 'dotted') ctx.setLineDash([2,4]);
    else ctx.setLineDash([]);

    // Line
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const headLen = Math.max(12, shape.strokeWidth * 4);
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(p2.x - headLen * Math.cos(angle - Math.PI / 6), p2.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(p2.x - headLen * Math.cos(angle + Math.PI / 6), p2.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }
}
