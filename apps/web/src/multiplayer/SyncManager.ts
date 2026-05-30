import * as Y from 'yjs';
import { Shape } from '@canvasync/shared';
import { SceneGraph } from '../canvas/SceneGraph.js';

export class SyncManager {
  private yElements: Y.Map<Shape>;
  private sceneGraph: SceneGraph;
  private isApplyingRemoteChange = false;
  // Track IDs of shapes that are currently being drawn locally (our own live strokes)
  private localLiveIds = new Set<string>();
  private syncPending = false;

  constructor(yElements: Y.Map<Shape>, sceneGraph: SceneGraph) {
    this.yElements = yElements;
    this.sceneGraph = sceneGraph;

    this.syncRemoteToLocal();

    this.yElements.observe((event) => {
      if (event.transaction.local && event.transaction.origin !== 'db-load') return;
      this.syncRemoteToLocal();
    });

    this.sceneGraph.subscribe(() => {
      if (this.isApplyingRemoteChange) return;
      this.scheduleSyncLocalToRemote();
    });
  }

  private scheduleSyncLocalToRemote() {
    if (this.syncPending) return;
    this.syncPending = true;
    requestAnimationFrame(() => {
      this.syncPending = false;
      this.syncLocalToRemote();
    });
  }

  private syncRemoteToLocal() {
    this.isApplyingRemoteChange = true;
    try {
      const remoteShapes = Array.from(this.yElements.values());

      // Identify our own local live shapes
      const ourLiveShapes = this.sceneGraph
        .getElements()
        .filter((s: any) => this.localLiveIds.has(s.id));

      const ourLiveById = new Map<string, Shape>(ourLiveShapes.map(s => [s.id, s]));

      // Merge remote shapes and our local live shapes.
      // If a shape is currently being drawn locally (is in ourLiveById), 
      // we MUST use our local version and discard the remote lagging echo/snapshot.
      const merged = remoteShapes.map(remoteShape => {
        const localLive = ourLiveById.get(remoteShape.id);
        return localLive ? localLive : remoteShape;
      });

      // Also append any local live shapes that are not yet present in remoteShapes
      const remoteIds = new Set(remoteShapes.map(s => s.id));
      ourLiveShapes.forEach(liveShape => {
        if (!remoteIds.has(liveShape.id)) {
          merged.push(liveShape);
        }
      });

      const sorted = merged.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      this.sceneGraph.setShapes(sorted);
    } finally {
      this.isApplyingRemoteChange = false;
    }
  }

  private syncLocalToRemote() {
    const shapes = this.sceneGraph.getElements();

    // Separate live (in-progress) from stable shapes
    const liveShapes   = shapes.filter((s: any) => s._live);
    const stableShapes = shapes.filter((s: any) => !s._live);

    // Update our tracking set
    this.localLiveIds = new Set(liveShapes.map(s => s.id));

    // Batch both live shapes and stable shapes inside a single Yjs transaction.
    // This dramatically reduces websocket framing/acknowledgement overhead and avoids network queue clogging.
    this.yElements.doc?.transact(() => {
      // Sync live shapes
      liveShapes.forEach((shape: any) => {
        const existing = this.yElements.get(shape.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(shape)) {
          this.yElements.set(shape.id, shape);
        }
      });

      // Sync stable shapes
      stableShapes.forEach((shape: Shape) => {
        const existing = this.yElements.get(shape.id);
        if (!existing || JSON.stringify(existing) !== JSON.stringify(shape)) {
          this.yElements.set(shape.id, shape);
        }
      });

      const currentIds = new Set(shapes.map((s: Shape) => s.id));
      for (const id of this.yElements.keys()) {
        if (!currentIds.has(id)) {
          this.yElements.delete(id);
        }
      }
    }, 'local-sync');
  }
}
