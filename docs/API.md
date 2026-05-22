# API

## ORPC Procedures

All procedures are exported from `apps/server/src/procedures/`.

| Procedure | File | Description |
|-----------|------|-------------|
| `healthProcedures` | `health.ts` | Health check endpoint |
| `authProcedures` | `auth.ts` | Login, register, token management |
| `adminProcedures` | `admin.ts` | User management, model CRUD, Ollama server management, settings |
| `appConfigProcedures` | `app-config.ts` | Feature toggles and app configuration |
| `llmModelProcedures` | `llm-models.ts` | Available LLM model listing |
| `threadProcedures` | `threads.ts` | Chat thread CRUD |
| `messageProcedures` | `messages.ts` | Chat message operations |
| `translationProcedures` | `translation.ts` | Text translation |
| `transcribeProcedures` | `transcribe.ts` | Audio transcription via Whisper |
| `summarizeProcedures` | `summarize.ts` | Text summarization |
| `imageProcedures` | `images.ts` | Image generation (Stable Diffusion) |
| `imageThreadProcedures` | `image-threads.ts` | Image generation thread management |
| `codeProcedures` | `code.ts` | Code generation/execution |
| `documentProcedures` | `documents.ts` | Document upload, indexing, RAG |

## REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health check |
| POST | `/api/chat` | Chat completions |
| GET | `/api/images/:id/file` | Serve generated image |
| GET | `/api/images/:id/download` | Download generated image |
| Any | `/rpc` | ORPC handler (all procedures) |

## Auth

- JWT-based authentication via `Authorization: Bearer <token>` header.
- Required auth middleware enforces valid token and user existence.
- Optional auth middleware validates token if present but allows unauthenticated access.
