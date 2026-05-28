import { Point } from '@canvasync/shared';
import { Camera } from './Camera';

export class TransformUtils {
  static screenToWorld(point: Point, camera: Camera): Point {
    return {
      x: (point.x - camera.x) / camera.zoom,
      y: (point.y - camera.y) / camera.zoom,
    };
  }

  static worldToScreen(point: Point, camera: Camera): Point {
    return {
      x: point.x * camera.zoom + camera.x,
      y: point.y * camera.zoom + camera.y,
    };
  }

  static applyTransform(ctx: CanvasRenderingContext2D, camera: Camera) {
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(
      camera.zoom * dpr,
      0,
      0,
      camera.zoom * dpr,
      camera.x * dpr,
      camera.y * dpr
    );
  }
}
