import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Shape } from '@canvasync/shared';

export class YjsProvider {
  public readonly doc: Y.Doc;
  public readonly provider: WebsocketProvider;
  public readonly elements: Y.Map<Shape>;
  public readonly metadata: Y.Map<any>;

  constructor(roomId: string) {
    this.doc = new Y.Doc();

    // Resolve the WebSocket server URL:
    // - In production: use VITE_WS_URL env var (set to your Railway server)
    // - In local dev: use ws://localhost:3001
    const wsUrl = (import.meta.env.VITE_WS_URL as string) || 'ws://localhost:3001';

    // The WebsocketProvider connects to wsUrl/room/roomId
    // Our Fastify route is: GET /room/:roomId (websocket: true)
    this.provider = new WebsocketProvider(
      `${wsUrl}/room`,
      roomId,
      this.doc,
      {
        // Reconnect automatically on disconnect
        connect: true,
        resyncInterval: -1,
      }
    );

    this.elements = this.doc.getMap<Shape>('elements');
    this.metadata = this.doc.getMap<any>('metadata');


    this.provider.on('status', (event: any) => {
      console.log(`[YjsProvider] WebSocket status for room ${roomId}: ${event.status}`);
    });

    this.provider.on('sync', (isSynced: boolean) => {
      console.log(`[YjsProvider] Synced for room ${roomId}: ${isSynced}`);
    });

    this.provider.on('connection-error', (err: any) => {
      console.error(`[YjsProvider] Connection error for room ${roomId}:`, err);
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
