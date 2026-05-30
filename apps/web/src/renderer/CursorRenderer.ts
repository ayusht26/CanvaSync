import { Camera } from '../canvas/Camera.js';

// Per-collaborator lerp state
const smoothed = new Map<string, { sx: number; sy: number }>();
const LERP = 0.75;

export class CursorRenderer {
  static draw(
    ctx: CanvasRenderingContext2D,
    collaborators: Map<string, any>,
    camera: Camera
  ) {
    // Clean up stale entries
    const activeIds = new Set(collaborators.keys());
    for (const id of smoothed.keys()) {
      if (!activeIds.has(id)) smoothed.delete(id);
    }

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    collaborators.forEach((user) => {
      if (user.isLocal) return;
      if (!user.cursor) return;

      const { x, y } = user.cursor;
      const targetSX = x * camera.zoom + camera.x;
      const targetSY = y * camera.zoom + camera.y;

      const prev = smoothed.get(user.id) ?? { sx: targetSX, sy: targetSY };
      const sx = prev.sx + (targetSX - prev.sx) * LERP;
      const sy = prev.sy + (targetSY - prev.sy) * LERP;
      smoothed.set(user.id, { sx, sy });

      const color = user.color || '#6366f1';
      const name = user.name || 'Anonymous';

      ctx.save();
      ctx.translate(sx, sy);

      // ── Shadow / glow beneath cursor ──────────────────────────────────
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      // ── Cursor arrow shape ─────────────────────────────────────────────
      // Tip is at (0,0). Body extends down-right.
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 18);
      ctx.lineTo(4.5, 14);
      ctx.lineTo(10, 20);
      ctx.lineTo(12.5, 17.5);
      ctx.lineTo(7, 11.5);
      ctx.lineTo(12, 5);
      ctx.closePath();

      // Fill with user color
      ctx.fillStyle = color;
      ctx.fill();

      // White outline for contrast on any background
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Subtle inner dark border for depth
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 0.75;
      ctx.stroke();

      // ── Name tag ───────────────────────────────────────────────────────
      const tagFontSize = 11;
      const tagFont = `600 ${tagFontSize}px -apple-system, "Inter", sans-serif`;
      ctx.font = tagFont;

      const paddingX = 8;
      const paddingY = 5;
      const textW = ctx.measureText(name).width;
      const tagW = textW + paddingX * 2;
      const tagH = tagFontSize + paddingY * 2;

      // Position: 14px right, 14px down from the tip
      const tagX = 14;
      const tagY = 14;
      const r = 6;

      // Tag shadow
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      // Tag background — pill shape with user color
      ctx.beginPath();
      ctx.moveTo(tagX + r, tagY);
      ctx.lineTo(tagX + tagW - r, tagY);
      ctx.arcTo(tagX + tagW, tagY,         tagX + tagW, tagY + r,         r);
      ctx.lineTo(tagX + tagW, tagY + tagH - r);
      ctx.arcTo(tagX + tagW, tagY + tagH,  tagX + tagW - r, tagY + tagH,  r);
      ctx.lineTo(tagX + r,   tagY + tagH);
      ctx.arcTo(tagX,        tagY + tagH,  tagX, tagY + tagH - r,         r);
      ctx.lineTo(tagX,       tagY + r);
      ctx.arcTo(tagX,        tagY,         tagX + r, tagY,                r);
      ctx.closePath();

      ctx.fillStyle = color;
      ctx.fill();

      // Reset shadow for text
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Tag text — white, centered vertically
      ctx.fillStyle = '#ffffff';
      ctx.font = tagFont;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText(name, tagX + paddingX, tagY + tagH / 2);

      ctx.restore();
    });

    ctx.restore();
  }
}
