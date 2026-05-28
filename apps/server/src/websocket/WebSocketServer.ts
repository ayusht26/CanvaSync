import { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import * as Y from 'yjs';
// @ts-ignore
import { setupWSConnection, docs } from 'y-websocket/bin/utils';
import { saveElements, getElementsByRoomId } from '../db/queries/elements.js';
import { Shape } from '@canvasync/shared';

// Keep track of which rooms have been loaded from the DB in this session
const loadedRooms = new Set<string>();

export async function registerWebSocketServer(fastify: FastifyInstance) {
  await fastify.register(websocket);

  fastify.register(async function (fastify) {
    fastify.get('/room/:roomId', { websocket: true }, (connection, req) => {
      const roomId = (req.params as any).roomId;
      const { socket } = connection;

      console.log(`WebSocket connection for room: ${roomId}`);

      // Handle the Yjs connection
      // @ts-ignore
      setupWSConnection(socket, req.raw, { docName: roomId, gc: true });

      const doc = docs.get(roomId);
      if (doc && !loadedRooms.has(roomId)) {
        loadedRooms.add(roomId);
        loadFromDatabase(roomId, doc).then(() => {
          setupPersistence(roomId, doc);
        });
      }
    });
  });
}

async function loadFromDatabase(roomId: string, doc: any) {
  try {
    const elements = await getElementsByRoomId(roomId);
    const yElements = doc.getMap('elements');
    
    if (yElements.size === 0 && elements.length > 0) {
      doc.transact(() => {
        elements.forEach((element: Shape) => {
          yElements.set(element.id, element);
        });
      }, 'db-load');
      console.log(`Loaded ${elements.length} elements for room ${roomId} from database`);
    } else {
      console.log(`Room ${roomId} already has ${yElements.size} elements or DB is empty`);
    }
  } catch (error) {
    console.error(`Error loading room ${roomId} from DB:`, error);
  }
}

function setupPersistence(roomId: string, doc: any) {
  const interval = setInterval(async () => {
    try {
      const yElements = doc.getMap('elements');
      if (yElements.size === 0) return;

      const shapes = Array.from(yElements.values()) as Shape[];
      await saveElements(roomId, shapes);
      console.log(`Persisted ${shapes.length} elements for room ${roomId} to database`);
    } catch (error) {
      console.error(`Error persisting room ${roomId}:`, error);
    }
  }, 30000); // Persist every 30 seconds to be less aggressive

  doc.on('destroy', () => {
    clearInterval(interval);
    loadedRooms.delete(roomId);
    console.log(`Persistence stopped for room ${roomId}`);
  });
}
