import { BaseTool, ToolEvent } from './BaseTool.js';
import { ToolName, Shape } from '@canvasync/shared';
import { HitDetection } from '../canvas/HitDetection.js';
import { TextRenderer } from '../renderer/shapes/TextRenderer.js';

import { findHoveredShape, getNearestAnchorOnShape, getShapeConnectionPoint, resolveArrowEndpoints, getArrowMidPoint } from '../canvas/ArrowConnections.js';
import { ArrowHoverOverlay } from '../renderer/ArrowHoverOverlay.js';

// Handle types for resize
type ResizeHandle = 'tl' | 'tc' | 'tr' | 'ml' | 'mr' | 'bl' | 'bc' | 'br' | 'rotate' | 'arrow-start' | 'arrow-end' | 'arrow-mid';

interface HandleHit {
  type: ResizeHandle;
  originX?: number; // opposite corner world X (anchor for resize)
  originY?: number;
}

export class SelectionTool extends BaseTool {
  name = ToolName.SELECTION;
  private mode: 'idle' | 'moving' | 'rubber-band' | 'resizing' | 'rotating' | 'arrow-edit' = 'idle';
  private dragStart = { x: 0, y: 0 };
  private initialPositions: Map<string, {
    x: number;
    y: number;
    w: number;
    h: number;
    rotation: number;
    fontSize?: number;
    points?: Array<{ x: number; y: number }>;
    bend?: number;
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
        } else if (handleHit.type === 'arrow-start' || handleHit.type === 'arrow-end' || handleHit.type === 'arrow-mid') {
          this.mode = 'arrow-edit';
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

      // Also refresh bounding boxes of arrows connected to moved shapes
      const movedIds = new Set(this.initialPositions.keys());
      sceneGraph.getElements().forEach((s: Shape) => {
        if (s.type !== 'arrow') return;
        const arrow = s as any;
        const touchesStart = arrow.startShapeId && movedIds.has(arrow.startShapeId);
        const touchesEnd   = arrow.endShapeId   && movedIds.has(arrow.endShapeId);
        if (!touchesStart && !touchesEnd) return;

        // Recompute arrow's points from anchors so bbox stays correct
        let p1 = arrow.points[0];
        let p2 = arrow.points[arrow.points.length - 1];
        if (touchesStart && arrow.startAnchor) {
          const src = sceneGraph.getById(arrow.startShapeId);
          if (src) {
            p1 = { x: src.x + arrow.startAnchor.rx * src.width, y: src.y + arrow.startAnchor.ry * src.height };
          }
        }
        if (touchesEnd && arrow.endAnchor) {
          const dst = sceneGraph.getById(arrow.endShapeId);
          if (dst) {
            p2 = { x: dst.x + arrow.endAnchor.rx * dst.width, y: dst.y + arrow.endAnchor.ry * dst.height };
          }
        }
        sceneGraph.update(arrow.id, {
          points: [p1, p2],
          x: Math.min(p1.x, p2.x),
          y: Math.min(p1.y, p2.y),
          width:  Math.abs(p2.x - p1.x),
          height: Math.abs(p2.y - p1.y),
        });
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
      this.handleResize(worldX, worldY, sceneGraph, selectionStore.getState().selectedIds, e.shiftKey);
      this.engine.render();
    } else if (this.mode === 'rotating') {
      this.handleRotate(worldX, worldY, sceneGraph, selectionStore.getState().selectedIds);
      this.engine.render();
    } else if (this.mode === 'arrow-edit' && this.activeHandle) {
      const selectedId = (Array.from(selectionStore.getState().selectedIds) as string[])[0];
      const arrow = sceneGraph.getById(selectedId) as any;
      if (!arrow) return;

      if (this.activeHandle.type === 'arrow-mid') {
        const [p1, p2] = resolveArrowEndpoints(arrow, (id) => sceneGraph.getById(id));
        const lineStyle = arrow.lineStyle ?? 'straight';
        
        let newBend = 0;
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;

        if (lineStyle === 'elbow') {
          const dx = Math.abs(p2.x - p1.x);
          const dy = Math.abs(p2.y - p1.y);
          if (dx > dy) {
            newBend = worldX - mx;
          } else {
            newBend = worldY - my;
          }
        } else {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.hypot(dx, dy) || 1;
          const nx = -dy / dist;
          const ny = dx / dist;
          newBend = (worldX - mx) * nx + (worldY - my) * ny;
        }

        // Snap to straight
        if (Math.abs(newBend) < 15 / e.canvasStore.getState().camera.zoom) {
          newBend = 0;
        }
        
        sceneGraph.update(arrow.id, { bend: newBend });
      } else {
        // Dragging p1 or p2 -> snap to shapes
        const isStart = this.activeHandle.type === 'arrow-start';
        const snapRadius = 48 / e.canvasStore.getState().camera.zoom;
        const shapes = sceneGraph.getElements() as Shape[];
        const targetShape = findHoveredShape(shapes.filter(s => s.id !== arrow.id), { x: worldX, y: worldY }, snapRadius);
        
        let newX = worldX;
        let newY = worldY;
        let newShapeId = null;
        let newAnchor = null;

        if (targetShape) {
          ArrowHoverOverlay.hoveredShapeId = targetShape.id;
          const anchor = getNearestAnchorOnShape(targetShape, { x: worldX, y: worldY });
          ArrowHoverOverlay.nearestAnchor = anchor;
          const snapped = getShapeConnectionPoint(targetShape, anchor);
          newX = snapped.x;
          newY = snapped.y;
          newShapeId = targetShape.id;
          newAnchor = anchor;
        } else {
          ArrowHoverOverlay.hoveredShapeId = null;
          ArrowHoverOverlay.nearestAnchor = null;
        }

        const pts = [...arrow.points];
        if (isStart) pts[0] = { x: newX, y: newY };
        else pts[pts.length - 1] = { x: newX, y: newY };

        const updates: any = { points: pts };
        if (isStart) {
          updates.startShapeId = newShapeId;
          updates.startAnchor = newAnchor;
        } else {
          updates.endShapeId = newShapeId;
          updates.endAnchor = newAnchor;
        }

        // Update bounding box
        const [p1, p2] = resolveArrowEndpoints({ ...arrow, ...updates }, (id) => sceneGraph.getById(id));
        updates.x = Math.min(p1.x, p2.x);
        updates.y = Math.min(p1.y, p2.y);
        updates.width = Math.abs(p2.x - p1.x);
        updates.height = Math.abs(p2.y - p1.y);

        sceneGraph.update(arrow.id, updates);
      }
      this.engine.render();
    }
  }

  onPointerUp(e: ToolEvent) {
    e.selectionStore.getState().setSelectionBox(null);
    this.mode = 'idle';
    this.initialPositions.clear();
    this.activeHandle = null;
    ArrowHoverOverlay.hoveredShapeId = null;
    ArrowHoverOverlay.nearestAnchor = null;
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
          bend: (s as any).bend,
        });
      }
    });
    this.initialBBox = this.getBoundingBox(selectedIds, sceneGraph);
  }

  private getBoundingBox(selectedIds: Set<string>, sceneGraph: any) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    sceneGraph.getElements().forEach((s: Shape) => {
      if (!selectedIds.has(s.id)) return;
      const isText = s.type === 'text';
      const textMeasured = isText ? TextRenderer.measure(s as any) : null;
      const w = textMeasured ? textMeasured.width : (s.width || 0);
      const h = textMeasured ? textMeasured.height : (s.height || 0);

      let shapeY = s.y;
      if (isText) {
        shapeY += (s.fontSize || 20) * 0.15;
      }

      minX = Math.min(minX, s.x);
      minY = Math.min(minY, shapeY);
      maxX = Math.max(maxX, s.x + w);
      maxY = Math.max(maxY, shapeY + h);
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

    if (singleShape && singleShape.type === 'arrow') {
      const arrow = singleShape as any;
      const [p1, p2] = resolveArrowEndpoints(arrow, (id) => sceneGraph.getById(id));
      const mid = getArrowMidPoint(p1, p2, arrow.lineStyle ?? 'straight', arrow.bend ?? 0);

      const arrowHandles: Array<{ type: ResizeHandle; wx: number; wy: number }> = [
        { type: 'arrow-start', wx: p1.x, wy: p1.y },
        { type: 'arrow-end',   wx: p2.x, wy: p2.y },
        { type: 'arrow-mid',   wx: mid.x, wy: mid.y },
      ];
      for (const h of arrowHandles) {
        if (Math.abs(worldX - h.wx) < hSize && Math.abs(worldY - h.wy) < hSize) {
          return { type: h.type };
        }
      }
      return null;
    }

    const isSingleRotatable = singleShape && singleShape.type !== 'pen' && singleShape.type !== 'line';

    let testX = worldX;
    let testY = worldY;

    if (isSingleRotatable && singleShape.rotation) {
      const isText = singleShape.type === 'text';
      const textMeasured = isText ? TextRenderer.measure(singleShape as any) : null;
      const w = textMeasured ? textMeasured.width : (singleShape.width || 0);
      const h = textMeasured ? textMeasured.height : (singleShape.height || 0);

      let shapeY = singleShape.y;
      if (isText) {
        shapeY += (singleShape.fontSize || 20) * 0.15;
      }

      const cx = singleShape.x + w / 2;
      const cy = shapeY + h / 2;
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

  private handleResize(worldX: number, worldY: number, sceneGraph: any, selectedIds: Set<string>, shiftKey: boolean) {
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
      case 'tl': newX = testX; newY = testY; newW = originX! - testX; newH = originY! - testY; break;
      case 'tc': newY = testY; newH = originY! - testY; break;
      case 'tr': newY = testY; newW = testX - this.initialBBox.x; newH = originY! - testY; break;
      case 'ml': newX = testX; newW = originX! - testX; break;
      case 'mr': newW = testX - this.initialBBox.x; break;
      case 'bl': newX = testX; newW = originX! - testX; newH = testY - this.initialBBox.y; break;
      case 'bc': newH = testY - this.initialBBox.y; break;
      case 'br': newW = testX - this.initialBBox.x; newH = testY - this.initialBBox.y; break;
    }

    // Prevent negative dimensions
    if (newW < 5) newW = 5;
    if (newH < 5) newH = 5;

    // Aspect ratio lock (Shift-resize)
    if (shiftKey && this.initialBBox.w > 0 && this.initialBBox.h > 0) {
      const initialRatio = this.initialBBox.w / this.initialBBox.h;
      if (type === 'ml' || type === 'mr') {
        newH = newW / initialRatio;
      } else if (type === 'tc' || type === 'bc') {
        newW = newH * initialRatio;
      } else {
        const currentRatio = newW / newH;
        if (currentRatio > initialRatio) {
          newH = newW / initialRatio;
        } else {
          newW = newH * initialRatio;
        }
      }

      // Re-align position to keep anchor stationary or centered
      if (type === 'tl' || type === 'ml' || type === 'bl') {
        newX = originX! - newW;
      } else if (type === 'tr' || type === 'mr' || type === 'br') {
        newX = originX!;
      }

      if (type === 'tl' || type === 'tc' || type === 'tr') {
        newY = originY! - newH;
      } else if (type === 'bl' || type === 'bc' || type === 'br') {
        newY = originY!;
      }

      if (type === 'ml' || type === 'mr') {
        newY = originY! - newH / 2;
      } else if (type === 'tc' || type === 'bc') {
        newX = originX! - newW / 2;
      }
    }

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
