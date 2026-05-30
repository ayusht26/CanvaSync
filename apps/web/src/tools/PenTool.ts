import { BaseTool, ToolEvent } from './BaseTool.js';
import { PenShape } from '@canvasync/shared';
import { ShapeFactory } from '../shapes/ShapeFactory.js';

export class PenTool extends BaseTool {
  private currentShape: PenShape | null = null;

  onPointerDown(e: ToolEvent): void {
    const { worldX, worldY, sceneGraph, styleStore } = e;
    const { strokeColor, strokeWidth, strokeStyle, opacity } = styleStore.getState();
    this.currentShape = ShapeFactory.createShape('pen', worldX, worldY, {
      strokeColor,
      strokeWidth,
      strokeStyle,
      opacity,
    }) as PenShape;

    // Problem 4 fix: mark as live so SyncManager flushes it unbatched every update
    (this.currentShape as any)._live = true;

    sceneGraph.add(this.currentShape);
    this.engine.render();
  }

  onPointerMove(e: ToolEvent): void {
    const { worldX, worldY, sceneGraph } = e;
    if (!this.currentShape) return;

    this.currentShape.points.push({ x: worldX, y: worldY });

    sceneGraph.update(this.currentShape.id, {
      points: [...this.currentShape.points],
      // Keep _live flag so sync manager treats this as a hot update
      ...({ _live: true } as any),
    });
    this.engine.render();
  }

  onPointerUp(e: ToolEvent): void {
    if (!this.currentShape) return;
    const sceneGraph = e.sceneGraph;

    if (this.currentShape.points.length < 2) {
      sceneGraph.remove(this.currentShape.id);
    } else {
      const points = this.currentShape.points;
      const minX = Math.min(...points.map(p => p.x));
      const minY = Math.min(...points.map(p => p.y));
      const maxX = Math.max(...points.map(p => p.x));
      const maxY = Math.max(...points.map(p => p.y));

      // Problem 4 fix: remove _live flag when stroke is complete
      // This moves it to the stable/batched sync path
      sceneGraph.update(this.currentShape.id, {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        points: this.currentShape.points,
        updatedAt: Date.now(),
        ...({ _live: false } as any),
      });
    }

    this.currentShape = null;
    this.engine.render();
  }
}
