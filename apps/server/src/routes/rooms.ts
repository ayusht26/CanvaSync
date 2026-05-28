import { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { createRoom, getRoomById } from '../db/queries/rooms.js';
import { getElementsByRoomId } from '../db/queries/elements.js';

export default async function roomRoutes(fastify: FastifyInstance) {
  fastify.post('/rooms', async (request, reply) => {
    const { name, ownerId } = request.body as { name?: string; ownerId?: string };
    const roomId = nanoid(10);
    const roomName = name || `Untitled Room ${roomId}`;
    
    try {
      const room = await createRoom(roomId, roomName, ownerId);
      return reply.code(201).send(room);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create room' });
    }
  });

  fastify.get('/rooms/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    try {
      const room = await getRoomById(id);
      if (!room) {
        return reply.code(404).send({ error: 'Room not found' });
      }

      const elements = await getElementsByRoomId(id);
      return {
        ...room,
        elements
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch room' });
    }
  });
}
