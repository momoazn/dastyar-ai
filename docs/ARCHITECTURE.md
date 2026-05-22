# Architecture

## Server

- Entry: `apps/server/src/index.ts`
- App factory: `apps/server/src/app.ts`
- ORPC router: `apps/server/src/procedures/index.ts`
- Auth: `apps/server/src/services/auth.ts`, `apps/server/src/middlewares/auth.ts`
- DB schema: `apps/server/src/database/schema/index.ts`
- Repositories: `apps/server/src/repositories/*`
- AI providers: `apps/server/src/services/ai-providers/*`
- Processors: `apps/server/src/services/processors/*`

## Web

- Entry: `apps/web/src/main.tsx`
- Routes: `apps/web/src/routes/*`
- Shared UI: `apps/web/src/components/ui/*`
- Feature components: `apps/web/src/components/*`
- ORPC client: `apps/web/src/utils/orpc.ts`
- State: TanStack Query via QueryClient in `apps/web/src/utils/orpc.ts`

## Whisper

- Entry: `apps/whisper/main.go`
- HTTP handler: `apps/whisper/internal/handler/transcribe.go`
- Service: `apps/whisper/internal/service/whisper.go`

## Data Flow

1. Web app makes ORPC calls to server via TanStack Query.
2. Server validates auth (JWT + DB user lookup).
3. Repository layer accesses SQLite via Drizzle ORM.
4. AI providers (Ollama, LM Studio) are called via OpenAI-compatible APIs.
5. File uploads go through validation, storage, text extraction, and chunk indexing.
6. Whisper service handles audio transcription via HTTP.
