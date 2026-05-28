import { Camera } from '../canvas/Camera.js';

export class CursorRenderer {
  static draw(ctx: CanvasRenderingContext2D, collaborators: Map<string, any>, camera: Camera) {
    collaborators.forEach((user) => {
      if (!user.cursor) return;

      const { x, y } = user.cursor;
      const screenX = x * camera.zoom + camera.x;
      const screenY = y * camera.zoom + camera.y;

      // Draw cursor arrow
      ctx.save();
      ctx.translate(screenX, screenY);
      
      ctx.fillStyle = user.color || '#ff0000';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 15);
      ctx.lineTo(4, 11);
      ctx.lineTo(10, 11);
      ctx.closePath();
      ctx.fill();

      // Draw name tag
      ctx.font = '12px Geist, sans-serif';
      const name = user.name || 'Anonymous';
      const textWidth = ctx.measureText(name).width;
      
      ctx.fillStyle = user.color || '#ff0000';
      ctx.fillRect(10, 15, textWidth + 10, 20);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillText(name, 15, 30);
      
      ctx.restore();
    });
  }
}
