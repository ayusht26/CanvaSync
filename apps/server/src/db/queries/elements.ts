import sql from '../connection.js';
import { Shape } from '@canvasync/shared';

export async function saveElements(roomId: string, shapes: Shape[]) {
  if (shapes.length === 0) return;

  const values = shapes.map(shape => ({
    roomId: roomId,
    shapeId: shape.id,
    data: shape,
    updatedAt: new Date()
  }));

  await sql`
    INSERT INTO elements ${sql(values as any, 'roomId', 'shapeId', 'data', 'updatedAt')}
    ON CONFLICT (room_id, shape_id)
    DO UPDATE SET
      data = EXCLUDED.data,
      updated_at = EXCLUDED.updated_at
  `;
}

export async function getElementsByRoomId(roomId: string): Promise<Shape[]> {
  const elements = await sql`
    SELECT data
    FROM elements
    WHERE room_id = ${roomId}
    ORDER BY (data->>'zIndex')::int ASC
  `;
  return elements.map(e => e.data as Shape);
}

export async function deleteElementsByRoomId(roomId: string): Promise<void> {
  await sql`
    DELETE FROM elements
    WHERE room_id = ${roomId}
  `;
}

