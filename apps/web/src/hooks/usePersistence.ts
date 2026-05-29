import { useEffect, useRef } from 'react';
import { openDB } from 'idb';
import { useShapeStore } from '../store/useShapeStore.js';
import { useRoomStore } from '../store/useRoomStore.js';
import { SceneGraph } from '../canvas/SceneGraph.js';

const DB_NAME = 'canvasync-db';
const STORE_NAME = 'local-canvas';

export const usePersistence = (sceneGraph?: SceneGraph) => {
  const elements = useShapeStore((state) => state.elements);
  const roomId = useRoomStore((state) => state.roomId);
  // Track whether the initial load has completed — only save AFTER we've loaded,
  // so that an empty canvas after reset/erase overwrites the old saved data.
  const hasLoaded = useRef(false);

  // Initialize and Load
  useEffect(() => {
    if (roomId) return; // Don't persist local shapes if in a room

    const loadData = async () => {
      try {
        const db = await openDB(DB_NAME, 1, {
          upgrade(db) {
            db.createObjectStore(STORE_NAME);
          },
        });
        const saved = await db.get(STORE_NAME, 'shapes');
        if (saved && sceneGraph) {
          sceneGraph.setShapes(saved); // write directly to sceneGraph
        }
      } catch (err) {
        console.error('Failed to load from IndexedDB', err);
      } finally {
        // Mark load as done regardless — even if nothing was saved yet
        hasLoaded.current = true;
      }
    };

    loadData();
  }, [sceneGraph, roomId]);

  // Autosave — save every time elements changes AFTER the initial load.
  // We intentionally save even when elements is empty (erased / reset canvas).
  useEffect(() => {
    if (roomId) return;
    // Don't save until the initial IDB load has completed to avoid overwriting
    // existing data with an empty array on first render.
    if (!hasLoaded.current) return;

    const saveData = async () => {
      try {
        const db = await openDB(DB_NAME, 1);
        await db.put(STORE_NAME, elements, 'shapes');
      } catch (err) {
        console.error('Failed to save to IndexedDB', err);
      }
    };

    const timeout = setTimeout(saveData, 1000);
    return () => clearTimeout(timeout);
  }, [elements, roomId]);
};
