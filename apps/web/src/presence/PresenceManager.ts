import * as Y from 'yjs';
import { useRoomStore } from '../store/useRoomStore.js';
import { CursorState, AwarenessState } from '@canvasync/shared';

export class PresenceManager {
  private awareness: any; // Awareness from y-websocket
  private roomId: string;

  constructor(awareness: any, roomId: string) {
    this.awareness = awareness;
    this.roomId = roomId;
    this.setupListeners();
  }

  private setupListeners() {
    this.awareness.on('change', () => {
      const states = this.awareness.getStates() as Map<number, AwarenessState>;
      const collaborators = new Map<string, any>();

      states.forEach((state, clientID) => {
        // We include our own local user here so it is tracked in the room store
        // but we can distinguish it by checking if clientID === this.awareness.clientID
        if (state.user) {
          collaborators.set(clientID.toString(), {
            ...state.user,
            id: clientID.toString(),
            isLocal: clientID === this.awareness.clientID,
            cursor: state.cursor
          });
        }
      });

      useRoomStore.getState().setCollaborators(collaborators);
    });
  }

  public updateCursor(x: number, y: number) {
    this.awareness.setLocalStateField('cursor', { x, y });
  }

  public setUserInfo(name: string, color: string, userId: string) {
    this.awareness.setLocalStateField('user', { name, color, userId });
  }
}
