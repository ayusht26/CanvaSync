export class Camera {
  x = 0;
  y = 0;
  zoom = 1;

  private readonly MIN_ZOOM = 0.05;
  private readonly MAX_ZOOM = 20;

  panBy(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
  }

  setZoom(zoom: number) {
    this.zoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, zoom));
  }

  zoomAt(screenX: number, screenY: number, delta: number) {
    const oldZoom = this.zoom;
    const newZoom = Math.max(this.MIN_ZOOM, Math.min(this.MAX_ZOOM, oldZoom * delta));
    
    if (oldZoom === newZoom) return;

    // worldPoint = (screenPoint - cameraOffset) / oldZoom
    // screenPoint = worldPoint * newZoom + newCameraOffset
    // => newCameraOffset = screenPoint - worldPoint * newZoom

    const worldX = (screenX - this.x) / oldZoom;
    const worldY = (screenY - this.y) / oldZoom;

    this.zoom = newZoom;
    this.x = screenX - worldX * newZoom;
    this.y = screenY - worldY * newZoom;
  }
}
