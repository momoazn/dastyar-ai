# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development

```bash
# Run all services (frontend, API, and PocketBase)
bun run dev

# Run individual services
bun run web:dev    # Frontend only (Vite)
bun run api:dev    # API server only (Hono/Bun)
bun run pb:dev     # PocketBase only

# Seed database with sample data
bun run seed
```

### Build & Production

```bash
# Build for production (creates single Go binary with embedded frontend)
bun run build

# Build for Windows
bun run pb:build:win

# Run production build
./persian-ai-assistant serve
```

### Code Quality

```bash
# Run linter
bun run lint

# Type checking
bun run type-check

# Format code (if needed)
bunx --bun prettier --write .
```

## Architecture Overview

This is a full-stack AI assistant application with a three-server architecture:

1. **Frontend (React/Vite)**: Modern React app with TypeScript, Jotai state management, and TanStack Query. Uses shadcn/ui components with full RTL/Persian support.

2. **API Server (Bun/Hono on :3000)**: Handles AI integrations:

   - `/api/chat` - Ollama chat with SSE streaming and reasoning tokens
   - `/api/translation` - Multi-language translation with tone control
   - `/api/pdf/upload` - PDF processing and vector storage
   - `/health` - Health check endpoint

3. **PocketBase Server (Go on :8090)**: Database and auth backend:
   - SQLite database with automatic migrations
   - Real-time subscriptions for live updates
   - User authentication and session management
   - Rule-based access control

## Key Development Patterns

### Frontend State Management

- **Jotai atoms** in `src/lib/atoms/` for global state
- **TanStack Query** for server state with optimistic updates
- **Custom hooks** in `src/hooks/` for reusable logic
- **Persian-first constants** in `src/lib/constants/persian.ts`

### API Integration

- All AI processing happens locally via:
  - Ollama (port 11434) for chat
  - Stable Diffusion (port 7860) for images
  - Whisper for speech-to-text
- Server-Sent Events (SSE) for streaming responses
- PocketBase subscriptions for real-time updates
- Zod schemas for request/response validation

### Performance Considerations

- Aggressive React memoization (memo, useMemo, useCallback)
- Text direction detection caching in `useTextDirection`
- Debouncing utilities in `src/lib/utils/debounce.ts`
- Performance monitoring via `usePerformanceMonitor`

### Database Schema

Schema defined in `pb_schema.json`:

- **users**: Auth collection with avatar support
- **threads**: Chat conversations with archiving
- **messages**: Chat messages with status tracking (idle, reasoning, streaming, finished, errored, stopped)
- **pdfs**: PDF documents linked to threads
- **translations**: Translation history with language pairs and tones

Relationships:

- messages → threads (cascade delete)
- pdfs → threads
- All collections have user-based access rules

### API Endpoints

#### Chat Endpoint (`POST /api/chat`)

```typescript
{
  message: string,
  threadId: string,
  model?: string
}
```

- Streams responses via SSE
- Parses reasoning tokens from AI output
- Handles stop signals and errors

#### Translation Endpoint (`POST /api/translation`)

```typescript
{
  text: string,
  sourceLanguage: "persian" | "english" | "arabic" | "french" | "german" | "spanish",
  targetLanguage: "persian" | "english" | "arabic" | "french" | "german" | "spanish",
  tone: "formal" | "informal" | "academic" | "business" | "creative" | "technical" | "friendly" | "neutral"
}
```

#### PDF Upload (`POST /api/pdf/upload`)

- Accepts PDF files only
- Processes into chunks for vector search
- Creates Persian notification in chat

### UI Component Patterns

- **Shadcn/ui** with Radix UI primitives
- **CVA (class-variance-authority)** for component variants
- **Compound components** (Dialog, Sheet, Sidebar)
- **Dark mode** with theme toggle
- **Loading states** with skeleton components
- **Persian RTL** support throughout

### Error Handling

- Try-catch blocks at all API endpoints
- Stream error handling for SSE
- User-friendly Persian error messages
- Console logging for debugging
- Graceful degradation strategies

### Build Configuration

Vite config (`vite.config.ts`):

- Path alias: `@/` → `src/`
- Dev proxy:
  - `/api` → `http://localhost:3000`
  - `/pb` → `http://localhost:8090`
- Output to backend dist folder
- Tailwind CSS via Vite plugin

### Deployment

- Single Go binary with embedded frontend
- No Docker configuration (native deployment)
- Platform-specific build scripts
- Environment variables minimal (mostly hardcoded)
- Air for Go hot-reloading in development

### Code Style Guidelines

- TypeScript-first with generated types from PocketBase
- Class-based services for API layer
- Functional React components
- Persian language as primary UI language
- Comprehensive error handling
- No test files (rely on TypeScript + ESLint)
