<div align="center">

<br />

<img src="https://img.shields.io/badge/CanvaSync-6366f1?style=for-the-badge&logoColor=white" alt="CanvaSync" height="36" />

<br /><br />

**An infinite collaborative whiteboard — fast, beautiful, and built from scratch.**

<br />

[![Live →](https://img.shields.io/badge/%E2%86%92%20%20Open%20Live%20Demo-6366f1?style=for-the-badge)](https://canvasync-sage.vercel.app/)&nbsp;&nbsp;[![MIT](https://img.shields.io/badge/License-MIT-3b82f6?style=for-the-badge&labelColor=1e1e2e)](LICENSE)&nbsp;&nbsp;[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-22d3ee?style=for-the-badge&labelColor=1e1e2e)](https://www.typescriptlang.org/)&nbsp;&nbsp;[![React](https://img.shields.io/badge/React-18-a78bfa?style=for-the-badge&labelColor=1e1e2e)](https://react.dev/)

<br />

> Draw. Think. Collaborate — without signing up, installing anything, or waiting for anything to load.

<br />

</div>

---

## What is CanvaSync?

CanvaSync is a **production-grade infinite whiteboard** that works the moment you open it. No accounts, no onboarding flows, no friction. Just an infinite canvas and every tool you need.

It has a fully custom HTML5 Canvas rendering engine built from scratch — not a library wrapper, not an SVG hack. Every frame is drawn using `requestAnimationFrame`, which is why panning and zooming feel like a native app even with hundreds of shapes on screen.

Share a link and collaborate in real-time. Close the tab and your work is still there the next time you open it.

---

## The short version of why it's different

| | What CanvaSync does |
|---|---|
| 🚀 **Zero setup** | Open and draw. No account, no install, no loading. |
| ⚡ **Custom renderer** | Hand-built Canvas engine — sharp at any zoom, any DPI. |
| 🔗 **Smart arrows** | Draw an arrow between shapes. Move the shapes. The arrow follows. |
| 🌐 **Real multiplayer** | CRDT-based sync via Yjs. Not a wrapper — real conflict-free editing. |
| 🧠 **Decentralized rooms** | If the host leaves, the oldest collaborator takes over. No session dies. |
| 💾 **Offline-first** | All local work saves to IndexedDB automatically. Always restored. |
| 🎨 **Adaptive theming** | Dark ↔ light mode swap. Existing shapes recolor to stay visible. |
| ✂️ **Surgical eraser** | Two modes — delete whole shapes, or erase only the strokes you touched. |

---

## The Canvas Engine

This isn't built on Fabric.js, Konva, or any other canvas library. It's a purpose-built rendering pipeline.

```
CanvasEngine (rAF loop)
  └── Renderer.ts
        ├── GridRenderer         — infinite dot/grid/line backgrounds
        ├── ShapeRenderer        — dispatches to per-shape renderers
        │     └── Rectangle, Ellipse, Triangle, Rhombus,
        │         Line, Arrow, Pen, Text, Image
        ├── SelectionRenderer    — bounding box, 8 resize handles, rotation
        ├── CursorRenderer       — remote collaborator cursors (lerp-smoothed)
        └── ArrowHoverOverlay    — snap-to-shape anchor highlights
```

A few engine details worth knowing:

- **Zoom** is multiplicative (like Figma) — 50% then 200% returns you exactly to 100%.
- **HiDPI** — transforms account for `devicePixelRatio`, so everything is pixel-perfect on Retina displays.
- **Hit detection with rotation** — clicking a rotated shape works correctly because the click coordinate is rotated back into the shape's local space before the AABB test.
- **Camera persistence** — your zoom level and scroll position survive page refreshes via `localStorage`.

---

## Tools

| Tool | Description |
|---|---|
| **Selection** `V` | Click, shift-click, or rubber-band drag to select. Eight resize handles. Aspect-ratio lock with Shift. Full rotation. |
| **Pen** `P` | Freehand drawing using smooth quadratic bezier splines. Feels natural at any speed. |
| **Rectangle** `R` | Drag to draw. Shift for a perfect square. Corner radius in the style panel. |
| **Ellipse** `E` | Drag to draw. Shift for a perfect circle. |
| **Triangle** `G` | Isosceles triangle. Fully resizable and rotatable. |
| **Rhombus** `D` | Diamond shape. Great for decision nodes in flowcharts. |
| **Arrow** `A` | Drag between shapes to connect them. Snaps to edge anchors. Stays connected when shapes move. |
| **Line** `L` | Simple straight line. Shift snaps to 45° angles. |
| **Text** `T` | Click to type, or drag to define a text box. Auto-resizes to content. |
| **Eraser** `X` | Element mode deletes whole shapes. Partial mode cuts away only what you touch. |
| **Pan** `H` | Drag to pan. Or hold `Space` from any tool for a temporary override. |

---

## Smart Arrows

Arrows in CanvaSync are connection objects, not just decorated lines.

- **Snap to shapes** — drawing near a shape highlights its nearest edge anchor point in purple.
- **Stay connected** — move either the source or target shape, and the arrow updates automatically.
- **Bend control** — drag the midpoint handle to curve a straight arrow, or create a right-angle elbow path.
- **Routing modes** — switch between Straight, Curved, and Elbow routing in the style panel.
- **Arrowhead options** — both ends independently configurable: arrow, none, or bidirectional.

Perfect for flowcharts, architecture diagrams, mind maps, and system sketches.

---

## Multiplayer

CanvaSync uses **Yjs** — a battle-tested CRDT library — for conflict-free real-time sync. Changes merge correctly even when two people edit the same thing at the same moment.

### How a session works

```
1. Click "Share" → room created instantly on Fastify backend
2. Send the link → collaborators join in one click
3. Draw together → Yjs syncs changes via WebSocket (batched per rAF frame)
4. Owner clicks "End Session" → everyone is notified and redirected
```

### Presence features

- **Live cursors** with names and custom colors, lerp-smoothed at 60fps.
- **Jump to collaborator** — click a teammate's name and the camera flies to their canvas position with an ease-out-expo animation.
- **Collaborator list** — shows everyone online with live green status indicators and ownership crown.

### Decentralized ownership

If the room creator disconnects, the system doesn't collapse. Every participant joins with a session-stable timestamp. When the owner goes offline, all remaining clients compare join times — the oldest one automatically takes over ownership. No coordination message, no server round-trip. It just works.

### Room lifecycle

| Event | What happens |
|---|---|
| Room created | Stored in PostgreSQL (Supabase). Yjs doc initialized in memory. |
| User joins | `y-websocket` syncs the full doc state to the new client. |
| Room goes empty | 20-second countdown begins on the backend. |
| Countdown expires | Elements saved to DB, room deleted, Yjs doc destroyed. Memory freed. |
| Owner ends session | Collaborators notified via Yjs metadata. Room deleted immediately. |
| Expired link visited | 404 intercepted, animated dialog shown, user returned to local canvas. |

---

## History & Clipboard

**Undo/redo** via `Ctrl+Z` / `Ctrl+Y` (also `Ctrl+Shift+Z`), or the floating buttons in the bottom-left corner. Up to 50 states in the stack.

The history system is smart: it only records a snapshot when something actually changed. Clicking without drawing, or selecting and deselecting, doesn't pollute the undo stack.

**Clipboard paste** (`Ctrl+V`):
- Paste an image → lands at the viewport center, scaled to fit, immediately selected.
- Paste text → becomes a text shape at the viewport center, immediately selected.

---

## Theming

Toggle dark and light mode from the top bar. The transition is a circular reveal animation that expands from wherever you clicked — using the browser's native View Transitions API.

When you switch, CanvaSync automatically recolors existing shapes:
- White strokes become black (for light mode readability)
- Black strokes become white (for dark mode readability)
- Any color you chose deliberately (red, blue, etc.) is left exactly as-is

---

## Keyboard Shortcuts

<table>
<tr>
<td valign="top">

**Tools**
| Key | Tool |
|---|---|
| `V` | Selection |
| `P` | Pen |
| `R` | Rectangle |
| `E` | Ellipse |
| `G` | Triangle |
| `D` | Rhombus |
| `L` | Line |
| `A` | Arrow |
| `T` | Text |
| `X` | Eraser |
| `H` | Pan |
| `Space + drag` | Temporary pan |

</td>
<td valign="top">

**Actions**
| Keys | Action |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+A` | Select all |
| `Ctrl+D` | Duplicate |
| `Ctrl+V` | Paste image or text |
| `Delete` / `Backspace` | Delete selected |
| `[` | Send layer backward |
| `]` | Bring layer forward |
| `Escape` | Deselect / return to select |

</td>
</tr>
</table>

---

## Tech Stack

<table>
<tr><td><strong>Frontend</strong></td><td>React 18, Vite, TypeScript 5.5</td></tr>
<tr><td><strong>Styling</strong></td><td>Tailwind CSS, Framer Motion</td></tr>
<tr><td><strong>Canvas</strong></td><td>Custom HTML5 Canvas engine (no library)</td></tr>
<tr><td><strong>State</strong></td><td>Zustand</td></tr>
<tr><td><strong>Multiplayer</strong></td><td>Yjs, y-websocket</td></tr>
<tr><td><strong>Local storage</strong></td><td>IndexedDB via <code>idb</code></td></tr>
<tr><td><strong>Backend</strong></td><td>Fastify, Node.js</td></tr>
<tr><td><strong>Database</strong></td><td>PostgreSQL (Supabase)</td></tr>
<tr><td><strong>Monorepo</strong></td><td>pnpm workspaces, Turborepo</td></tr>
<tr><td><strong>Deployed on</strong></td><td>Vercel (frontend) · Render (backend)</td></tr>
</table>

---

## Running Locally

**Prerequisites:** Node.js 20+, pnpm 9+, a PostgreSQL database (or Supabase project)

```bash
# 1. Clone and install
git clone https://github.com/your-username/canvasync.git
cd canvasync
pnpm install

# 2. Configure environment
cp apps/web/.env.example apps/web/.env
cp apps/server/.env.example apps/server/.env
```

Edit `apps/server/.env`:

```env
DATABASE_URL=postgresql://user:password@host:5432/canvasync
CORS_ORIGIN=http://localhost:5173
PORT=3001
```

Edit `apps/web/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

```bash
# 3. Run migrations (first time only)
psql $DATABASE_URL -f apps/server/src/db/migrations/001_create_rooms.sql
psql $DATABASE_URL -f apps/server/src/db/migrations/002_create_elements.sql

# 4. Start everything
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) and start drawing.

---

## Project Structure

```
canvasync/
├── apps/
│   ├── web/                    ← React frontend (Vite)
│   │   └── src/
│   │       ├── canvas/         ← Engine: Camera, SceneGraph, HitDetection
│   │       ├── renderer/       ← Renderer, GridRenderer, ShapeRenderers
│   │       ├── tools/          ← SelectionTool, PenTool, ArrowTool, ...
│   │       ├── multiplayer/    ← YjsProvider, SyncManager, RoomManager
│   │       ├── presence/       ← PresenceManager, cursor tracking
│   │       ├── store/          ← Zustand stores (canvas, shapes, selection...)
│   │       ├── hooks/          ← useCanvas, useMultiplayer, usePersistence...
│   │       └── ui/             ← TopBar, StylePanel, RoomPanel, modals
│   └── server/                 ← Fastify backend
│       └── src/
│           ├── db/             ← Migrations, queries, Supabase connection
│           ├── routes/         ← REST endpoints (rooms)
│           └── websocket/      ← y-websocket server, persistence loop
└── packages/
    └── shared/                 ← TypeScript types shared across apps
```

---

## License

MIT
A modern collaborative whiteboard platform
