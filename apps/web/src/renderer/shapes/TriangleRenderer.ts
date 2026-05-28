import { TriangleShape } from '@canvasync/shared';

export class TriangleRenderer {
  static draw(ctx: CanvasRenderingContext2D, shape: TriangleShape) {
    const { x, y, width, height, strokeColor, fillColor, strokeWidth, strokeStyle } = shape;
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    applyStroke(ctx, strokeColor, strokeWidth, strokeStyle);
    if (fillColor !== 'transparent') { ctx.fillStyle = fillColor; ctx.fill(); }
    ctx.stroke();
  }
}

function applyStroke(ctx: CanvasRenderingContext2D, color: string, width: number, style: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (style === 'dashed') ctx.setLineDash([10, 5]);
  else if (style === 'dotted') ctx.setLineDash([2, 4]);
  else ctx.setLineDash([]);
}
