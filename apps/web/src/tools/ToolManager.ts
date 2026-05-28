import { CanvasEngine } from '../canvas/CanvasEngine.js';
import { BaseTool } from './BaseTool.js';
import { ToolName } from '@canvasync/shared';
import { useCanvasStore } from '../store/useCanvasStore.js';
import { useSelectionStore } from '../store/useSelectionStore.js';

export class ToolManager {
  private activeTool: BaseTool | null = null;
  private tools: Map<string, BaseTool> = new Map();
  private previousTool: string | null = null;

  constructor(private engine: CanvasEngine) {
    // Listen for spacebar override
    useCanvasStore.subscribe((state) => {
      if (state.isSpacebarHeld && state.activeTool !== ToolName.PAN) {
        this.previousTool = state.activeTool;
        this.setToolInternal(ToolName.PAN);
      } else if (!state.isSpacebarHeld && this.previousTool) {
        this.setToolInternal(this.previousTool);
        this.previousTool = null;
      }
    });
  }

  registerTool(name: string, tool: BaseTool) {
    this.tools.set(name, tool);
  }

  setTool(name: string) {
    this.setToolInternal(name);
  }

  private setToolInternal(name: string) {
    const tool = this.tools.get(name);
    if (!tool) { console.warn(`Tool "${name}" not registered`); return; }
    
    this.activeTool?.deactivate();
    
    // Clear selection when switching away from selection tool
    if (name !== ToolName.SELECTION) {
      useSelectionStore.getState().clearSelection();
    }
    
    this.activeTool = tool;
    this.activeTool.activate();
  }

  getActiveTool(): BaseTool | null {
    return this.activeTool;
  }
}
