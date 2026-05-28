import { BaseTool, ToolEvent } from './BaseTool.js';
import { ShapeType, Shape } from '@canvasync/shared';
import { ShapeFactory } from '../shapes/ShapeFactory.js';

export abstract class ShapeTool extends BaseTool {
  protected abstract shapeType: ShapeType;
  protected currentShape: Shape | null = null;
  protected startX = 0;
  protected startY = 0;
  // Track current dimensions separately — this.currentShape is the INITIAL object
  // and sceneGraph.update() only updates the internal SceneGraph copy, not this ref.
  protected currentW = 0;
  protected currentH = 0;

  onPointerDown(e: ToolEvent): void {
    const { worldX, worldY, sceneGraph, styleStore } = e;
    this.startX = worldX;
    this.startY = worldY;
    this.currentW = 0;
    this.currentH = 0;
    const { strokeColor, fillColor, strokeWidth, strokeStyle, opacity } = styleStore.getState();
    this.currentShape = ShapeFactory.createShape(
      this.shapeType, worldX, worldY,
      { strokeColor, fillColor, strokeWidth, strokeStyle, opacity }
    );
    sceneGraph.add(this.currentShape);
    this.engine.render();
  }

  onPointerMove(e: ToolEvent): void {
    const { worldX, worldY, shiftKey } = e;
    if (!this.currentShape) return;

    let width = worldX - this.startX;
    let height = worldY - this.startY;

    // SHIFT = constrain to square
    if (shiftKey) {
      const side = Math.sign(width) * Math.min(Math.abs(width), Math.abs(height));
      width = side;
      height = Math.sign(height) * Math.abs(side);
    }

    const x = width < 0 ? this.startX + width : this.startX;
    const y = height < 0 ? this.startY + height : this.startY;
    this.currentW = Math.abs(width);
    this.currentH = Math.abs(height);

    e.sceneGraph.update(this.currentShape.id, {
      x, y,
      width: this.currentW,
      height: this.currentH,
    });
    this.engine.render();
  }

  onPointerUp(e: ToolEvent): void {
    if (!this.currentShape) return;
    // Use tracked dimensions — NOT this.currentShape.width/height which are always 0
    // (sceneGraph.update only updates the sceneGraph's internal copy, not this reference)
    if (this.currentW < 2 && this.currentH < 2) {
      e.sceneGraph.remove(this.currentShape.id);
    } else {
      e.sceneGraph.update(this.currentShape.id, { updatedAt: Date.now() });
    }
    this.currentShape = null;
    this.currentW = 0;
    this.currentH = 0;
    this.engine.render();
  }
}
