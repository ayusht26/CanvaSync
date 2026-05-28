import { BaseTool, ToolEvent } from './BaseTool.js';
import { ShapeFactory } from '../shapes/ShapeFactory.js';
import { LineShape } from '@canvasync/shared';

export class LineTool extends BaseTool {
  private shape: LineShape | null = null;
  private startX = 0;
  private startY = 0;
  // Track current endpoint to fix the stale-ref bug (sceneGraph.update doesn't update this.shape)
  private endX = 0;
  private endY = 0;

  onPointerDown(e: ToolEvent) {
    const { worldX, worldY, sceneGraph, styleStore } = e;
    this.startX = worldX;
    this.startY = worldY;
    this.endX = worldX;
    this.endY = worldY;
    const styles = styleStore.getState();
    this.shape = ShapeFactory.createShape('line', worldX, worldY, styles) as LineShape;
    this.shape.points = [{ x: worldX, y: worldY }, { x: worldX, y: worldY }];
    sceneGraph.add(this.shape);
  }

  onPointerMove(e: ToolEvent) {
    if (!this.shape) return;
    let endX = e.worldX;
    let endY = e.worldY;
    // SHIFT = snap to 45° increments
    if (e.shiftKey) {
      const dx = endX - this.startX;
      const dy = endY - this.startY;
      const angle = Math.atan2(dy, dx);
      const snapAngles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, -3*Math.PI/4, -Math.PI/2, -Math.PI/4];
      const snapped = snapAngles.reduce((best, a) =>
        Math.abs(angle - a) < Math.abs(angle - best) ? a : best
      , snapAngles[0]);
      const dist = Math.hypot(dx, dy);
      endX = this.startX + Math.cos(snapped) * dist;
      endY = this.startY + Math.sin(snapped) * dist;
    }
    // Track current endpoint (this.shape.points is NOT updated by sceneGraph.update)
    this.endX = endX;
    this.endY = endY;
    e.sceneGraph.update(this.shape.id, {
      x: Math.min(this.startX, endX),
      y: Math.min(this.startY, endY),
      width: Math.abs(endX - this.startX),
      height: Math.abs(endY - this.startY),
      points: [{ x: this.startX, y: this.startY }, { x: endX, y: endY }],
    });
    this.engine.render();
  }

  onPointerUp(e: ToolEvent) {
    if (this.shape) {
      // Use tracked endpoints, NOT this.shape.points (which is stale — never updated)
      const dist = Math.hypot(this.endX - this.startX, this.endY - this.startY);
      if (dist < 3) {
        e.sceneGraph.remove(this.shape.id);
      } else {
        e.sceneGraph.update(this.shape.id, { updatedAt: Date.now() });
      }
    }
    this.shape = null;
    this.engine.render();
  }
}
