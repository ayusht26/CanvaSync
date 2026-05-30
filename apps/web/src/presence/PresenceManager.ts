import { useRoomStore } from '../store/useRoomStore.js';
import { AwarenessState } from '@canvasync/shared';

export class PresenceManager {
  private awareness: any;
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
        if (state.user) {
          collaborators.set(clientID.toString(), {
            ...state.user,
            id: clientID.toString(),
            // Problem 1 fix: mark own entry so CursorRenderer skips it
            isLocal: clientID === this.awareness.clientID,
            cursor: state.cursor,
          });
        }
      });

      useRoomStore.getState().setCollaborators(collaborators);
    });
  }

  public updateCursor(x: number, y: number) {
    this.awareness.setLocalStateField('cursor', { x, y });
  }

  public setUserInfo(name: string, color: string, userId: string, joinedAt?: number) {
    this.awareness.setLocalStateField('user', { name, color, userId, joinedAt: joinedAt || Date.now() });
  }

}
