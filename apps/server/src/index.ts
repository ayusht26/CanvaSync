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
const allowedOrigins = (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim());

await fastify.register(cors, {
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow all origins listed in CORS_ORIGIN env (comma-separated)
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
