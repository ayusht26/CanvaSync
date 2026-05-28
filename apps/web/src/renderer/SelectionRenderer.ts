import { Camera } from '../canvas/Camera.js';
import { BoundingBox, Shape } from '@canvasync/shared';

export class SelectionRenderer {
  static draw(
    ctx: CanvasRenderingContext2D,
    selectedIds: Set<string>,
    elements: Shape[],
    camera: Camera,
    selectionBox: BoundingBox | null
  ) {
    // 1. Draw the Rubber-band selection box (during drag-select)
    if (selectionBox) {
      ctx.save();
      // Draw in world space
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(camera.zoom * dpr, 0, 0, camera.zoom * dpr, camera.x * dpr, camera.y * dpr);

      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1 / camera.zoom;
      ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
      
      ctx.beginPath();
      ctx.rect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    if (selectedIds.size === 0) return;

    // 2. Draw Bounding Box and Handles for selected elements
    const selectedElements = elements.filter(el => selectedIds.has(el.id));
    if (selectedElements.length === 0) return;

    // Calculate common bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    selectedElements.forEach(el => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + (el.width || 0));
      maxY = Math.max(maxY, el.y + (el.height || 0));
    });

    const padding = 4 / camera.zoom;
    const boxX = minX - padding;
    const boxY = minY - padding;
    const boxW = (maxX - minX) + padding * 2;
    const boxH = (maxY - minY) + padding * 2;

    const singleShape = selectedElements[0];
    const isSingleRotatable = selectedIds.size === 1 && singleShape.type !== 'pen' && singleShape.type !== 'line' && singleShape.type !== 'arrow';

    ctx.save();
    // Apply camera transform to draw in world space
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(camera.zoom * dpr, 0, 0, camera.zoom * dpr, camera.x * dpr, camera.y * dpr);

    if (isSingleRotatable && singleShape.rotation) {
      const cx = singleShape.x + singleShape.width / 2;
      const cy = singleShape.y + singleShape.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate(singleShape.rotation);
      ctx.translate(-cx, -cy);
    }

    // Main selection border
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5 / camera.zoom;
    ctx.setLineDash([]);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Draw Handles (Corners and Midpoints)
    const handleSize = 8 / camera.zoom;
    const handles = [
      { x: boxX,          y: boxY },          // TL
      { x: boxX + boxW/2, y: boxY },          // TC
      { x: boxX + boxW,   y: boxY },          // TR
      { x: boxX,          y: boxY + boxH/2 }, // ML
      { x: boxX + boxW,   y: boxY + boxH/2 }, // MR
      { x: boxX,          y: boxY + boxH },   // BL
      { x: boxX + boxW/2, y: boxY + boxH },   // BC
      { x: boxX + boxW,   y: boxY + boxH },   // BR
    ];

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1.5 / camera.zoom;

    handles.forEach(h => {
      ctx.beginPath();
      ctx.rect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
      ctx.fill();
      ctx.stroke();
    });

    // Rotate handle — circle above top center
    const rotateDist = 24 / camera.zoom;
    const rotateHandleX = boxX + boxW / 2;
    const rotateHandleY = boxY - rotateDist;
    const rotateR = 6 / camera.zoom;

    // Connecting line
    ctx.beginPath();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1 / camera.zoom;
    ctx.moveTo(boxX + boxW / 2, boxY);
    ctx.lineTo(rotateHandleX, rotateHandleY);
    ctx.stroke();

    // Rotate handle circle with gradient fill for visual clarity
    ctx.beginPath();
    ctx.arc(rotateHandleX, rotateHandleY, rotateR, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5 / camera.zoom;
    ctx.stroke();

    // Draw a rotation arrow icon inside the circle (in world space)
    const arrowR = rotateR * 0.55;
    ctx.save();
    ctx.translate(rotateHandleX, rotateHandleY);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2 / camera.zoom;
    ctx.lineCap = 'round';
    // Draw an arc representing rotation
    ctx.beginPath();
    ctx.arc(0, 0, arrowR, -Math.PI * 0.7, Math.PI * 0.7);
    ctx.stroke();
    // Arrowhead at end
    const arrowAngle = Math.PI * 0.7;
    const ax = Math.cos(arrowAngle) * arrowR;
    const ay = Math.sin(arrowAngle) * arrowR;
    const tipLen = 2 / camera.zoom;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - tipLen * Math.sin(arrowAngle), ay + tipLen * Math.cos(arrowAngle));
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }
}
