import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Shape } from '@canvasync/shared';

export class YjsProvider {
  public readonly doc: Y.Doc;
  public readonly provider: WebsocketProvider;
  public readonly elements: Y.Map<Shape>;

  constructor(roomId: string) {
    this.doc = new Y.Doc();
    
    // In Vite, we use import.meta.env for environment variables
    const wsUrl = (import.meta.env.VITE_WS_URL as string) || 'ws://localhost:3001';
    
    // The WebsocketProvider expects the server URL, the room name, and the Y.Doc
    // We append /room to the URL so it matches our Fastify route: /room/:roomId
    this.provider = new WebsocketProvider(
      `${wsUrl}/room`,
      roomId,
      this.doc
    );

    this.elements = this.doc.getMap<Shape>('elements');

    this.provider.on('status', (event: any) => {
      console.log(`WebSocket status for room ${roomId}: ${event.status}`);
    });

    this.provider.on('sync', (isSynced: boolean) => {
      console.log(`Yjs synced for room ${roomId}: ${isSynced}`);
    });
  }

  public get awareness() {
    return this.provider.awareness;
  }

  public disconnect() {
    this.provider.disconnect();
    this.doc.destroy();
  }
}
