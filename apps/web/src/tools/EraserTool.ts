import { BaseTool, ToolEvent } from './BaseTool.js';
import { Shape, Point } from '@canvasync/shared';
import { HitDetection } from '../canvas/HitDetection.js';

export class EraserTool extends BaseTool {
  private erasing = false;
  private lastX = 0;
  private lastY = 0;

  onPointerDown(e: ToolEvent) {
    this.erasing = true;
    this.lastX = e.worldX;
    this.lastY = e.worldY;
    this.erase(e, e.worldX, e.worldY);
  }

  onPointerMove(e: ToolEvent) {
    if (!this.erasing) return;
    // Smooth interpolation between last and current position (like pen tool)
    // This ensures no gaps even at high-speed mouse movement
    const dx = e.worldX - this.lastX;
    const dy = e.worldY - this.lastY;
    const dist = Math.hypot(dx, dy);
    const eraserSize = ((window as any).__eraserSize || 20) / this.engine.getCamera().zoom;
    // Step size = half eraser radius for smooth coverage
    const step = Math.max(1, eraserSize * 0.4);
    const steps = Math.ceil(dist / step);

    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 1 : i / steps;
      const wx = this.lastX + dx * t;
      const wy = this.lastY + dy * t;
      this.erase(e, wx, wy);
    }

    this.lastX = e.worldX;
    this.lastY = e.worldY;
  }

  onPointerUp(_e: ToolEvent) {
    this.erasing = false;
  }

  private erase(e: ToolEvent, worldX: number, worldY: number) {
    const { sceneGraph } = e;
    const mode: 'element' | 'partial' = (window as any).__eraserMode || 'element';
    const eraserPxSize: number = (window as any).__eraserSize || 20;
    const sizeWorld = eraserPxSize / this.engine.getCamera().zoom;
    const halfSize = sizeWorld / 2;
    const point: Point = { x: worldX, y: worldY };

    if (mode === 'element') {
      // Remove entire shapes hit by the eraser circle
      const toRemove = sceneGraph.getElements().filter((s: Shape) =>
        HitDetection.isPointInShape(point, s)
      );
      toRemove.forEach((s: Shape) => sceneGraph.remove(s.id));
      if (toRemove.length > 0) this.engine.render();
    } else {
      // MS Paint-style partial erase:
      // Pen strokes: remove points within eraser radius, keeping survivors as separate runs
      // Lines/arrows: remove if eraser passes near the segment
      // Other shapes: remove if eraser overlaps their bounding box
      let changed = false;

      // Snapshot to avoid modifying while iterating
      const elements = [...sceneGraph.getElements()];

      elements.forEach((s: Shape) => {
        if (s.type === 'pen') {
          const pts = (s as any).points as Point[];
          if (!pts) return;

          // Mark which points survive (outside eraser radius)
          const survived: boolean[] = pts.map((p: Point) =>
            Math.hypot(p.x - worldX, p.y - worldY) > halfSize
          );

          if (survived.every(v => v)) return; // nothing erased from this stroke

          // Collect surviving runs (consecutive surviving points)
          const runs: Point[][] = [];
          let currentRun: Point[] = [];
          for (let i = 0; i < pts.length; i++) {
            if (survived[i]) {
              currentRun.push(pts[i]);
            } else {
              if (currentRun.length >= 2) runs.push([...currentRun]);
              currentRun = [];
            }
          }
          if (currentRun.length >= 2) runs.push([...currentRun]);

          // Remove original stroke
          sceneGraph.remove(s.id);
          changed = true;

          // Re-add surviving runs as new pen strokes
          runs.forEach(run => {
            if (run.length < 2) return;
            const minX = Math.min(...run.map(p => p.x));
            const minY = Math.min(...run.map(p => p.y));
            const maxX = Math.max(...run.map(p => p.x));
            const maxY = Math.max(...run.map(p => p.y));
            const newShape: any = {
              ...s,
              id: (Math.random() * 1e15 | 0).toString(36),
              points: run,
              x: minX,
              y: minY,
              width: maxX - minX,
              height: maxY - minY,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            sceneGraph.add(newShape);
          });
        } else if (s.type === 'line' || s.type === 'arrow') {
          const pts = (s as any).points as Point[];
          if (!pts || pts.length < 2) return;
          const p0 = pts[0], p1 = pts[1];
          const dx = p1.x - p0.x, dy = p1.y - p0.y;
          const L2 = dx * dx + dy * dy;
          let t = L2 > 0 ? ((worldX - p0.x) * dx + (worldY - p0.y) * dy) / L2 : 0;
          t = Math.max(0, Math.min(1, t));
          const nearX = p0.x + t * dx, nearY = p0.y + t * dy;
          if (Math.hypot(nearX - worldX, nearY - worldY) <= halfSize) {
            sceneGraph.remove(s.id);
            changed = true;
          }
        } else {
          // Other shapes: erase if eraser circle overlaps bounding box
          if (
            worldX + halfSize > s.x &&
            worldX - halfSize < s.x + s.width &&
            worldY + halfSize > s.y &&
            worldY - halfSize < s.y + s.height
          ) {
            sceneGraph.remove(s.id);
            changed = true;
          }
        }
      });

      if (changed) this.engine.render();
    }
  }
}
