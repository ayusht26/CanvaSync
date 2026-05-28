import { BaseTool, ToolEvent } from './BaseTool.js';
import { ToolName, Shape } from '@canvasync/shared';
import { HitDetection } from '../canvas/HitDetection.js';

// Handle types for resize
type ResizeHandle = 'tl' | 'tc' | 'tr' | 'ml' | 'mr' | 'bl' | 'bc' | 'br' | 'rotate';

interface HandleHit {
  type: ResizeHandle;
  originX: number; // opposite corner world X (anchor for resize)
  originY: number;
}

export class SelectionTool extends BaseTool {
  name = ToolName.SELECTION;
  private mode: 'idle' | 'moving' | 'rubber-band' | 'resizing' | 'rotating' = 'idle';
  private dragStart = { x: 0, y: 0 };
  private initialPositions: Map<string, {
    x: number;
    y: number;
    w: number;
    h: number;
    rotation: number;
    fontSize?: number;
    points?: Array<{ x: number; y: number }>;
  }> = new Map();
  private rbStart = { x: 0, y: 0 };
  private activeHandle: HandleHit | null = null;
  private initialBBox = { x: 0, y: 0, w: 0, h: 0 };
  private rotateStartAngle = 0;

  onPointerDown(e: ToolEvent) {
    const { worldX, worldY, sceneGraph, selectionStore, shiftKey } = e;
    const selectedIds: Set<string> = selectionStore.getState().selectedIds;

    // 1. Check if clicking a resize/rotate handle first
    if (selectedIds.size > 0) {
      const handleHit = this.hitTestHandles(worldX, worldY, selectedIds, sceneGraph);
      if (handleHit) {
        this.activeHandle = handleHit;
        this.storeInitialState(selectedIds, sceneGraph);
        this.dragStart = { x: worldX, y: worldY };

        if (handleHit.type === 'rotate') {
          this.mode = 'rotating';
          const bbox = this.getBoundingBox(selectedIds, sceneGraph);
          this.rotateStartAngle = Math.atan2(
            worldY - (bbox.y + bbox.h / 2),
            worldX - (bbox.x + bbox.w / 2)
          );
          this.initialBBox = bbox;
        } else {
          this.mode = 'resizing';
        }
        return;
      }
    }

    // 2. Hit test shapes (topmost first = reverse order)
    const elements = [...sceneGraph.getElements()].reverse();
    const hit = elements.find((s: Shape) => HitDetection.isPointInShape({ x: worldX, y: worldY }, s));

    if (hit) {
      if (shiftKey) {
        const next = new Set(selectedIds);
        next.has(hit.id) ? next.delete(hit.id) : next.add(hit.id);
        selectionStore.getState().setSelectedIds(next);
      } else {
        if (!selectedIds.has(hit.id)) {
          selectionStore.getState().setSelectedIds(new Set([hit.id]));
        }
      }
      this.storeInitialState(selectionStore.getState().selectedIds, sceneGraph);
      this.dragStart = { x: worldX, y: worldY };
      this.mode = 'moving';
    } else {
      if (!shiftKey) selectionStore.getState().setSelectedIds(new Set());
      this.rbStart = { x: worldX, y: worldY };
      selectionStore.getState().setSelectionBox({ x: worldX, y: worldY, width: 0, height: 0 });
      this.mode = 'rubber-band';
    }
  }

