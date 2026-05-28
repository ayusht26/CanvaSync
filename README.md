# CanvaSync

CanvaSync is a production-grade, real-time collaborative infinite whiteboard application.

## Features

- **Infinite Canvas**: Smooth pan and zoom powered by HTML5 Canvas API.
- **Real-time Collaboration**: Conflict-free editing using Yjs CRDTs.
- **Zero Friction**: Start drawing immediately on the local canvas.
- **Premium UI**: Modern, aesthetic design with glassmorphism and dark mode.
- **Smart Tools**: Selection, Pen, Rectangle, Ellipse, Line, and Arrow tools.
- **Persistence**: Local work is automatically saved to IndexedDB.
- **Scalable Backend**: Node.js + Fastify + PostgreSQL.

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Zustand, Yjs, Lucide Icons.
- **Backend**: Fastify, WebSocket, PostgreSQL, postgres.js.
- **Monorepo**: pnpm Workspaces, Turborepo.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Setup environment**:
   ```bash
   cp apps/web/.env.example apps/web/.env
   cp apps/server/.env.example apps/server/.env
   ```

3. **Initialize Database**:
   ```bash
   psql -U postgres -c "CREATE DATABASE canvasync;"
   psql -U postgres -d canvasync -f apps/server/src/db/migrations/001_create_rooms.sql
   psql -U postgres -d canvasync -f apps/server/src/db/migrations/002_create_elements.sql
   ```

4. **Run development server**:
   ```bash
   pnpm dev
   ```

Open [http://localhost:5173](http://localhost:5173) to start drawing.

## License

MIT
A modern collaborative whiteboard platform
