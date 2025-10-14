# Code Assistant: Investigation & Fix Plan

## Overview
- Goal: Make Code Assistant functional, secure, and user-friendly.
- Scope: Server procedures, repositories, and web client for sessions, generation, review, debug flows.

## Key Issues Found
- Models unavailable → UI disabled (missing provider/seed).
- First-run requires two clicks (session creation then execution).
- Public reads: `getGenerations`/`getReviews` exposed data across users.
- Deletes not user-scoped (`deleteCodeGeneration`/`deleteCodeReview`).
- `explainCode`/`debugCode` didn’t enforce auth while bound to protected UI.
- Session detail showed `modelId` instead of model name.

## Implementation Plan

1) Secure Backend Endpoints
- Protect reads: make `getGenerations`/`getReviews` `protectedProcedure` and verify ownership via `getCodeAssistSession`.
- Scope deletes to current user (repository `delete*` switch to `deleteMany` with `userId`).
- Require auth for `explainCode` and `debugCode` for consistent protected usage.

2) Improve Web UX
- Auto-execute after session creation (single click flow).
- Show model names in session view (fallback to id if not found).
- Use consistent loading copy in sidebar list.

3) Environment & Data Readiness
- Ensure `VITE_SERVER_URL` is set in `apps/web/.env`.
- Ensure models exist: run LM Studio/Ollama or seed DB (`db:push`, `seed:models`).

4) Validation Steps
- Authenticated user can create session and run all modes (generate/explain/review/debug) in one click.
- Session detail lists generations/reviews with model names.
- Cross-user access attempts to another user’s session data fail.
- Deleting a generation/review only works for the owner.

## Follow-ups (Optional Enhancements)
- Return model name in generation/review payloads to avoid extra client fetch.
- Make `sessionId` optional for explain/debug or persist outputs consistently to sessions.
- Enable structured outputs for supported providers to improve JSON reliability.

## Files Touched
- Server: `apps/server/src/procedures/code.ts`, `apps/server/src/repositories/code.ts`.
- Web: `apps/web/src/routes/code.tsx`, `apps/web/src/routes/code.$id.tsx`, `apps/web/src/components/sidebar/code-sessions-list.tsx`.

