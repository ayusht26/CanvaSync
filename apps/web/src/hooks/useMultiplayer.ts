import { useEffect, useRef, useState } from 'react';
import { YjsProvider } from '../multiplayer/YjsProvider.js';
import { SyncManager } from '../multiplayer/SyncManager.js';
import { PresenceManager } from '../presence/PresenceManager.js';
import { SceneGraph } from '../canvas/SceneGraph.js';
import { useRoomStore } from '../store/useRoomStore.js';

export const useMultiplayer = (roomId: string | null, sceneGraph: SceneGraph) => {
  const { localUser } = useRoomStore();
  const [provider, setProviderState] = useState<YjsProvider | null>(null);
  const syncManagerRef = useRef<SyncManager | null>(null);
  const presenceManagerRef = useRef<PresenceManager | null>(null);

  useEffect(() => {
    if (!roomId || !localUser) {
      setProviderState(null);
      useRoomStore.getState().setProvider(null);
      return;
    }

    const provider = new YjsProvider(roomId);
    setProviderState(provider);
    useRoomStore.getState().setProvider(provider);

    const syncManager = new SyncManager(provider.elements, sceneGraph);
    syncManagerRef.current = syncManager;

    const presenceManager = new PresenceManager(provider.awareness, roomId);
    presenceManagerRef.current = presenceManager;

    // Set initial user info with sessionStorage-stable joinedAt
    let joinedAtStr = sessionStorage.getItem('canvasync-joined-at');
    if (!joinedAtStr) {
      joinedAtStr = Date.now().toString();
      sessionStorage.setItem('canvasync-joined-at', joinedAtStr);
    }
    const joinedAt = parseInt(joinedAtStr, 10);

    presenceManager.setUserInfo(localUser.name, localUser.color, useRoomStore.getState().localUserId, joinedAt);
    
    useRoomStore.getState().setPresenceManager(presenceManager);

    return () => {
      useRoomStore.getState().setPresenceManager(null);
      useRoomStore.getState().setProvider(null);
      provider.disconnect();
      setProviderState(null);
      syncManagerRef.current = null;
      presenceManagerRef.current = null;
    };
  }, [roomId, localUser, sceneGraph]);

  return {
    provider,
    syncManager: syncManagerRef.current,
    presenceManager: presenceManagerRef.current,
  };
};

