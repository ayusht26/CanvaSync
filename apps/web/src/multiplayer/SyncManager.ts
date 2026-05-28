import * as Y from 'yjs';
import { Shape } from '@canvasync/shared';
import { SceneGraph } from '../canvas/SceneGraph';

export class SyncManager {
  private yElements: Y.Map<Shape>;
  private sceneGraph: SceneGraph;
  private isApplyingRemoteChange = false;

  constructor(yElements: Y.Map<Shape>, sceneGraph: SceneGraph) {
    this.yElements = yElements;
    this.sceneGraph = sceneGraph;

    // 1. Initial Sync: Yjs -> SceneGraph
    this.syncRemoteToLocal();

    // 2. Listen for remote changes
    this.yElements.observe((event) => {
      // Ignore local changes that we just sent to Yjs
      if (event.transaction.local && event.transaction.origin !== 'db-load') return;
      this.syncRemoteToLocal();
    });

    // 3. Listen for local changes
    this.sceneGraph.subscribe(() => {
      if (this.isApplyingRemoteChange) return;
      this.syncLocalToRemote();
    });
  }

  private syncRemoteToLocal() {
    this.isApplyingRemoteChange = true;
    try {
      const shapes = Array.from(this.yElements.values());
      // Sort by zIndex to preserve rendering order
      const sortedShapes = [...shapes].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      this.sceneGraph.setShapes(sortedShapes);
    } finally {
      this.isApplyingRemoteChange = false;
    }
  }

  private syncLocalToRemote() {
    const shapes = this.sceneGraph.getElements();
    
    this.yElements.doc?.transact(() => {
      // Add or Update shapes in Yjs
      shapes.forEach((shape: Shape) => {
        const existing = this.yElements.get(shape.id);
        // Basic deep equality check to avoid redundant updates
        if (!existing || JSON.stringify(existing) !== JSON.stringify(shape)) {
          this.yElements.set(shape.id, shape);
        }
      });

      // Remove deleted shapes from Yjs
      const currentIds = new Set(shapes.map((s: Shape) => s.id));
      for (const id of this.yElements.keys()) {
        if (!currentIds.has(id)) {
          this.yElements.delete(id);
        }
      }
    }, 'local-sync');
  }
}
