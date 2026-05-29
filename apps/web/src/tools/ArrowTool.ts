import { BaseTool, ToolEvent } from './BaseTool.js';
import { ShapeFactory } from '../shapes/ShapeFactory.js';
import { ArrowShape, Shape } from '@canvasync/shared';
import {
  findHoveredShape,
  getNearestAnchorOnShape,
  getShapeConnectionPoint,
  isNearAnchor,
  Anchor,
} from '../canvas/ArrowConnections.js';
import { ArrowHoverOverlay } from '../renderer/ArrowHoverOverlay.js';

const SNAP_RADIUS_SCREEN = 48; // screen pixels — how close to trigger snap

export class ArrowTool extends BaseTool {
  private shape: ArrowShape | null = null;
  private startX = 0;
  private startY = 0;
  private endX = 0;
  private endY = 0;

  // Connection state for the arrow being drawn
  private startShapeId: string | null = null;
  private startAnchor: Anchor | null = null;

  onPointerMove(e: ToolEvent) {
    const { worldX, worldY, sceneGraph } = e;
    const snapRadius = SNAP_RADIUS_SCREEN / e.canvasStore.getState().camera.zoom;
    const shapes = sceneGraph.getElements() as Shape[];

    if (!this.shape) {
      // ── Hover mode (not drawing) ──────────────────────────────────────────
      const hovered = findHoveredShape(shapes, { x: worldX, y: worldY }, snapRadius);
      if (hovered) {
        ArrowHoverOverlay.hoveredShapeId = hovered.id;
        ArrowHoverOverlay.nearestAnchor  = getNearestAnchorOnShape(hovered, { x: worldX, y: worldY });
      } else {
        ArrowHoverOverlay.hoveredShapeId = null;
        ArrowHoverOverlay.nearestAnchor  = null;
      }
      this.engine.render();
      return;
    }

    // ── Drawing mode ──────────────────────────────────────────────────────
    let endX = worldX;
    let endY = worldY;

    // Angle snap with Shift
    if (e.shiftKey) {
      const dx = endX - this.startX;
      const dy = endY - this.startY;
      const angle = Math.atan2(dy, dx);
      const snapAngles = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI, -3 * Math.PI / 4, -Math.PI / 2, -Math.PI / 4];
      const snapped = snapAngles.reduce((best, a) =>
        Math.abs(angle - a) < Math.abs(angle - best) ? a : best
      , snapAngles[0]);
      const dist = Math.hypot(dx, dy);
      endX = this.startX + Math.cos(snapped) * dist;
      endY = this.startY + Math.sin(snapped) * dist;
    }

    // Snap end to nearby shape anchor
    const snapRadius2 = SNAP_RADIUS_SCREEN / e.canvasStore.getState().camera.zoom;
    const targetShape = findHoveredShape(shapes.filter(s => s.id !== this.shape!.id), { x: endX, y: endY }, snapRadius2);
    if (targetShape) {
      ArrowHoverOverlay.hoveredShapeId = targetShape.id;
      const anchor = getNearestAnchorOnShape(targetShape, { x: endX, y: endY });
      ArrowHoverOverlay.nearestAnchor  = anchor;
      const snappedPt = getShapeConnectionPoint(targetShape, anchor);
      endX = snappedPt.x;
      endY = snappedPt.y;
    } else {
      ArrowHoverOverlay.hoveredShapeId = null;
      ArrowHoverOverlay.nearestAnchor  = null;
    }

    this.endX = endX;
    this.endY = endY;

    // Recompute start point from anchor if connected
    let p1x = this.startX, p1y = this.startY;
    if (this.startShapeId && this.startAnchor) {
      const src = sceneGraph.getById(this.startShapeId) as Shape | undefined;
      if (src) {
        const pt = getShapeConnectionPoint(src, this.startAnchor);
        p1x = pt.x; p1y = pt.y;
      }
    }

    e.sceneGraph.update(this.shape.id, {
      x: Math.min(p1x, endX),
      y: Math.min(p1y, endY),
      width: Math.abs(endX - p1x),
      height: Math.abs(endY - p1y),
      points: [{ x: p1x, y: p1y }, { x: endX, y: endY }],
    });
    this.engine.render();
  }

  onPointerDown(e: ToolEvent) {
    const { worldX, worldY, sceneGraph, styleStore } = e;
    const snapRadius = SNAP_RADIUS_SCREEN / e.canvasStore.getState().camera.zoom;
    const shapes = sceneGraph.getElements() as Shape[];

    // Detect start shape connection
    const startShape = findHoveredShape(shapes, { x: worldX, y: worldY }, snapRadius);
    let startX = worldX;
    let startY = worldY;

    this.startShapeId = null;
    this.startAnchor  = null;

    if (startShape) {
      const anchor = getNearestAnchorOnShape(startShape, { x: worldX, y: worldY });
      this.startShapeId = startShape.id;
      this.startAnchor  = anchor;
      const snapped = getShapeConnectionPoint(startShape, anchor);
      startX = snapped.x;
      startY = snapped.y;
    }

    this.startX = startX;
    this.startY = startY;
    this.endX   = startX;
    this.endY   = startY;

    const styles = styleStore.getState();
    this.shape = ShapeFactory.createShape('arrow', startX, startY, styles) as ArrowShape;
    this.shape.points = [{ x: startX, y: startY }, { x: startX, y: startY }];

    if (this.startShapeId && this.startAnchor) {
      this.shape.startShapeId = this.startShapeId;
      this.shape.startAnchor  = this.startAnchor;
    }

    sceneGraph.add(this.shape);
  }

  onPointerUp(e: ToolEvent) {
    if (!this.shape) return;
    const { worldX, worldY, sceneGraph } = e;
    const snapRadius = SNAP_RADIUS_SCREEN / e.canvasStore.getState().camera.zoom;
    const shapes = (sceneGraph.getElements() as Shape[]).filter(s => s.id !== this.shape!.id);

    // Detect end shape connection
    const endShape = findHoveredShape(shapes, { x: this.endX, y: this.endY }, snapRadius);
    const updates: Partial<ArrowShape> = { updatedAt: Date.now() };

    if (endShape) {
      const anchor = getNearestAnchorOnShape(endShape, { x: this.endX, y: this.endY });
      updates.endShapeId = endShape.id;
      updates.endAnchor  = anchor;
    }

    const dist = Math.hypot(this.endX - this.startX, this.endY - this.startY);
    if (dist < 3) {
      sceneGraph.remove(this.shape.id);
    } else {
      sceneGraph.update(this.shape.id, updates);
    }

    // Clear hover state
    ArrowHoverOverlay.hoveredShapeId = null;
    ArrowHoverOverlay.nearestAnchor  = null;

    this.shape = null;
    this.startShapeId = null;
    this.startAnchor  = null;
    this.engine.render();
  }

  deactivate() {
    ArrowHoverOverlay.hoveredShapeId = null;
    ArrowHoverOverlay.nearestAnchor  = null;
  }
}
