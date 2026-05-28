import { useEffect, useRef, useMemo } from 'react';
import { Camera } from '../canvas/Camera.js';
import { SceneGraph } from '../canvas/SceneGraph.js';
import { CanvasEngine } from '../canvas/CanvasEngine.js';
import { CanvasEventHandler } from '../canvas/CanvasEventHandler.js';
import { ToolManager } from '../tools/ToolManager.js';
import { useCanvasStore } from '../store/useCanvasStore.js';
import { useShapeStore } from '../store/useShapeStore.js';
import { ToolName } from '@canvasync/shared';
import { SceneGraphService } from '../canvas/SceneGraphService.js';

import { SelectionTool } from '../tools/SelectionTool.js';
import { PanTool } from '../tools/PanTool.js';
import { PenTool } from '../tools/PenTool.js';
import { RectangleTool } from '../tools/RectangleTool.js';
import { EllipseTool } from '../tools/EllipseTool.js';
import { TriangleTool } from '../tools/TriangleTool.js';
import { RhombusTool } from '../tools/RhombusTool.js';
import { LineTool } from '../tools/LineTool.js';
import { ArrowTool } from '../tools/ArrowTool.js';
import { TextTool } from '../tools/TextTool.js';
import { EraserTool } from '../tools/EraserTool.js';

export const useCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const toolManagerRef = useRef<ToolManager | null>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const sceneGraphRef = useRef<SceneGraph | null>(null);

  const camera = useMemo(() => new Camera(), []);
  const sceneGraph = useMemo(() => new SceneGraph(), []);
  sceneGraphRef.current = sceneGraph;

  const activeToolName = useCanvasStore((state) => state.activeTool);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const engine = new CanvasEngine(canvas, camera, sceneGraph);
    engineRef.current = engine;

    const toolManager = new ToolManager(engine);
    toolManagerRef.current = toolManager;

    // Register all tools
    toolManager.registerTool(ToolName.SELECTION, new SelectionTool(engine));
    toolManager.registerTool(ToolName.PAN, new PanTool(engine));
    toolManager.registerTool(ToolName.PEN, new PenTool(engine));
    toolManager.registerTool(ToolName.RECTANGLE, new RectangleTool(engine));
    toolManager.registerTool(ToolName.ELLIPSE, new EllipseTool(engine));
    toolManager.registerTool(ToolName.TRIANGLE, new TriangleTool(engine));
    toolManager.registerTool(ToolName.RHOMBUS, new RhombusTool(engine));
    toolManager.registerTool(ToolName.LINE, new LineTool(engine));
    toolManager.registerTool(ToolName.ARROW, new ArrowTool(engine));
    toolManager.registerTool(ToolName.TEXT, new TextTool(engine));
    toolManager.registerTool(ToolName.ERASER, new EraserTool(engine));

    toolManager.setTool(useCanvasStore.getState().activeTool);

    const eventHandler = new CanvasEventHandler(canvas, engine, camera, sceneGraph, toolManager);
    // Register sceneGraph globally so keyboard/UI can mutate it directly
    SceneGraphService.set(sceneGraph);
    sceneGraph.setShapes(useShapeStore.getState().elements);
    engine.start();

    // Sync Zustand camera store → Camera class (for zoom button clicks)
    const unsub = useCanvasStore.subscribe((state) => {
      const c = state.camera;
      if (camera.x !== c.x || camera.y !== c.y || camera.zoom !== c.zoom) {
        camera.x = c.x;
        camera.y = c.y;
        camera.zoom = c.zoom;
        engine.render();
      }
    });

    // Sync SceneGraph → shape store on changes
    const unsubScene = sceneGraph.subscribe(() => {
      useShapeStore.getState().setElements(sceneGraph.getElements());
    });

    return () => {
      engine.destroy();
      eventHandler.cleanup();
      unsub();
      unsubScene();
      SceneGraphService.clear();
      toolManagerRef.current = null;
      engineRef.current = null;
    };
  }, [camera, sceneGraph]);

  // Sync active tool from store → ToolManager
  useEffect(() => {
    toolManagerRef.current?.setTool(activeToolName);
  }, [activeToolName]);

  return { canvasRef, camera, sceneGraph };
};
