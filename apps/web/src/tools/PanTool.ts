import { BaseTool, ToolEvent } from './BaseTool.js';
import { useCanvasStore } from '../store/useCanvasStore.js';

export class PanTool extends BaseTool {
  private isPanning = false;
  private lastScreen = { x: 0, y: 0 };

  onPointerDown(e: ToolEvent) {
    this.isPanning = true;
    this.lastScreen = { x: e.screenX, y: e.screenY };
  }

  onPointerMove(e: ToolEvent) {
    if (!this.isPanning) return;
    const dx = e.screenX - this.lastScreen.x;
    const dy = e.screenY - this.lastScreen.y;
    this.lastScreen = { x: e.screenX, y: e.screenY };

    const camera = this.engine.getCamera();
    camera.panBy(dx, dy);
    useCanvasStore.getState().updateCamera({ x: camera.x, y: camera.y, zoom: camera.zoom });
    this.engine.render();
  }

  onPointerUp(_e: ToolEvent) {
    this.isPanning = false;
  }
}
