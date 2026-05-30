import { FastifyInstance } from 'fastify';
import websocket from '@fastify/websocket';
import * as Y from 'yjs';
// @ts-ignore
import { setupWSConnection, docs } from 'y-websocket/bin/utils';
import { saveElements, getElementsByRoomId, deleteElementsByRoomId } from '../db/queries/elements.js';
import { deleteRoom } from '../db/queries/rooms.js';
import { Shape } from '@canvasync/shared';

// Keep track of which rooms have been loaded from the DB in this session
const loadedRooms = new Set<string>();
const connectionCounts = new Map<string, number>();
const roomCleanupTimeouts = new Map<string, NodeJS.Timeout>();

export async function registerWebSocketServer(fastify: FastifyInstance) {
  await fastify.register(websocket);

  fastify.register(async function (fastify) {
    fastify.get('/room/:roomId', { websocket: true }, (connection, req) => {
      const roomId = (req.params as any).roomId;
      const { socket } = connection;

      console.log(`WebSocket connection for room: ${roomId}`);

      // Clear any pending inactivity cleanup for this room
      const pendingTimeout = roomCleanupTimeouts.get(roomId);
      if (pendingTimeout) {
        clearTimeout(pendingTimeout);
        roomCleanupTimeouts.delete(roomId);
        console.log(`[WebSocketServer] Cancelled inactivity auto-destruction for room: ${roomId}`);
      }

      // Track active connections
      connectionCounts.set(roomId, (connectionCounts.get(roomId) || 0) + 1);

      // Handle the Yjs connection
      // @ts-ignore
      setupWSConnection(socket, req.raw, { docName: roomId, gc: true });
      
      // Fix for fastify-websocket stream crash:
      // y-websocket sets binaryType to 'arraybuffer', which causes fastify-websocket's
      // internal stream to crash when it tries to push() it. We revert it to 'nodebuffer'.
      socket.binaryType = 'nodebuffer';

      const doc = docs.get(roomId);
      if (doc && !loadedRooms.has(roomId)) {
        loadedRooms.add(roomId);
        loadFromDatabase(roomId, doc).then(() => {
          setupPersistence(roomId, doc);
        });
      }

      // Listen for socket closure to decrement active connection count
      socket.on('close', () => {
        const currentCount = connectionCounts.get(roomId) || 1;
        const newCount = currentCount - 1;
        connectionCounts.set(roomId, newCount);
        console.log(`[WebSocketServer] Client disconnected from room: ${roomId}. Active connections remaining: ${newCount}`);

        if (newCount <= 0) {
          // Room is now empty! Schedule a 20-second timeout to clean up from database and free RAM
          console.log(`[WebSocketServer] Room ${roomId} is empty. Scheduling auto-destruction in 20 seconds.`);
          
          if (roomCleanupTimeouts.has(roomId)) {
            clearTimeout(roomCleanupTimeouts.get(roomId));
          }

          const timeout = setTimeout(async () => {
            try {
              console.log(`[WebSocketServer] Room ${roomId} 20s inactivity reached. Initiating auto-destruction...`);
              
              const activeDoc = docs.get(roomId);
              if (activeDoc) {
                // Save elements one final time
                const yElements = activeDoc.getMap('elements');
                if (yElements.size > 0) {
                  const shapes = Array.from(yElements.values()) as Shape[];
                  await saveElements(roomId, shapes);
                  console.log(`[WebSocketServer] Persisted final state of ${shapes.length} elements for room ${roomId}`);
                }

                // Delete room and elements from database
                await deleteElementsByRoomId(roomId);
                await deleteRoom(roomId);
                console.log(`[WebSocketServer] Deleted room ${roomId} and its elements from database.`);

                // Destroy Yjs document in memory
                activeDoc.destroy();
              }
              
              docs.delete(roomId);
              loadedRooms.delete(roomId);
              connectionCounts.delete(roomId);
              roomCleanupTimeouts.delete(roomId);
              
              console.log(`[WebSocketServer] Auto-destruction for room ${roomId} completed successfully.`);
            } catch (error) {
              console.error(`[WebSocketServer] Error during auto-destruction for room ${roomId}:`, error);
            }
          }, 20000);

          roomCleanupTimeouts.set(roomId, timeout);
        }
      });
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
