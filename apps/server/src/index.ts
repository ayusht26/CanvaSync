import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.js';
import roomRoutes from './routes/rooms.js';
import { registerWebSocketServer } from './websocket/WebSocketServer.js';

dotenv.config();

const fastify = Fastify({
  logger: true
});

// Register plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || '*'
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute'
});

// Register WebSocket server
await registerWebSocketServer(fastify);

// Register routes
await fastify.register(healthRoutes);
await fastify.register(roomRoutes);

// Server listening logic
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`Server listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
