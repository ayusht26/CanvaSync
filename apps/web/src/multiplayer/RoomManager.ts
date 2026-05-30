import { Shape } from '@canvasync/shared';
import { useRoomStore } from '../store/useRoomStore.js';

export class RoomManager {
  // In production, API calls go to the Railway Fastify server (VITE_API_URL).
  // In local dev, they go to the local Fastify server on port 3001.
  private static get BASE_URL(): string {
    return (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:3001';
  }

  static async createRoom(name?: string, _initialElements?: Shape[]): Promise<string> {
    const url = `${RoomManager.BASE_URL}/rooms`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as any).error || 'Failed to create room');
    }

    const room = await response.json();

    // The server returns { id, name, ... } — use room.id
    return room.id;
  }

  static async getRoom(id: string) {
    const url = `${RoomManager.BASE_URL}/rooms/${id}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return response.json();
  }

  static navigateToRoom(id: string, navigate: (path: string) => void) {
    useRoomStore.getState().setRoomId(id);
    navigate(`/room/${id}`);
  }
}
