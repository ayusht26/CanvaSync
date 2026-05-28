import { Shape, Point, BoundingBox } from '@canvasync/shared';

export class HitDetection {
  static isPointInShape(point: Point, shape: Shape): boolean {
    // 1. Rotate the point back by the negative of shape's rotation around shape's center
    const centerX = shape.x + shape.width / 2;
    const centerY = shape.y + shape.height / 2;
    
    const rotatedPoint = this.rotatePoint(point, { x: centerX, y: centerY }, -shape.rotation);

    // 2. Check if the rotated point is inside the axis-aligned bounding box of the shape
    switch (shape.type) {
      case 'rectangle':
      case 'ellipse':
      case 'triangle':
      case 'rhombus':
      case 'text':
        return (
          rotatedPoint.x >= shape.x &&
          rotatedPoint.x <= shape.x + shape.width &&
          rotatedPoint.y >= shape.y &&
          rotatedPoint.y <= shape.y + shape.height
        );
      case 'pen': {
        if (shape.width < 1 && shape.height < 1) return false;
        // Use proximity to any point in the path for pen
        const pts = (shape as any).points as { x: number; y: number }[];
        if (!pts) return false;
        return pts.some(p => Math.hypot(p.x - rotatedPoint.x, p.y - rotatedPoint.y) < 8);
      }
      case 'line':
      case 'arrow': {
        const pts = (shape as any).points as { x: number; y: number }[];
        if (!pts || pts.length < 2) return false;
        return this.isPointNearLine(rotatedPoint, pts[0].x, pts[0].y, pts[1].x, pts[1].y, 8);
      }
      default:
        return false;
    }
  }

  static isRectInShape(rect: BoundingBox, shape: Shape): boolean {
    // Simplified AABB intersection for now
    // In a real app, we'd do SAT (Separating Axis Theorem) for rotated shapes
    const shapeBounds = {
      left: shape.x,
      right: shape.x + shape.width,
      top: shape.y,
      bottom: shape.y + shape.height
    };

    const rectBounds = {
      left: rect.x,
      right: rect.x + rect.width,
      top: rect.y,
      bottom: rect.y + rect.height
    };

    return !(
      rectBounds.left > shapeBounds.right ||
      rectBounds.right < shapeBounds.left ||
      rectBounds.top > shapeBounds.bottom ||
      rectBounds.bottom < shapeBounds.top
    );
  }

  private static rotatePoint(point: Point, center: Point, angle: number): Point {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;

    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    };
  }

  private static isPointNearLine(p: Point, x1: number, y1: number, x2: number, y2: number, threshold: number): boolean {
    const L2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (L2 === 0) return Math.sqrt((p.x - x1) * (p.x - x1) + (p.y - y1) * (p.y - y1)) <= threshold;
    
    let t = ((p.x - x1) * (x2 - x1) + (p.y - y1) * (y2 - y1)) / L2;
    t = Math.max(0, Math.min(1, t));
    
    const projectionX = x1 + t * (x2 - x1);
    const projectionY = y1 + t * (y2 - y1);
    
    const dist = Math.sqrt((p.x - projectionX) * (p.x - projectionX) + (p.y - projectionY) * (p.y - projectionY));
    return dist <= threshold;
  }
}
