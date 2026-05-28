import { Shape } from '@canvasync/shared';
import { useRoomStore } from '../store/useRoomStore.js';

export class RoomManager {
  private static BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  static async createRoom(name?: string, initialElements?: Shape[]): Promise<string> {
    const response = await fetch(`${this.BASE_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        // If initialElements are provided, we might want to send them
        // Note: The current server implementation doesn't handle this in /rooms POST
        // but it could be extended or handled via Yjs sync after joining.
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create room');
    }

    const room = await response.json();
    
    // If we have initial elements, we could potentially push them via SyncManager
    // or another API call. For now, we'll just return the room ID.
    
    return room.roomId;
  }

  static navigateToRoom(id: string, navigate: (path: string) => void) {
    useRoomStore.getState().setRoomId(id);
    navigate(`/room/${id}`);
  }
}
