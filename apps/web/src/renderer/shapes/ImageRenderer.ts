import { ImageShape } from '@canvasync/shared';
import { SceneGraphService } from '../../canvas/SceneGraphService.js';

const imageCache = new Map<string, HTMLImageElement>();

export class ImageRenderer {
  static draw(ctx: CanvasRenderingContext2D, shape: ImageShape) {
    const { id, dataUrl, x, y, width, height } = shape;

    let img = imageCache.get(id);
    if (!img) {
      img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const engine = SceneGraphService.getEngine();
        if (engine) engine.render();
      };
      imageCache.set(id, img);
    }

    if (img.complete && img.naturalWidth !== 0) {
      ctx.drawImage(img, x, y, width, height);
    } else {
      // Loading state: placeholder dashed outline
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x, y, width, height);
      ctx.restore();
    }
  }
}
