import { Shape } from '@canvasync/shared';
import { useRoomStore } from '../store/useRoomStore.js';

export class RoomManager {
  // In production (Vercel), API calls go to /api/* (serverless functions).
  // In local dev, they go to the Fastify server on VITE_API_URL.
  private static get BASE_URL(): string {
    const viteUrl = import.meta.env.VITE_API_URL as string | undefined;
    // If running on Vercel (or any non-localhost origin), use relative /api path
    if (!viteUrl || viteUrl.includes('localhost')) {
      // Check if we're in production by looking at the hostname
      if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
        return ''; // relative URL → /api/rooms will resolve correctly
      }
    }
    return viteUrl || 'http://localhost:3001';
  }

  static async createRoom(name?: string, _initialElements?: Shape[]): Promise<string> {
    const baseUrl = RoomManager.BASE_URL;
    const url = baseUrl ? `${baseUrl}/rooms` : '/api/rooms';

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
    const baseUrl = RoomManager.BASE_URL;
    const url = baseUrl ? `${baseUrl}/rooms/${id}` : `/api/rooms/${id}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return response.json();
  }

  static navigateToRoom(id: string, navigate: (path: string) => void) {
    useRoomStore.getState().setRoomId(id);
    navigate(`/room/${id}`);
  }
}
