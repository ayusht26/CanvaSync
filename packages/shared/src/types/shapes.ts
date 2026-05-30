export type ShapeType =
  | 'rectangle'
  | 'ellipse'
  | 'triangle'
  | 'rhombus'
  | 'line'
  | 'arrow'
  | 'pen'
  | 'text'
  | 'image';

export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AnchorSide = 'top' | 'right' | 'bottom' | 'left' | 'center';

export interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeStyle: StrokeStyle;
  opacity: number;
  zIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface RectangleShape extends BaseShape {
  type: 'rectangle';
  cornerRadius: number;
}

export interface EllipseShape extends BaseShape {
  type: 'ellipse';
}

export interface TriangleShape extends BaseShape {
  type: 'triangle';
}

export interface RhombusShape extends BaseShape {
  type: 'rhombus';
}

export interface LineShape extends BaseShape {
  type: 'line';
  points: Point[];
}

export interface ArrowShape extends BaseShape {
  type: 'arrow';
  points: Point[];
  startShapeId?: string;
  endShapeId?: string;
  /** 0-1 relative position on connected start shape */
  startAnchor?: { rx: number; ry: number };
  /** 0-1 relative position on connected end shape */
  endAnchor?: { rx: number; ry: number };
  /** Routing mode */
  lineStyle?: 'straight' | 'elbow';
  /** Arrowhead at start (p1) */
  startArrowHead?: 'none' | 'arrow';
  /** Arrowhead at end (p2) */
  endArrowHead?: 'none' | 'arrow';
  /** World coordinate of the control point for bezier curve or elbow offset */
  bend?: number;
  /** @deprecated use endArrowHead instead */
  arrowHead?: 'arrow' | 'dot' | 'none';
}

export interface PenShape extends BaseShape {
  type: 'pen';
  points: Point[];
}

export interface TextShape extends BaseShape {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  textColor?: string;
}

export interface ImageShape extends BaseShape {
  type: 'image';
  dataUrl: string;
}

export type Shape =
  | RectangleShape
  | EllipseShape
  | TriangleShape
  | RhombusShape
  | LineShape
  | ArrowShape
  | PenShape
  | TextShape
  | ImageShape;
