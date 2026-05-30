import { TextShape } from '@canvasync/shared';

// Map font family IDs to CSS font strings
export function getFontCSS(fontFamily?: string): string {
  switch (fontFamily) {
    case 'Playwrite GB J': return "'Playwrite GB J', cursive";
    case 'Cascadia Code': return "'Cascadia Code', monospace";
    case 'Roboto': return "'Roboto', sans-serif";
    case 'Noto Sans':
    default: return "'Noto Sans', sans-serif";
  }
}

let tempCtx: CanvasRenderingContext2D | null = null;
function getTempCtx() {
  if (!tempCtx) {
    const canvas = document.createElement('canvas');
    tempCtx = canvas.getContext('2d');
  }
  return tempCtx;
}

export class TextRenderer {
  static measure(shape: TextShape): { width: number; height: number } {
    const content = shape.content || '';
    if (!content) return { width: 80, height: 20 };
    
    const ctx = getTempCtx();
    if (!ctx) return { width: shape.width || 80, height: shape.height || 20 };
    
    const fontSize = shape.fontSize || 20;
    const fontCSS = getFontCSS(shape.fontFamily);
    ctx.font = `${fontSize}px ${fontCSS}`;
    
    const lines = content.split('\n');
    let maxWidth = 0;
    lines.forEach(line => {
      const metrics = ctx.measureText(line);
      if (metrics.width > maxWidth) {
        maxWidth = metrics.width;
      }
    });
    
    const height = lines.length * fontSize * 1.5;
    return {
      width: Math.max(80, maxWidth),
      height: height
    };
  }

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
    
    const measuredWidth = this.measure(shape).width;

    lines.forEach((line, i) => {
      let renderX = shape.x;
      if (ctx.textAlign === 'center') {
        renderX = shape.x + measuredWidth / 2;
      } else if (ctx.textAlign === 'right') {
        renderX = shape.x + measuredWidth;
      }
      ctx.fillText(line, renderX, shape.y + i * lineHeight);
    });
  }
}

