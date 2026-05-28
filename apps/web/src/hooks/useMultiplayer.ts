import { useEffect, useRef } from 'react';
import { YjsProvider } from '../multiplayer/YjsProvider.js';
import { SyncManager } from '../multiplayer/SyncManager.js';
import { PresenceManager } from '../presence/PresenceManager.js';
import { SceneGraph } from '../canvas/SceneGraph.js';
import { useRoomStore } from '../store/useRoomStore.js';

export const useMultiplayer = (roomId: string | null, sceneGraph: SceneGraph) => {
  const { localUser } = useRoomStore();
  const providerRef = useRef<YjsProvider | null>(null);
  const syncManagerRef = useRef<SyncManager | null>(null);
  const presenceManagerRef = useRef<PresenceManager | null>(null);

  useEffect(() => {
    if (!roomId || !localUser) return;

    const provider = new YjsProvider(roomId);
    providerRef.current = provider;

    const syncManager = new SyncManager(provider.elements, sceneGraph);
    syncManagerRef.current = syncManager;

    const presenceManager = new PresenceManager(provider.awareness, roomId);
    presenceManagerRef.current = presenceManager;

    // Set initial user info
    presenceManager.setUserInfo(localUser.name, localUser.color);

    return () => {
      provider.disconnect();
      providerRef.current = null;
      syncManagerRef.current = null;
      presenceManagerRef.current = null;
    };
  }, [roomId, localUser, sceneGraph]);

  return {
    provider: providerRef.current,
    syncManager: syncManagerRef.current,
    presenceManager: presenceManagerRef.current,
  };
};
