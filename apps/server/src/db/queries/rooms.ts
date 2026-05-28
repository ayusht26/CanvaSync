import sql from '../connection.js';
import { Room } from '@canvasync/shared';

export async function createRoom(id: string, name: string, ownerId?: string): Promise<Room> {
  const [room] = await sql<Room[]>`
    INSERT INTO rooms (id, name, owner_id, settings)
    VALUES (${id}, ${name}, ${ownerId || null}, ${sql.json({
      gridVisible: true,
      background: '#ffffff',
      theme: 'light'
    })})
    RETURNING id, name, owner_id, is_public, settings, created_at, updated_at
  `;
  return room;
}

export async function getRoomById(id: string): Promise<Room | null> {
  const [room] = await sql<Room[]>`
    SELECT id, name, owner_id, is_public, settings, created_at, updated_at
    FROM rooms
    WHERE id = ${id}
  `;
  return room || null;
}
