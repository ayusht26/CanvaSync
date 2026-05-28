/**
 * SceneGraphService — a global singleton reference to the active SceneGraph instance.
 * This allows React components and hooks (keyboard, StylePanel) to mutate shapes
 * directly through the SceneGraph (source of truth) rather than only through Zustand.
 *
 * Data flow: SceneGraph → Zustand store (read-only mirror for React UI)
 * NEVER: Zustand store → SceneGraph (causes feedback loops)
 */
import { SceneGraph } from '../canvas/SceneGraph.js';

let _instance: SceneGraph | null = null;

export const SceneGraphService = {
  set(sg: SceneGraph) {
    _instance = sg;
  },

  get(): SceneGraph | null {
    return _instance;
  },

  remove(id: string) {
    _instance?.remove(id);
  },

  update(id: string, updates: any) {
    _instance?.update(id, updates);
  },

  clear() {
    _instance = null;
  },
};
