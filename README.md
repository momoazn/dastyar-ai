# Dastyar AI

Local-first AI assistant platform with a Bun/Hono API server, React web UI, SQLite persistence, and optional Go Whisper transcription service.

## Apps

- `apps/server`: Hono + ORPC API, auth, SQLite/Drizzle, AI provider orchestration, storage.
- `apps/web`: React 19 + Vite + TanStack Router/Query UI.
- `apps/whisper`: Go transcription HTTP service backed by whisper.cpp.

## Quick Start

```bash
bun install
bun run dev
```

Open `http://localhost:5173` for the web app.

## Required Commands

```bash
bun run lint:check
bun run check-types
bun run test
bun --cwd apps/web build
bun --cwd apps/server build
```

## More Docs

- Open `docs/index.html` for the full project documentation.
- Markdown references: `docs/HANDOFF.md`, `docs/ARCHITECTURE.md`, `docs/OPERATIONS.md`, `docs/API.md`.
