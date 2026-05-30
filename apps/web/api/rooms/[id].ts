import type { VercelRequest, VercelResponse } from '@vercel/node';
import postgres from 'postgres';

// Vercel serverless function — replaces Fastify GET /rooms/:id for production
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query as { id: string };
  if (!id) {
    return res.status(400).json({ error: 'Room id is required' });
  }

  const dbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const sql = postgres(dbUrl, { ssl: 'require' });

  try {
    const [room] = await sql<any[]>`
      SELECT id, name, owner_id as "ownerId", is_public as "isPublic", settings, created_at as "createdAt", updated_at as "updatedAt"
      FROM rooms
      WHERE id = ${id}
    `;

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    return res.status(200).json(room);
  } catch (error: any) {
    console.error('Failed to fetch room:', error);
    return res.status(500).json({ error: 'Failed to fetch room', detail: error.message });
  } finally {
    await sql.end();
  }
}
