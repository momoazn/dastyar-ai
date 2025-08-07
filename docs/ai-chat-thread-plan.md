## AI Chat and Thread Management Plan

### Dependencies and env

- Ensure `ai@^5`, `@ai-sdk/openai-compatible`, `zod`, `nanoid` are installed.
- `.env`: `OLLAMA_BASE_URL` (e.g. `http://localhost:11434/v1`), `OLLAMA_DEFAULT_MODEL`, `CORS_ORIGIN`.

### Model provider (Ollama via AI SDK v5)

- Add `apps/server/src/lib/ai.ts`:
  - Export a configured `createOpenAICompatible({ baseURL: process.env.OLLAMA_BASE_URL, name: 'ollama' })`.
  - Helper `resolveModel(requested?: string)` that allowlists against discovered models and falls back to `OLLAMA_DEFAULT_MODEL`.

### ORPC: list existing Ollama models

- Add `models.listOllama` procedure in `apps/server/src/routers/index.ts`:
  - No input; returns `{ id: string; displayName: string }[]`.
  - Fetch from Ollama:
    - Try `GET {OLLAMA_BASE_URL}/models` (OpenAI-compatible) and map `data[].id`.
    - Fallback to `GET {OLLAMA_BASE_URL without /v1}/api/tags` and map `models[].name`.
  - Optional in-memory cache (TTL ~30s).

### Chat streaming HTTP endpoint (reuse current patterns)

- Keep `POST /ai` in `apps/server/src/index.ts`:
  - Request body: `{ messages: UIMessage[]; threadId?: string; model?: string; system?: string }`.
  - Use `convertToModelMessages(messages)` and `streamText` with Ollama provider (`resolveModel(model)`).
  - Return `result.toUIMessageStreamResponse({ originalMessages: messages, generateMessageId: () => nanoid(15), onFinish: persist })`.
  - Validation with `zod`; structured error responses.

### Persistence helpers

- Add `apps/server/src/lib/ids.ts`: `generateId()` using `nanoid(15)`.
- Add `apps/server/src/lib/messages.ts`:
  - `uiMessageToDbParts` and `dbMessageToUIMessage` (map reasoning to v5 `parts`).
- Add `apps/server/src/lib/chat-store.ts`:
  - `createThread({ title? })`, `getThread(id)`, `listThreads`, `renameThread`, `setArchived`, `deleteThread`.
  - `saveMessage(...)`, `getMessagesByThread(...)`, `deleteMessage(id)`, `clearThread(threadId)`.
  - `updateThreadOnNewMessage(threadId, lastMessageAt)`.

### Thread and message management via ORPC

- In `apps/server/src/routers/index.ts`, add procedures:
  - `threads.create(title?: string) -> { id }`
  - `threads.list({ includeArchived?: boolean })`
  - `threads.get({ id })`
  - `threads.rename({ id, title })`
  - `threads.archive({ id, isArchived: boolean })`
  - `threads.delete({ id })`
  - `messages.listByThread({ threadId, limit?, cursor? })`
  - Optional: `messages.delete({ id })`, `messages.clearThread({ threadId })`
- All inputs via `zod`; use `publicProcedure` and `dbProvider`.

### Frontend usage (extend current patterns)

- Keep `useChat` with `DefaultChatTransport({ api: VITE_SERVER_URL + '/ai' })` in `apps/web/src/routes/ai.tsx`.
- Use existing orpc client (`apps/web/src/utils/orpc.ts`) to call `models.listOllama` and surface list to UI.
- When a model is selected, include `model` in POST body to `/ai`.

### Security/validation

- Validate `threadId` existence when persisting; error otherwise or skip persist if missing.
- Sanitize `model` by checking against fetched models list (allowlist).
- Graceful fallbacks and meaningful error messages.

### Notes

- Use Vercel AI SDK v5 on backend (`streamText`, `toUIMessageStreamResponse`) and frontend (`useChat`, `DefaultChatTransport`).
- No tests required.
