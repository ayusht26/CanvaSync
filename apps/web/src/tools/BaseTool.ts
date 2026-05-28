import { CanvasEngine } from '../canvas/CanvasEngine.js';

import { SceneGraph } from '../canvas/SceneGraph.js';

export interface ToolEvent {
  worldX: number;
  worldY: number;
  screenX: number;
  screenY: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  pressure: number;
  sceneGraph: SceneGraph;
  selectionStore: any;
  canvasStore: any;
  styleStore: any;
}

export abstract class BaseTool {
  constructor(protected engine: CanvasEngine) {}

  abstract onPointerDown(e: ToolEvent): void;
  abstract onPointerMove(e: ToolEvent): void;
  abstract onPointerUp(e: ToolEvent): void;
  
  onKeyDown(e: KeyboardEvent): void {}
  onKeyUp(e: KeyboardEvent): void {}

  // Lifecycle methods
  activate(): void {}
  deactivate(): void {}
}
