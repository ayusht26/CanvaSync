import { Shape } from './shapes';
import { Room, RoomSettings } from './room';

export enum ServerEvent {
  ROOM_SYNC = 'room-sync',
  USER_JOINED = 'user-joined',
  USER_LEFT = 'user-left',
  ERROR = 'error',
}

export enum ClientEvent {
  JOIN_ROOM = 'join-room',
  UPDATE_SETTINGS = 'update-settings',
}

export interface RoomSyncPayload {
  room: Room;
  elements: Shape[];
}

export interface UserJoinedPayload {
  userId: string;
  name: string;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}

export type WebSocketMessage =
  | { type: ServerEvent.ROOM_SYNC; payload: RoomSyncPayload }
  | { type: ServerEvent.USER_JOINED; payload: UserJoinedPayload }
  | { type: ServerEvent.USER_LEFT; payload: { userId: string } }
  | { type: ServerEvent.ERROR; payload: ErrorPayload }
  | { type: ClientEvent.JOIN_ROOM; payload: { roomId: string; userId: string; name: string } }
  | { type: ClientEvent.UPDATE_SETTINGS; payload: Partial<RoomSettings> };