  onPointerMove(e: ToolEvent) {
    const { worldX, worldY, sceneGraph, selectionStore } = e;

    if (this.mode === 'moving') {
      const dx = worldX - this.dragStart.x;
      const dy = worldY - this.dragStart.y;
      this.initialPositions.forEach((pos, id) => {
        const updates: Partial<Shape> = {
          x: pos.x + dx,
          y: pos.y + dy,
        };
        if (pos.points) {
          (updates as any).points = pos.points.map(p => ({
            x: p.x + dx,
            y: p.y + dy,
          }));
        }
        sceneGraph.update(id, updates);
      });
      this.engine.render();
    } else if (this.mode === 'rubber-band') {
      const x = Math.min(this.rbStart.x, worldX);
      const y = Math.min(this.rbStart.y, worldY);
      const width = Math.abs(worldX - this.rbStart.x);
      const height = Math.abs(worldY - this.rbStart.y);
      selectionStore.getState().setSelectionBox({ x, y, width, height });

      const newSelected = new Set<string>();
      sceneGraph.getElements().forEach((s: Shape) => {
        if (HitDetection.isRectInShape({ x, y, width, height }, s)) newSelected.add(s.id);
      });
      selectionStore.getState().setSelectedIds(newSelected);
      this.engine.render();
    } else if (this.mode === 'resizing' && this.activeHandle) {
      this.handleResize(worldX, worldY, sceneGraph, selectionStore.getState().selectedIds);
      this.engine.render();
    } else if (this.mode === 'rotating') {
      this.handleRotate(worldX, worldY, sceneGraph, selectionStore.getState().selectedIds);
      this.engine.render();
    }
  }

  onPointerUp(e: ToolEvent) {
    e.selectionStore.getState().setSelectionBox(null);
    this.mode = 'idle';
    this.initialPositions.clear();
    this.activeHandle = null;
    this.engine.render();
  }

  private storeInitialState(selectedIds: Set<string>, sceneGraph: any) {
    this.initialPositions.clear();
    sceneGraph.getElements().forEach((s: Shape) => {
      if (selectedIds.has(s.id)) {
        this.initialPositions.set(s.id, {
          x: s.x,
          y: s.y,
          w: s.width,
          h: s.height,
          rotation: s.rotation ?? 0,
          fontSize: (s as any).fontSize,
          points: (s as any).points ? JSON.parse(JSON.stringify((s as any).points)) : undefined,
        });
      }
    });
    this.initialBBox = this.getBoundingBox(selectedIds, sceneGraph);
  }

