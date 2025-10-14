# Code Assistant — Ground‑Up Redesign Plan

## Vision
- Make Code Assist a reliable, safe, and fast developer copilot with first‑class UX, streaming feedback, strict‑JSON guarantees, and auditable outputs.
- Unify Generate/Explain/Review/Debug/Refactor as recipes over a consistent “Run → Artifacts → Patch/Notes” model.
- Treat every interaction as a run with deterministic inputs, structured outputs, and reproducible prompts.

## Guiding Principles
- Safety first: per‑user ownership, strict JSON schemas, tool‑sandboxing, audit logs.
- Observable by default: streaming tokens, run status, metrics, and errors.
- UX > knobs: smart defaults; advanced controls tucked away.
- Trust but verify: every change is a patch/diff with easy revert.
- Provider‑agnostic: Ollama/LM Studio/OpenAI‑compatible via a provider interface.

## Architecture
- Domain
  - Runs: single source of truth for any action (generate/explain/review/debug/refactor).
  - Artifacts: JSON payloads per run (code, review, suggestions, patch, notes).
  - Patches: unified‑diff text tied to a run; always diffable/undoable.
  - Context: language, model, inputs, system/user prompts, files/snippets.
  - Models: catalog with enablement, provider, tags, latency, and health.
- Services
  - Orchestrator: validates recipe, selects model, executes LLM call with strict schema, streams tokens, persists artifacts, emits metrics.
  - Providers: thin adapters over ollama/lmstudio/openai‑compatible with health/timeout/structured outputs.
  - Patcher: generates diffs (AST‑aware for supported langs; fallback to unified diff).
  - Guardrails: prompt templates per recipe, injection hardening, token/rate budgets.
- Transport
  - ORPC for RPC calls + SSE for streaming (or WebSocket if available).
  - Hono still routes `/rpc`; add `/streams/runs/:id` for live updates.

## Data Model (Prisma)
- `CodeWorkspace(id, name, ownerId, createdAt, updatedAt)`
- `CodeSession(id, workspaceId, title, language, createdAt, updatedAt, userId)`
- `CodeRun(id, sessionId, userId, recipe enum('generate','explain','review','debug','refactor'), modelId, status enum('queued','running','succeeded','failed','canceled'), input JSON, systemPrompt text, userPrompt text, startedAt, finishedAt, error text?)`
- `CodeArtifact(id, runId, kind enum('code','review','debug','notes','patch'), content text/JSON, createdAt)`
- `CodePatch(id, runId, diff text, applied boolean default false, createdAt)`
- `LLMModel(id, name, provider, isEnabled, metadata JSON?, lastSeenAt)`

Migration path:
- Keep `CodeAssistSession` as `CodeSession` (migrate columns).
- Deprecate `CodeGeneration`/`CodeReview`; migrate rows into `CodeRun` + `CodeArtifact`.
- Backfill `modelId` and `language` where possible.

## API Surface (ORPC)
- Sessions: `list`, `create(title, language, workspace?)`, `update`, `archive`, `delete`, `getById`
- Runs: `createRun(sessionId, recipe, input, modelId)` → `{ runId, streamToken }`; `getRun(runId)`, `listBySession(sessionId)`, `cancelRun(runId)`
- Artifacts: `listByRun(runId)`
- Patches: `getByRun(runId)`, `apply(runId)`, `revert(runId)` (if applying within a managed workspace)
- Models: `list({ enabled, sync })`, `health()`, `enable/disable`

All procedures protected; every read/write enforces ownership.

## Recipes (Prompts + Schemas)
- Generate
  - Input: `{ spec: string; context?: string; language: string }`
  - Output: `{ code: string; notes?: string; patch?: string }`
- Explain
  - Input: `{ code: string; language: string }`
  - Output: `{ explanation: string; breakdown?: Array<{ line: number; description: string }>; concepts?: string[] }`
- Review
  - Input: `{ code: string; language: string; severityThreshold?: 'low'|'medium'|'high' }`
  - Output: `{ score: number; feedback: string; suggestions: Array<{ type: 'security'|'performance'|'style'|'maintainability'|'bug'; severity: 'critical'|'high'|'medium'|'low'|'info'; message: string; line?: number; fix?: string }> }`
