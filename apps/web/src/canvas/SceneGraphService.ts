import { SceneGraph } from '../canvas/SceneGraph.js';
import { CanvasEngine } from '../canvas/CanvasEngine.js';

let _instance: SceneGraph | null = null;
let _engine: CanvasEngine | null = null;

export const SceneGraphService = {
  set(sg: SceneGraph) { _instance = sg; },
  setEngine(engine: CanvasEngine) { _engine = engine; },
  get(): SceneGraph | null { return _instance; },
  getEngine(): CanvasEngine | null { return _engine; },
  remove(id: string) { _instance?.remove(id); },
  update(id: string, updates: any) { _instance?.update(id, updates); },
  clear() { _instance = null; },
  clearEngine() { _engine = null; },
};
