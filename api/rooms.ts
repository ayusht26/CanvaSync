import type { VercelRequest, VercelResponse } from '@vercel/node';
import postgres from 'postgres';
import { nanoid } from 'nanoid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const dbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  const sql = postgres(dbUrl, { ssl: 'require' });

  try {
    const { name, ownerId } = req.body as { name?: string; ownerId?: string };
    const roomId = nanoid(10);
    const roomName = name || `Untitled Room ${roomId}`;

    const [room] = await sql<any[]>`
      INSERT INTO rooms (id, name, owner_id, settings)
      VALUES (${roomId}, ${roomName}, ${ownerId || null}, ${sql.json({
        gridVisible: true,
        background: '#ffffff',
        theme: 'light',
      })})
      RETURNING id, name, owner_id as "ownerId", is_public as "isPublic", settings, created_at as "createdAt", updated_at as "updatedAt"
    `;

    return res.status(201).json(room);
  } catch (error: any) {
    console.error('Failed to create room:', error);
    return res.status(500).json({ error: 'Failed to create room', detail: error.message });
  } finally {
    await sql.end();
  }
}
