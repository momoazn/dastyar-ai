# Transcription Flow Refactor Plan (Simplified)

Revamp the transcription feature to be as simple as possible while meeting these requirements:
- Good error handling
- Engine, model, and language selectable from the UI
- No reliance on system-level commands or external environment dependencies in the web/server (only the Whisper API is required)
- Minimal abstractions with a straightforward web → server → whisper-api flow
- No special Safari handling required

---

## Scope and Constraints

- Simplicity first: remove nonessential features and complexity.
- Web and server must not shell out to system binaries (e.g., ffmpeg) or rely on platform-specific dependencies.
- Whisper API remains the only external service dependency (containerized).
- No streaming, diarization, VAD, segmentation, telemetry, or model warm-up in this iteration.
- Retain Whisper API endpoints and Docker setup as-is.

---

## Target Architecture (Straight-line Flow)

- Web
  - Capture audio with `MediaRecorder` (default format, typically `webm/opus`).
  - Send the raw recorded file directly to the server without client-side conversion.
  - Provide UI controls to select engine, model, and language.
  - Display clear and localized error messages.

- Server (Bun/Hono)
  - Receive `Blob & { name }`, engine, model, language.
  - Forward to Whisper API `/transcribe` as multipart form-data.
  - Return the resulting text, mapping errors to user-friendly messages.

- Whisper API (FastAPI)
  - Unchanged. Accepts file upload, engine, model, language.
  - Responds with `{ text }` or appropriate HTTP errors.

No other components, no extra services, no background workers.

---

## UX and UI Plan

- Page: `/transcribe`
  - Engine select: "WhisperX" (default), "Whisper".
  - Model select: loaded via server (`/rpc/transcribe.models`) from Whisper API.
    - If Whisper API unavailable, fall back to a small static list: [`tiny`, `base`, `small`, `medium`, `large`, `large-v2`, `large-v3`].
    - Default model: `tiny`.
  - Language select: `fa` and `en`.
  - Record button: start/stop recording. Simple status indicator.
  - Optional re-run button to retry the last audio without re-recording.
  - Text area to show the transcription result.
  - Error alert for clear feedback.

- Inline transcribe button (reused in other views like chat or image gen)
  - Minimal: language, model, and (if needed) engine props.
  - No extra state coupling.

---

## API Contracts

- Client → Server (ORPC: `transcribe.transcribe`)
  - Input:
    - `file: Blob & { name: string }`
    - `engine?: "whisperx" | "whisper"` (default: "whisperx")
    - `model?: string` (default: "tiny")
    - `language?: "fa" | "en"` (default: "fa")
  - Output: `string` (plain text)

- Client → Server (ORPC: `transcribe.models`)
  - Input: `{ engine?: "whisperx" | "whisper" }` (optional)
  - Output: `Array<{ id: string; name: string }>`
  - Fallback behavior if Whisper API is down: return static list with pretty names.

- Server → Whisper API
  - POST `/transcribe` with multipart form-data: `file`, `engine`, `model`, `language`.
  - GET `/models` to populate model select (best-effort; fallback to static).

---

## Error Handling (Simple and Clear)

- Whisper API unreachable, timeouts, aborted requests
  - Server: map to human-readable message like “Speech service is unavailable. Please run the Whisper server.”
  - Client: show error alert; allow user to retry.

- Payload too large (413 from Whisper)
  - Server: map to “The recorded file is too large. Please record a shorter audio.”

- Unknown errors (5xx, malformed responses)
  - Server: map to “Transcription failed. Please try again.”
  - Client: show alert and return user to idle state.

- Keep server error messages consistent. Return plain strings to the UI for now (no structured error codes needed for this simplified version).

---

## Simplifications (compared to previous plan)

- Remove client-side WAV conversion. Send whatever `MediaRecorder` produces directly.
- No cancel-in-flight control (keep the network call simple).
- No max-duration enforcement logic (keep recording control minimal).
- No additional processing (silence trim/VAD/segments).
- No special Safari handling (explicitly not required).
- Minimal model caching: direct fetch with one short in-memory cache or no cache; fallback to static list if failing once.

---

## Implementation Steps

Step 1 — Web: remove client-side conversion and wire simple UI
- Update `use-transcription`:
  - Remove WAV conversion. Directly send `file` to `orpc.transcribe.transcribe`.
  - Support optional `engine`, `model`, and `language`.
- Update `/transcribe` route:
  - Add engine select (whisperx|whisper; default whisperx).
  - Keep language select (fa|en; default fa).
  - Change default model to `tiny`.
  - Pass the selected engine/model/language into `useTranscription`.
- Update `TranscribeButton`:
  - Ensure model/engine/language props pass through correctly.
  - Fetch models with input `{ engine }` using query options correctly (do not mix input with query options).

Step 2 — Server: simplify procedures and error mapping
- `transcribe.models`
  - Fetch from Whisper API `/models`.
  - On failure: return static list with human-readable names.
  - Optional: tiny in-memory cache to avoid frequent calls.
- `transcribe.transcribe`
  - Accept `Blob & { name }`.
  - Forward multipart form-data to Whisper API `/transcribe`.
  - Map known error conditions (unreachable, timeout, 413) to friendly messages.

Step 3 — Whisper API
- No changes required. Keep the Dockerized service as the single external dependency.

---

## File Impact Checklist

- Web
  - hooks
    - [ ] `apps/web/src/hooks/use-transcription.ts` (remove conversion; accept engine/model; simple mutation)
  - routes
    - [ ] `apps/web/src/routes/transcribe.tsx` (add engine select; default model to `tiny`; pass engine/model/language to hook)
  - components
    - [ ] `apps/web/src/components/transcribe-button.tsx` (ensure proper query input; pass engine/model/language)
  - utils
    - [ ] `apps/web/src/utils/audio.ts` (no longer used by transcription; leave as-is for future use)
- Server
  - procedures
    - [ ] `apps/server/src/procedures/transcribe.ts` (tolerant file schema `Blob & { name }`; forward engine/model/language; friendly errors)
  - services
    - [ ] `apps/server/src/services/ai-providers/whisper.ts` (keep simple POST/GET; map errors; optional tiny cache for models)
  - config
    - [ ] `apps/server/src/config.ts` (default engine: whisperx; default models static list includes `tiny`; Whisper API URL default remains `http://127.0.0.1:8001`)
- Whisper API
  - No code changes required

---

## Acceptance Criteria

- UI allows selecting engine, model, and language; defaults to `whisperx`, `tiny`, and `fa`.
- Recording and transcription work end-to-end with a simple flow (web → server → whisper-api).
- No client-side audio conversion or reliance on external commands.
- Clear error messages for unavailable service, too-large files, and generic failures.
- Minimal codepaths and reduced abstractions compared to the previous design.

---

## Out of Scope (Intentionally Deferred)

- Cancel in-flight requests
- Max duration enforcement
- Silence trimming/VAD, timestamped segments
- Streaming transcription
- Telemetry, rate-limiting, auth
- Special Safari handling

These can be added later if needed without changing the simplified architecture.
