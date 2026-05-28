import { Point } from './shapes';

export interface CursorState extends Point {
  tool: string;
}

export interface AwarenessState {
  user: {
    id: string;
    name: string;
    color: string;
  };
  cursor: CursorState | null;
  selectedShapeIds: string[];
  lastSeen: number;
}
