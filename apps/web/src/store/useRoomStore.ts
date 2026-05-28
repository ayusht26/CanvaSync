import { create } from 'zustand';
import { AwarenessState } from '@canvasync/shared';

interface RoomState {
  roomId: string | null;
  collaborators: Map<string, AwarenessState>;
  presentationMode: boolean;
  localUser: { name: string; color: string } | null;
  
  setRoomId: (id: string | null) => void;
  setCollaborators: (collaborators: Map<string, AwarenessState>) => void;
  updateCollaborator: (id: string, presence: AwarenessState) => void;
  removeCollaborator: (id: string) => void;
  setPresentationMode: (mode: boolean) => void;
  setLocalUser: (user: { name: string; color: string } | null) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomId: null,
  collaborators: new Map(),
  presentationMode: false,
  localUser: null,

  setRoomId: (roomId) => set({ roomId }),
  
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
}));