- Debug
  - Input: `{ code: string; error: string; language: string }`
  - Output: `{ rootCause: string; solution: string; codeFix?: string; prevention?: string[] }`
- Refactor
  - Input: `{ code: string; goal: string; language: string }`
  - Output: `{ code: string; patch?: string; notes?: string }`

Strict JSON: enable structured outputs for supported providers; fallback extractor only when required. Validate with Zod; on failure, retry with narrowed prompts.

## Streaming Model
- `createRun` → returns `runId` and immediately starts streaming.
- Server streams: status events (queued→running→finished), token chunks (optional), and final validated artifact event.
- Client subscribes to `/streams/runs/:id`; updates UI in real time.

## UX Rework
- Single‑page Code Assistant with three panes:
  - Left: Sessions list (search, filter by language/model, unread markers).
  - Center: Composer + Editor (Monaco)
    - Recipe tabs (Generate/Explain/Review/Debug/Refactor)
    - Inputs: language, model, context, code editor, error message when needed
    - Primary “Run”; “Stop” while streaming
  - Right: Results Timeline
    - Each run shows status + artifacts (code/explanations/suggestions) and a patch view
    - Actions: Apply Patch (if workspace integration) or Copy Patch
- Empty states: “No models available” (setup guidance), “First session” quick‑start
- Session detail `/code/$id`: timeline with filters (recipe/date/status), export (JSON/Markdown)

Accessibility/i18n: labeled controls, keyboard accessible, Persian copy via `fa.*`, no positive tabIndex, buttons have `type`.

## Provider Layer
- Provider interface in `apps/server/src/services`:
  - `listModels()`, `health()`, `generateText()`, `generateObject(schema, opts)`
  - Structured outputs when supported; timeouts, token/temperature bounds per recipe
  - Periodic health; store `lastSeenAt`; surface in UI

## Security
- All endpoints protected; strict per‑user ownership in queries.
- Rate limiting per user/workspace.
- Audit log per run (inputs hash, model, prompt identifiers, output sizes).
- Prompt‑injection hardening: sanitize code fences, restrict tool calls, cap lengths.

## Observability
- Metrics: counts, failures, latency per recipe/model, JSON‑validation failures.
- Logs: start/finish, error codes, partial output on failure (user‑owned).
- Admin health page for providers and sync status.

## Testing Strategy
- Unit: schema validation, prompt builders, provider adapters, diff generator.
- Integration: recipe flows with mock providers + DB checks.
- E2E: login → create session → run generate → artifacts/patch view.
- Load: concurrency for generate/review to validate queue/backpressure.

## Migration Plan
- Phase 0: Add new tables alongside existing; feature‑flag new UI under `/code2`.
- Phase 1: Provider layer + orchestrator; wire Generate/Explain on new UI.
- Phase 2: Review/Debug/Refactor, streaming, patches; backfill old data to runs/artifacts.
- Phase 3: Switch nav to new UI; retire old endpoints; cleanup migration.

## Milestones
- M1: Domain + DB + Provider skeleton (1–2 days)
- M2: Orchestrator + structured outputs + streaming (2–3 days)
- M3: New UI (sessions/composer/timeline) + Generate/Explain (2–3 days)
- M4: Review/Debug/Refactor + Patch view (2–3 days)
- M5: Security, rate limits, health checks, admin tools (1–2 days)
- M6: Tests (unit/integration/E2E) + docs + migration (2–3 days)

## Concrete Deliverables
- Server
  - New models and migrations in `apps/server/prisma/schema.prisma`
  - Orchestrator + provider adapters in `apps/server/src/services/*`
  - ORPC v2 procedures with streaming in `apps/server/src/procedures/code-v2.ts`
- Web
  - New route `apps/web/src/routes/code2.tsx` (Monaco editor, timeline results)
  - Sidebar integration with unified sessions list and live updates
  - Reusable `ResultCard`, `DiffView`, `PatchActions` components
- Docs
  - `specs/code-assist-redesign.md` (recipes, schemas, API contracts)
  - Runbooks for model setup and health checks

