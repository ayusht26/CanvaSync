export interface RoomSettings {
  gridVisible: boolean;
  background: string;
  theme: 'light' | 'dark';
}

export interface Room {
  id: string;
  name: string;
  ownerId?: string;
  isPublic: boolean;
  settings: RoomSettings;
  createdAt: number;
  updatedAt: number;
}

export interface RoomUser {
  id: string;
  name: string;
  color: string;
  joinedAt: number;
}
