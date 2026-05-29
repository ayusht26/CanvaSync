import { Shape, ArrowShape, Point } from '@canvasync/shared';

export interface Anchor {
  rx: number; // 0-1 relative x on shape bounding box
  ry: number; // 0-1 relative y on shape bounding box
}

/** Convert a 0-1 anchor to world coordinates on a shape */
export function getShapeConnectionPoint(shape: Shape, anchor: Anchor): Point {
  return {
    x: shape.x + anchor.rx * shape.width,
    y: shape.y + anchor.ry * shape.height,
  };
}

function getClosestPointOnSegment(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return a;
  
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  
  return {
    x: a.x + t * dx,
    y: a.y + t * dy
  };
}

function getClosestPointOnPolygon(world: Point, vertices: Point[]): Point {
  let closest = vertices[0];
  let minDist = Infinity;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    const cp = getClosestPointOnSegment(world, a, b);
    const dist = Math.hypot(world.x - cp.x, world.y - cp.y);
    if (dist < minDist) {
      minDist = dist;
      closest = cp;
    }
  }
  return closest;
}

/** 
 * Given a world point near a shape, compute the nearest continuous point on its perimeter. 
 * Returns the anchor as { rx, ry } where rx, ry are 0-1 values relative to the shape's bounds.
 */
export function getNearestAnchorOnShape(shape: Shape, world: Point): Anchor {
  const { x, y, width: w, height: h } = shape;
  
  if (shape.type === 'ellipse') {
    // For an ellipse, calculate angle from center and find point on circumference
    const cx = x + w / 2;
    const cy = y + h / 2;
    const angle = Math.atan2(world.y - cy, world.x - cx);
    // Point on ellipse perimeter relative to center
    const dx = (w / 2) * Math.cos(angle);
    const dy = (h / 2) * Math.sin(angle);
    
    // Map back to 0-1
    return {
      rx: (cx + dx - x) / w,
      ry: (cy + dy - y) / h,
    };
  } else if (shape.type === 'triangle' || shape.type === 'rhombus') {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const vertices = shape.type === 'triangle'
      ? [
          { x: cx, y }, 
          { x: x + w, y: y + h }, 
          { x, y: y + h }
        ]
      : [
          { x: cx, y }, 
          { x: x + w, y: cy }, 
          { x: cx, y: y + h }, 
          { x, y: cy }
        ];
    
    const cp = getClosestPointOnPolygon(world, vertices);
    return {
      rx: w === 0 ? 0.5 : (cp.x - x) / w,
      ry: h === 0 ? 0.5 : (cp.y - y) / h,
    };
  }

  // For rectangles, text, etc. snap to nearest edge on bounding box
  // Clamp world point to bounding box first
  const clampedX = Math.max(x, Math.min(x + w, world.x));
  const clampedY = Math.max(y, Math.min(y + h, world.y));

  // If point is inside, push it to the nearest edge
  const dl = Math.abs(clampedX - x);
  const dr = Math.abs((x + w) - clampedX);
  const dt = Math.abs(clampedY - y);
  const db = Math.abs((y + h) - clampedY);
  
  let edgeX = clampedX;
  let edgeY = clampedY;

  const minD = Math.min(dl, dr, dt, db);
  if (minD === dl) edgeX = x;
  else if (minD === dr) edgeX = x + w;
  else if (minD === dt) edgeY = y;
  else if (minD === db) edgeY = y + h;

  return {
    rx: w === 0 ? 0.5 : (edgeX - x) / w,
    ry: h === 0 ? 0.5 : (edgeY - y) / h,
  };
}

/**
 * Resolve the actual start/end world points for an arrow.
 * If connected to shapes, computes from anchor + current shape position.
 * Falls back to shape.points otherwise.
 */
export function resolveArrowEndpoints(
  arrow: ArrowShape,
  getShapeById: (id: string) => Shape | undefined
): [Point, Point] {
  const [rawP1, rawP2] = arrow.points;

  let p1: Point = rawP1;
  let p2: Point = rawP2;

  if (arrow.startShapeId && arrow.startAnchor) {
    const src = getShapeById(arrow.startShapeId);
    if (src) p1 = getShapeConnectionPoint(src, arrow.startAnchor);
  }

  if (arrow.endShapeId && arrow.endAnchor) {
    const dst = getShapeById(arrow.endShapeId);
    if (dst) p2 = getShapeConnectionPoint(dst, arrow.endAnchor);
  }

  return [p1, p2];
}

/**
 * Get the world coordinate of the control handle for an arrow
 */
export function getArrowMidPoint(
  p1: Point,
  p2: Point,
  lineStyle: 'straight' | 'elbow',
  bend: number = 0
): Point {
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  
  if (lineStyle === 'elbow') {
    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);
    if (dx > dy) {
      return { x: mx + bend, y: my };
    } else {
      return { x: mx, y: my + bend };
    }
  } else {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy) || 1;
    const nx = -dy / dist;
    const ny = dx / dist;
    return {
      x: mx + nx * bend,
      y: my + ny * bend,
    };
  }
}

/**
 * Compute waypoints for an elbow (orthogonal) path from p1 to p2 passing through a bend offset
 */
export function computeElbowPath(p1: Point, p2: Point, bend: number = 0): Point[] {
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  
  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);
  
  if (dx > dy) {
    // Horizontal layout
    const elbowX = mx + bend;
    return [p1, { x: elbowX, y: p1.y }, { x: elbowX, y: p2.y }, p2];
  } else {
    // Vertical layout
    const elbowY = my + bend;
    return [p1, { x: p1.x, y: elbowY }, { x: p2.x, y: elbowY }, p2];
  }
}

/**
 * Returns true if world point is within `radius` of any part of the shape perimeter.
 */
export function isNearAnchor(shape: Shape, world: Point, radius: number): boolean {
  const anchor = getNearestAnchorOnShape(shape, world);
  const pt = getShapeConnectionPoint(shape, anchor);
  return Math.hypot(pt.x - world.x, pt.y - world.y) <= radius;
}

/**
 * Find a non-arrow shape that the world point is "hovering over"
 * (within a generous threshold of its bounding box).
 */
export function findHoveredShape(
  shapes: Shape[],
  world: Point,
  padWorld: number
): Shape | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    if (s.type === 'arrow' || s.type === 'line' || s.type === 'pen') continue;
    if (
      world.x >= s.x - padWorld &&
      world.x <= s.x + s.width + padWorld &&
      world.y >= s.y - padWorld &&
      world.y <= s.y + s.height + padWorld
    ) return s;
  }
  return null;
}
