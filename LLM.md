# LLM.md — CanvaSync Architecture & Context

> **Note to AI Assistants:** Read this file carefully to understand the context, architecture, tech stack, and file structure of CanvaSync before generating or modifying any code.

## 1. Project Overview
**CanvaSync** is a production-grade, real-time collaborative infinite whiteboard SaaS application. It features a custom high-performance HTML5 Canvas rendering engine, conflict-free real-time multiplayer synchronization via Yjs, and a premium dark-mode glassmorphic UI.

## 2. Tech Stack & Libraries
*   **Monorepo:** pnpm workspaces, Turborepo.
*   **Frontend (`apps/web`):**
    *   **Framework:** React 18, Vite.
    *   **Styling:** Tailwind CSS, PostCSS.
    *   **UI/Animations:** Framer Motion, `tailwindcss-animate`, Lucide React (Icons).
    *   **State Management:** Zustand (Stores: Canvas, Shapes, Selection, Style, Room).
    *   **Multiplayer/CRDT:** `yjs`, `y-websocket`.
    *   **Persistence:** `idb` (IndexedDB for local saves).
*   **Backend (`apps/server`):**
    *   **Framework:** Fastify.
    *   **WebSockets:** `@fastify/websocket`.
    *   **Database:** PostgreSQL (Supabase).
    *   **DB Client:** `postgres.js`.
*   **Shared (`packages/shared`):** TypeScript types and constants shared across web and server.

## 3. Important Commands
Run these from the root directory:
*   `pnpm install`: Install all dependencies.
*   `pnpm dev`: Start both the frontend and backend development servers concurrently.
*   `pnpm build`: Build the monorepo packages.
*   `pnpm typecheck`: Run TypeScript compilation check across all packages (`tsc --noEmit`).

## 4. File Structure & Explanations

### `packages/shared/src/`
Defines the single source of truth for data structures.
*   **`types/shapes.ts`**: TypeScript interfaces for every shape type (`RectangleShape`, `PenShape`, etc.), `BoundingBox`, and `Point`.
*   **`types/presence.ts`**: Defines `AwarenessState` (user cursor position, name, color).
*   **`types/room.ts`**: Defines room and user metadata.
*   **`constants/tools.ts`**: `ToolName` enum to prevent typos.
*   **`constants/defaults.ts`**: Default UI styling constants (stroke width, color, fonts).

### `apps/web/src/canvas/`
The core engine manipulating the HTML5 `<canvas>`.
*   **`CanvasEngine.ts`**: Manages the `requestAnimationFrame` loop. Calls the `Renderer` to draw every frame. Handles `ResizeObserver`.
*   **`Camera.ts`**: Tracks `x, y, zoom` state. Calculates panning and zooming constraints using a multiplicative factor for zoom (like Figma).
*   **`SceneGraph.ts`**: An ordered array of `Shape` objects. Handles z-indexing (`bringToFront`, `sendBackward`), additions, removals, and duplicates. Uses an Observer pattern to trigger React updates.
*   **`TransformUtils.ts`**: Translates coordinates between Screen Space (UI/mouse) and World Space (Canvas). Applies the Camera matrix (`ctx.setTransform`) considering `devicePixelRatio`.
*   **`HitDetection.ts`**: Math logic for determining if a point/rect intersects with a shape (handles rotation, AABB, and line proximity).
*   **`CanvasEventHandler.ts`**: Binds browser DOM events (`pointerdown`, `wheel`, `keydown`) and translates them into `ToolEvent`s passed to the active tool. It injects actual Zustand stores into the event payload.

### `apps/web/src/renderer/`
Drawing logic separated from state.
*   **`Renderer.ts`**: The main orchestrator. Clears canvas (using physical pixels) → applies camera → draws grid → draws shapes → draws UI overlays (selection, cursors).
*   **`GridRenderer.ts`**: Draws a subtle, infinite, theme-aware dual-line grid.
*   **`SelectionRenderer.ts`**: Draws the blue bounding box, 8 resize handles, and the rotation handle around selected shapes, plus the drag-to-select rubber-band box.
*   **`CursorRenderer.ts`**: Draws live collaborator pointers and name tags.
*   **`ShapeRenderer.ts`**: A dispatcher that routes a generic `Shape` to its specific class (e.g., `RectangleRenderer`).
*   **`shapes/*.ts`**: Contains exact `ctx` drawing logic for `Rectangle`, `Ellipse`, `Triangle`, `Rhombus`, `Line`, `Arrow`, `Pen` (splines), and `Text`.

