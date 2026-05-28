import { RhombusShape } from '@canvasync/shared';

export class RhombusRenderer {
  static draw(ctx: CanvasRenderingContext2D, shape: RhombusShape) {
    const { x, y, width, height, strokeColor, fillColor, strokeWidth, strokeStyle } = shape;
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height / 2);
    ctx.lineTo(x + width / 2, y + height);
    ctx.lineTo(x, y + height / 2);
    ctx.closePath();
    ctx.strokeStyle = strokeColor; ctx.lineWidth = strokeWidth;
    if (strokeStyle === 'dashed') ctx.setLineDash([10,5]);
    else if (strokeStyle === 'dotted') ctx.setLineDash([2,4]);
    else ctx.setLineDash([]);
    if (fillColor !== 'transparent') { ctx.fillStyle = fillColor; ctx.fill(); }
    ctx.stroke();
  }
}
