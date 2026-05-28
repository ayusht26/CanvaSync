import { TextShape } from '@canvasync/shared';

// Map font family IDs to CSS font strings
function getFontCSS(fontFamily?: string): string {
  switch (fontFamily) {
    case 'Playwrite GB J': return "'Playwrite GB J', cursive";
    case 'Cascadia Code': return "'Cascadia Code', monospace";
    case 'Roboto': return "'Roboto', sans-serif";
    case 'Noto Sans':
    default: return "'Noto Sans', sans-serif";
  }
}

export class TextRenderer {
  static draw(ctx: CanvasRenderingContext2D, shape: TextShape) {
    if (!shape.content) return;
    const fontSize = shape.fontSize || 20;
    const fontCSS = getFontCSS(shape.fontFamily);
    ctx.font = `${fontSize}px ${fontCSS}`;
    ctx.fillStyle = shape.textColor || shape.strokeColor || '#ffffff';
    ctx.textAlign = (shape.textAlign as CanvasTextAlign) || 'left';
    ctx.textBaseline = 'top';
    const lines = shape.content.split('\n');
    const lineHeight = fontSize * 1.5;
    lines.forEach((line, i) => {
      let renderX = shape.x;
      if (ctx.textAlign === 'center') {
        renderX = shape.x + (shape.width || 0) / 2;
      } else if (ctx.textAlign === 'right') {
        renderX = shape.x + (shape.width || 0);
      }
      ctx.fillText(line, renderX, shape.y + i * lineHeight);
    });
  }
}
