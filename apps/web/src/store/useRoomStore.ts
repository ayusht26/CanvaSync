import { create } from 'zustand';
import { AwarenessState } from '@canvasync/shared';
import type { PresenceManager } from '../presence/PresenceManager.js';

interface RoomState {
  roomId: string | null;
  roomName: string | null;
  ownerId: string | null;
  localUserId: string;
  collaborators: Map<string, AwarenessState>;
  presentationMode: boolean;
  localUser: { name: string; color: string } | null;
  presenceManager: PresenceManager | null;
  
  setRoomId: (id: string | null) => void;
  setRoomDetails: (name: string | null, ownerId: string | null) => void;
  setCollaborators: (collaborators: Map<string, AwarenessState>) => void;
  updateCollaborator: (id: string, presence: AwarenessState) => void;
  removeCollaborator: (id: string) => void;
  setPresentationMode: (mode: boolean) => void;
  setLocalUser: (user: { name: string; color: string } | null) => void;
  setPresenceManager: (manager: PresenceManager | null) => void;
}

const getOrCreateUserId = () => {
  let id = localStorage.getItem('canvasync-local-id');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    localStorage.setItem('canvasync-local-id', id);
  }
  return id;
};

export const useRoomStore = create<RoomState>((set) => ({
  roomId: null,
  roomName: null,
  ownerId: null,
  localUserId: getOrCreateUserId(),
  collaborators: new Map(),
  presentationMode: false,
  localUser: null,
  presenceManager: null,

  setRoomId: (roomId) => set({ roomId }),
  setRoomDetails: (roomName, ownerId) => set({ roomName, ownerId }),
  
  setCollaborators: (collaborators) => set({ collaborators }),

  updateCollaborator: (id, presence) =>
    set((state) => {
      const newCollaborators = new Map(state.collaborators);
      newCollaborators.set(id, presence);
      return { collaborators: newCollaborators };
    }),

  removeCollaborator: (id) =>
    set((state) => {
      const newCollaborators = new Map(state.collaborators);
      newCollaborators.delete(id);
      return { collaborators: newCollaborators };
    }),

  setPresentationMode: (presentationMode) => set({ presentationMode }),

  setLocalUser: (localUser) => set({ localUser }),
  
  setPresenceManager: (presenceManager) => set({ presenceManager }),
}));