  private getBoundingBox(selectedIds: Set<string>, sceneGraph: any) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    sceneGraph.getElements().forEach((s: Shape) => {
      if (!selectedIds.has(s.id)) return;
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + (s.width || 0));
      maxY = Math.max(maxY, s.y + (s.height || 0));
    });
    if (!isFinite(minX)) return { x: 0, y: 0, w: 0, h: 0 };
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  private hitTestHandles(worldX: number, worldY: number, selectedIds: Set<string>, sceneGraph: any): HandleHit | null {
    const camera = this.engine.getCamera();
    // Handle half-size in world units
    const hSize = 10 / camera.zoom;
    const pad = 4 / camera.zoom;
    const bbox = this.getBoundingBox(selectedIds, sceneGraph);
    const { x, y, w, h } = bbox;

    if (w === 0 && h === 0) return null;

    const elements = sceneGraph.getElements();
    const singleShape = selectedIds.size === 1 ? elements.find((s: Shape) => selectedIds.has(s.id)) : null;
    const isSingleRotatable = singleShape && singleShape.type !== 'pen' && singleShape.type !== 'line' && singleShape.type !== 'arrow';

    let testX = worldX;
    let testY = worldY;

    if (isSingleRotatable && singleShape.rotation) {
      const cx = singleShape.x + singleShape.width / 2;
      const cy = singleShape.y + singleShape.height / 2;
      const cos = Math.cos(-singleShape.rotation);
      const sin = Math.sin(-singleShape.rotation);
      const dx = worldX - cx;
      const dy = worldY - cy;
      testX = cx + dx * cos - dy * sin;
      testY = cy + dx * sin + dy * cos;
    }

    const handles: Array<{ type: ResizeHandle; wx: number; wy: number; originX: number; originY: number }> = [
      { type: 'tl', wx: x - pad,         wy: y - pad,         originX: x + w, originY: y + h },
      { type: 'tc', wx: x + w / 2,       wy: y - pad,         originX: x + w / 2, originY: y + h },
      { type: 'tr', wx: x + w + pad,     wy: y - pad,         originX: x, originY: y + h },
      { type: 'ml', wx: x - pad,         wy: y + h / 2,       originX: x + w, originY: y + h / 2 },
      { type: 'mr', wx: x + w + pad,     wy: y + h / 2,       originX: x, originY: y + h / 2 },
      { type: 'bl', wx: x - pad,         wy: y + h + pad,     originX: x + w, originY: y },
      { type: 'bc', wx: x + w / 2,       wy: y + h + pad,     originX: x + w / 2, originY: y },
      { type: 'br', wx: x + w + pad,     wy: y + h + pad,     originX: x, originY: y },
      // Rotate handle above top center
      { type: 'rotate', wx: x + w / 2,   wy: y - pad - 24 / camera.zoom, originX: x + w / 2, originY: y + h / 2 },
    ];

    for (const handle of handles) {
      if (Math.abs(testX - handle.wx) < hSize && Math.abs(testY - handle.wy) < hSize) {
        return { type: handle.type, originX: handle.originX, originY: handle.originY };
      }
    }
    return null;
  }

  private handleResize(worldX: number, worldY: number, sceneGraph: any, selectedIds: Set<string>) {
    if (!this.activeHandle) return;
    const { type, originX, originY } = this.activeHandle;

    const elements = sceneGraph.getElements();
    const singleShape = selectedIds.size === 1 ? elements.find((s: Shape) => selectedIds.has(s.id)) : null;
    const isSingleRotatable = singleShape && singleShape.type !== 'pen' && singleShape.type !== 'line' && singleShape.type !== 'arrow';

    let testX = worldX;
    let testY = worldY;

    if (isSingleRotatable && singleShape.rotation) {
      const cx = this.initialBBox.x + this.initialBBox.w / 2;
      const cy = this.initialBBox.y + this.initialBBox.h / 2;
      const cos = Math.cos(-singleShape.rotation);
      const sin = Math.sin(-singleShape.rotation);
      const dx = worldX - cx;
      const dy = worldY - cy;
      testX = cx + dx * cos - dy * sin;
      testY = cy + dx * sin + dy * cos;
    }

    let newX = this.initialBBox.x;
    let newY = this.initialBBox.y;
    let newW = this.initialBBox.w;
    let newH = this.initialBBox.h;

    switch (type) {
      case 'tl': newX = testX; newY = testY; newW = originX - testX; newH = originY - testY; break;
      case 'tc': newY = testY; newH = originY - testY; break;
      case 'tr': newY = testY; newW = testX - this.initialBBox.x; newH = originY - testY; break;
      case 'ml': newX = testX; newW = originX - testX; break;
      case 'mr': newW = testX - this.initialBBox.x; break;
      case 'bl': newX = testX; newW = originX - testX; newH = testY - this.initialBBox.y; break;
      case 'bc': newH = testY - this.initialBBox.y; break;
      case 'br': newW = testX - this.initialBBox.x; newH = testY - this.initialBBox.y; break;
    }

    // Prevent negative dimensions
    if (newW < 5) newW = 5;
    if (newH < 5) newH = 5;

    if (isSingleRotatable && singleShape.rotation) {
      const cxLocal = newX + newW / 2;
      const cyLocal = newY + newH / 2;
      const cx0 = this.initialBBox.x + this.initialBBox.w / 2;
      const cy0 = this.initialBBox.y + this.initialBBox.h / 2;

      const cos = Math.cos(singleShape.rotation);
      const sin = Math.sin(singleShape.rotation);
      const dx = cxLocal - cx0;
      const dy = cyLocal - cy0;
      const cxWorld = cx0 + dx * cos - dy * sin;
      const cyWorld = cy0 + dx * sin + dy * cos;

      const init = this.initialPositions.get(singleShape.id);
      const updates: Partial<Shape> = {
        x: cxWorld - newW / 2,
        y: cyWorld - newH / 2,
        width: newW,
        height: newH,
      };

      if (singleShape.type === 'text' && init && init.fontSize) {
        const scale = newH / Math.max(this.initialBBox.h, 1);
        (updates as any).fontSize = Math.max(6, Math.round(init.fontSize * scale));
      }

      sceneGraph.update(singleShape.id, updates);
    } else {
      // Scale all selected shapes proportionally
      const scaleX = newW / Math.max(this.initialBBox.w, 1);
      const scaleY = newH / Math.max(this.initialBBox.h, 1);

      sceneGraph.getElements().forEach((s: Shape) => {
        if (!selectedIds.has(s.id)) return;
        const init = this.initialPositions.get(s.id);
        if (!init) return;
        const relX = (init.x - this.initialBBox.x) / Math.max(this.initialBBox.w, 1);
        const relY = (init.y - this.initialBBox.y) / Math.max(this.initialBBox.h, 1);

        const updates: Partial<Shape> = {
          x: newX + relX * newW,
          y: newY + relY * newH,
          width: Math.max(5, init.w * scaleX),
          height: Math.max(5, init.h * scaleY),
        };

        if (s.type === 'text' && init.fontSize) {
          (updates as any).fontSize = Math.max(6, Math.round(init.fontSize * scaleY));
        }

        if (init.points) {
          (updates as any).points = init.points.map(p => {
            const relPX = (p.x - this.initialBBox.x) / Math.max(this.initialBBox.w, 1);
            const relPY = (p.y - this.initialBBox.y) / Math.max(this.initialBBox.h, 1);
            return {
              x: newX + relPX * newW,
              y: newY + relPY * newH,
            };
          });

          // Keep s.x, s.y, s.width, s.height in tight sync with transformed points
          const pts = (updates as any).points;
          const minPX = Math.min(...pts.map((p: any) => p.x));
          const minPY = Math.min(...pts.map((p: any) => p.y));
          const maxPX = Math.max(...pts.map((p: any) => p.x));
          const maxPY = Math.max(...pts.map((p: any) => p.y));
          updates.x = minPX;
          updates.y = minPY;
          updates.width = maxPX - minPX;
          updates.height = maxPY - minPY;
        }

        sceneGraph.update(s.id, updates);
      });
    }
  }

  private handleRotate(worldX: number, worldY: number, sceneGraph: any, selectedIds: Set<string>) {
    const cx = this.initialBBox.x + this.initialBBox.w / 2;
    const cy = this.initialBBox.y + this.initialBBox.h / 2;
    const currentAngle = Math.atan2(worldY - cy, worldX - cx);
    const deltaAngle = currentAngle - this.rotateStartAngle;

    sceneGraph.getElements().forEach((s: Shape) => {
      if (!selectedIds.has(s.id)) return;
      const init = this.initialPositions.get(s.id);
      if (!init) return;

      const updates: Partial<Shape> = {
        rotation: init.rotation + deltaAngle,
      };

      if (init.points) {
        const cos = Math.cos(deltaAngle);
        const sin = Math.sin(deltaAngle);
        (updates as any).points = init.points.map(p => {
          const dx = p.x - cx;
          const dy = p.y - cy;
          return {
            x: cx + dx * cos - dy * sin,
            y: cy + dx * sin + dy * cos,
          };
        });

        // Recompute bounding box for rotated points to keep s.x, s.y, s.width, s.height in sync!
        const pts = (updates as any).points;
        const minX = Math.min(...pts.map((p: any) => p.x));
        const minY = Math.min(...pts.map((p: any) => p.y));
        const maxX = Math.max(...pts.map((p: any) => p.x));
        const maxY = Math.max(...pts.map((p: any) => p.y));
        updates.x = minX;
        updates.y = minY;
        updates.width = maxX - minX;
        updates.height = maxY - minY;
      }

      sceneGraph.update(s.id, updates);
    });
  }
}