### `apps/web/src/tools/`
Interaction logic handling user inputs.
*   **`ToolManager.ts`**: Holds a registry of all tools. Tracks the currently active tool. Manages temporary Spacebar-pan overrides and clears selection when switching away from the Selection tool.
*   **`BaseTool.ts`**: Abstract class defining `onPointerDown`, `Move`, `Up`, `KeyDown`.
*   **`SelectionTool.ts`**: Complex tool for clicking to select, shift-clicking for multi-select, dragging to move elements, drawing rubber-band selection boxes, and dragging handles to resize/rotate.
*   **`ShapeTool.ts`**: Base class for drag-to-create shapes (Rect, Ellipse, Triangle, Rhombus). Handles `Shift` for 1:1 aspect ratio constraint.
*   **`PenTool.ts`**: Captures points while dragging to create freehand splines.
*   **`LineTool.ts` / `ArrowTool.ts`**: Click and drag to create lines. Supports `Shift` snapping to 45° increments.
*   **`TextTool.ts`**: On click, spawns an absolute-positioned HTML `<textarea>` over the canvas. On blur, converts text into a Canvas `TextShape`. Supports font families, sizes, and alignment.
*   **`PanTool.ts`**: Middle-click or Space+drag to move the camera.
*   **`EraserTool.ts`**: Deletes shapes the pointer passes over. Supports 'whole element' or 'partial' erasing with adjustable sizes.

### `apps/web/src/store/`
Zustand global state. Bridging React UI with Canvas logic.
*   **`useCanvasStore.ts`**: Tracks `activeTool`, `theme`, and mirrors the `camera` state.
*   **`useShapeStore.ts`**: React-reactive clone of the SceneGraph shapes. Used by UI to know what exists.
*   **`useSelectionStore.ts`**: Tracks `selectedIds` (Set) and the drag `selectionBox`.
*   **`useStyleStore.ts`**: Tracks active color, stroke, fill, and opacity selected by the user.
*   **`useRoomStore.ts`**: Tracks multiplayer state (`roomId`, `localUser`, `collaborators`).

### `apps/web/src/hooks/`
React lifecycle and side effects.
*   **`useCanvas.ts`**: The glue hook. Initializes the CanvasEngine, Camera, SceneGraph, registers all Tools, and sets up synchronization between Zustand stores and the class-based engine. Crucially, it manages the one-way data flow `SceneGraph -> Store` to avoid infinite feedback loops.
*   **`useKeyboard.ts`**: Global keyboard shortcuts (V, P, R, Delete, Ctrl+A, Ctrl+D, brackets for layers).
*   **`useTheme.ts`**: Initializes theme from `localStorage` and manages CSS variables (`--bg-primary`, etc.) for dark/light mode.
*   **`useResize.ts`**: Binds a `ResizeObserver` to keep the canvas filling the window physically.
*   **`usePersistence.ts`**: Automatically saves local canvas state to `IndexedDB` every second and loads it directly into the `SceneGraph` on boot.
*   **`useMultiplayer.ts`**: Handles connecting to Yjs when a `roomId` is present.

### `apps/web/src/multiplayer/` & `presence/`
Real-time logic.
*   **`YjsProvider.ts`**: Initializes `Y.Doc` and `y-websocket` provider.
*   **`SyncManager.ts`**: Two-way data binding. Observes `SceneGraph` changes to update Yjs `elements` map, and observes Yjs to update the `SceneGraph` (remote changes).
*   **`RoomManager.ts`**: REST API wrapper to `POST /rooms` to get a room ID, and navigation logic.
*   **`PresenceManager.ts`**: Translates Yjs `awareness` state into `useRoomStore.collaborators`. Broadcasts local mouse position.

### `apps/web/src/ui/`
React Components (Aesthetics: Dark mode, glassmorphism).
*   **`TopBar.tsx`**: Header with logo, editable name, inline zoom controls (+, -, %), collaborator avatars, theme toggle, and Share button.
*   **`Toolbar.tsx`**: Floating vertical pill on the left containing all `ToolButton`s. Scrollable (`overflow-y: auto`, `no-scrollbar`).
*   **`StylePanel.tsx`**: Contextual panel sliding in from the right. Dynamically renders options based on the active tool (e.g., Font settings for Text tool, Size settings for Eraser, Stroke/Fill for shapes). Stops pointer event propagation to prevent drawing under the panel.
*   **`AnimatedThemeToggler.tsx`**: Uses Framer Motion and the View Transitions API for a circular expanding theme reveal animation.
*   **`CreateRoomModal.tsx` & `JoinRoomModal.tsx`**: Overlays for creating/joining multiplayer sessions.

### `apps/server/src/`
Backend logic (Fastify).
*   **`index.ts`**: Server setup, CORS, rate limiting.
*   **`db/connection.ts`**: Connects to Supabase PostgreSQL using `postgres.js`.
*   **`db/migrations/*.sql`**: SQL schemas for `rooms` and `elements` tables.
*   **`db/queries/*.ts`**: Data access layer for inserting/fetching rooms and shapes.
*   **`routes/rooms.ts`**: `POST /rooms` to generate a nanoid room and insert it into the DB.
*   **`websocket/WebSocketServer.ts`**: Attaches `y-websocket` to the Fastify instance. Handles persistence (saving idle Yjs documents to PostgreSQL).
