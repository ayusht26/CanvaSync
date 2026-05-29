import { ArrowShape, Shape } from '@canvasync/shared';
import { resolveArrowEndpoints, computeElbowPath, getArrowMidPoint } from '../../canvas/ArrowConnections.js';

const CORNER_RADIUS = 14; // px for elbow corner rounding

export class ArrowRenderer {
  static draw(
    ctx: CanvasRenderingContext2D,
    shape: ArrowShape,
    getShapeById?: (id: string) => Shape | undefined
  ) {
    if (!shape.points || shape.points.length < 2) return;

    // Resolve live endpoints (follows connected shapes)
    const lookup = getShapeById ?? (() => undefined);
    const [p1, p2] = resolveArrowEndpoints(shape, lookup);

    ctx.save();
    ctx.strokeStyle = shape.strokeColor;
    ctx.fillStyle   = shape.strokeColor;
    ctx.lineWidth   = shape.strokeWidth;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    if (shape.strokeStyle === 'dashed')      ctx.setLineDash([10, 5]);
    else if (shape.strokeStyle === 'dotted') ctx.setLineDash([2, 4]);
    else                                     ctx.setLineDash([]);

    const lineStyle = shape.lineStyle ?? 'straight';
    const bend = shape.bend ?? 0;

    if (lineStyle === 'elbow') {
      this.drawElbow(ctx, p1, p2, bend);
    } else {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      if (Math.abs(bend) > 0.1) {
        const mid = getArrowMidPoint(p1, p2, 'straight', bend);
        // For a quadratic bezier, the control point needs to be pulled OUT further 
        // to actually pass through the midpoint handle.
        // A quadratic bezier curve B(t) at t=0.5 is: 0.25*p1 + 0.5*C + 0.25*p2
        // We want B(0.5) = mid. So C = 2*mid - 0.5*p1 - 0.5*p2
        const cx = 2 * mid.x - 0.5 * p1.x - 0.5 * p2.x;
        const cy = 2 * mid.y - 0.5 * p1.y - 0.5 * p2.y;
        ctx.quadraticCurveTo(cx, cy, p2.x, p2.y);
      } else {
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
    }

    // Determine which arrowheads to draw
    const showEnd   = (shape.endArrowHead   ?? (shape.arrowHead === 'arrow' ? 'arrow' : 'none')) === 'arrow';
    const showStart = (shape.startArrowHead ?? 'none') === 'arrow';

    ctx.setLineDash([]);

    if (showEnd) {
      // Calculate angle tangent at the end point
      let angle = 0;
      if (lineStyle === 'elbow') {
        const pts = computeElbowPath(p1, p2, bend);
        const secondToLast = pts[pts.length - 2];
        angle = Math.atan2(p2.y - secondToLast.y, p2.x - secondToLast.x);
      } else if (Math.abs(bend) > 0.1) {
        const mid = getArrowMidPoint(p1, p2, 'straight', bend);
        const cx = 2 * mid.x - 0.5 * p1.x - 0.5 * p2.x;
        const cy = 2 * mid.y - 0.5 * p1.y - 0.5 * p2.y;
        // Derivative of quadratic bezier at t=1 is 2*(p2 - C)
        angle = Math.atan2(p2.y - cy, p2.x - cx);
      } else {
        angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      }
      this.drawArrowhead(ctx, p2, angle, shape.strokeWidth);
    }
    if (showStart) {
      // Calculate angle tangent at the start point
      let angle = 0;
      if (lineStyle === 'elbow') {
        const pts = computeElbowPath(p1, p2, bend);
        const second = pts[1];
        angle = Math.atan2(p1.y - second.y, p1.x - second.x);
      } else if (Math.abs(bend) > 0.1) {
        const mid = getArrowMidPoint(p1, p2, 'straight', bend);
        const cx = 2 * mid.x - 0.5 * p1.x - 0.5 * p2.x;
        const cy = 2 * mid.y - 0.5 * p1.y - 0.5 * p2.y;
        // Derivative of quadratic bezier at t=0 is 2*(C - p1)
        // Since arrowhead points OUT from p1, we want angle from C TO p1
        angle = Math.atan2(p1.y - cy, p1.x - cx);
      } else {
        angle = Math.atan2(p1.y - p2.y, p1.x - p2.x);
      }
      this.drawArrowhead(ctx, p1, angle, shape.strokeWidth);
    }

    ctx.restore();
  }

  private static drawElbow(
    ctx: CanvasRenderingContext2D,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    bend: number = 0
  ) {
    const pts = computeElbowPath(p1, p2, bend);
    const r   = Math.min(CORNER_RADIUS, Math.abs(pts[2].x - pts[1].x) / 2, Math.abs(pts[2].y - pts[1].y) / 2);

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);

    for (let i = 1; i < pts.length - 1; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const next = pts[i + 1];

      const d1 = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      const d2 = Math.hypot(next.x - curr.x, next.y - curr.y);
      const cr  = Math.min(r, d1 / 2, d2 / 2);

      if (cr < 1) {
        ctx.lineTo(curr.x, curr.y);
      } else {
        // Point before corner
        ctx.lineTo(curr.x - cr * (curr.x - prev.x) / d1, curr.y - cr * (curr.y - prev.y) / d1);
        // Rounded corner
        ctx.quadraticCurveTo(
          curr.x, curr.y,
          curr.x + cr * (next.x - curr.x) / d2,
          curr.y + cr * (next.y - curr.y) / d2
        );
      }
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  }

  private static drawArrowhead(
    ctx: CanvasRenderingContext2D,
    tip: { x: number; y: number },
    angle: number,
    sw: number
  ) {
    const headLen = Math.max(10, sw * 4);
    const spread  = Math.PI / 6; // 30°
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x - headLen * Math.cos(angle - spread), tip.y - headLen * Math.sin(angle - spread));
    ctx.lineTo(tip.x - headLen * Math.cos(angle + spread), tip.y - headLen * Math.sin(angle + spread));
    ctx.closePath();
    ctx.fill();
  }
}
