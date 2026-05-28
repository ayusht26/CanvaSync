import { nanoid } from 'nanoid';
import { 
  Shape, 
  ShapeType, 
  Point, 
  StrokeStyle 
} from '@canvasync/shared';
import {
  DEFAULT_STROKE_COLOR,
  DEFAULT_FILL_COLOR,
  DEFAULT_STROKE_WIDTH,
  DEFAULT_STROKE_STYLE,
  DEFAULT_OPACITY,
  DEFAULT_CORNER_RADIUS,
} from '@canvasync/shared';

export interface ShapeStyles {
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  strokeStyle?: StrokeStyle;
  opacity?: number;
}

export class ShapeFactory {
  static createShape(
    type: ShapeType, 
    x: number, 
    y: number, 
    styles: ShapeStyles = {}
  ): Shape {
    const base = {
      id: nanoid(),
      x,
      y,
      width: 0,
      height: 0,
      rotation: 0,
      strokeColor: styles.strokeColor ?? DEFAULT_STROKE_COLOR,
      fillColor: styles.fillColor ?? DEFAULT_FILL_COLOR,
      strokeWidth: styles.strokeWidth ?? DEFAULT_STROKE_WIDTH,
      strokeStyle: styles.strokeStyle ?? DEFAULT_STROKE_STYLE,
      opacity: styles.opacity ?? DEFAULT_OPACITY,
      zIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    switch (type) {
      case 'rectangle':
        return {
          ...base,
          type: 'rectangle',
          cornerRadius: DEFAULT_CORNER_RADIUS,
        };
      case 'ellipse':
        return {
          ...base,
          type: 'ellipse',
        };
      case 'pen':
        return {
          ...base,
          type: 'pen',
          points: [{ x, y }],
        };
      case 'line':
        return {
          ...base,
          type: 'line',
          points: [{ x, y }, { x, y }],
        };
      case 'triangle':
        return { ...base, type: 'triangle' };
      case 'rhombus':
        return { ...base, type: 'rhombus' };
      case 'arrow':
        return { 
          ...base, 
          type: 'arrow', 
          points: [{ x, y }, { x, y }],
          arrowHead: 'arrow'
        };
      case 'text':
        return {
          ...base,
          type: 'text',
          content: '',
          fontSize: 20,
          fontFamily: 'Arial',
          textAlign: 'left',
          textColor: base.strokeColor
        };
      default:
        throw new Error(`Unsupported shape type: ${type}`);
    }
  }
}
