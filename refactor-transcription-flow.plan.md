# Transcription Flow Refactor Plan

Refactor, streamline, enhance, and improve the transcription feature end-to-end: Web → Server → Whisper service. This document describes the current flow, key issues, and a phased plan for improvement.

## Goals

- Improve reliability and performance across browsers
- Reduce client-side processing and memory usage
- Align model id semantics end-to-end
- Improve UX (duration limits, cancel, file upload)
- Harden API validation, logging, and error handling
- Make Whisper service more efficient and extensible (silence-trim, segments)
- Add observability and tests

---

## Current Flow (Summary)

- Web
- Recording: `MediaRecorder` captures audio (webm/opus preferred) via `useVoiceRecorder`.
- Conversion: `useTranscription` converts recorded file to WAV 16kHz mono in browser via `fileToWav16kMono`.
- RPC: Sends WAV file via ORPC to `transcribe` procedure.
- UI: `TranscribeButton` (inline) and `/transcribe` route manage UX; fetch model list.

- Server (Bun/Hono)
- `transcribeProcedures.transcribe` proxies inputs to Whisper service via `services/ai-providers/whisper.transcribe`.
- Health check probes Whisper service.
- Whisper model list fetched from Whisper service with a small cache and local fallback.

- Whisper Service (FastAPI)
- `/transcribe`: saves upload to temp file; runs either `whisperx` or `whisper` Python engine; returns `{ text }`.
- `/models`: returns a static list of Whisper(-X) model ids.
- Health endpoint and docker-compose provided.

---

## What’s Working Well

- Clear separation of concerns (web → server proxy → whisper microservice)
- Timeouts and health check for Whisper service
- Minimal model caching on server with fallback
- Localized error messages on client
- File size checks (client + whisper service)

---

## Key Issues and Gaps

1) Client-side WAV conversion (web → WAV 16kHz mono)

- Heavy and memory-intensive on large audio; fragile on Safari/older devices
- Unnecessary: Whisper service supports common audio formats (webm, mp3, m4a, wav)

2) TanStack query misuse for model list

- `TranscribeButton` passes `{ enabled: showControls }` as RPC input instead of React Query options, risking Zod errors

3) Model id mismatch across stack

- Web/server default uses values like `Xenova/whisper-tiny`
- Whisper service expects canonical ids like `tiny`, `base`, `small`, `medium`, `large`, `large-v2`, `large-v3`

4) Missing UX features

- No enforced max recording duration (progress bar is only visual)
- No cancel of in-flight transcription request
- No file upload support (voice-only)
- No engine selection in UI (engine is configurable on server but not exposed)

5) API validation robustness

- Server Zod uses `z.instanceof(File)` which can be brittle outside browser contexts; better accept `Blob`-like with `name`

6) Error handling and observability

- Inconsistent structured errors (no stable `code`, `requestId` propagation)
- Whisper service reads entire upload into memory (await file.read()), which can cause spikes

7) Performance and quality opportunities

- No silence trim/VAD pre-processing (either client or server)
- No optional timestamped segments (WhisperX returns segments)
- No warm-up/preload to reduce cold start latency

---

## Proposed Improvements (by Layer)

### Web

- Remove default client-side WAV conversion
- Send original recorded `webm/opus` (or other captured format) to server
- Add guarded fallback (feature-flag) to convert to WAV only if server indicates codec unsupported

- Max recording duration and auto-stop
- Configurable cap (e.g., 45s); auto-stop recorder; show textual countdown/progress

- Cancel in-flight transcription
- Propagate AbortController to the request layer (RPC link or a dedicated fetch for this endpoint)

- Fix model list query usage
- Pass RPC input and React Query options separately; avoid sending `{ enabled }` to the RPC input

- File upload support
- Add file input/drag-and-drop on `/transcribe` route; reuse same pipeline

- Engine and model selection (optional)
- Add engine select (whisperx/whisper) alongside model select (default to `tiny`)

- Accessibility and a11y
- Ensure buttons have `type="button"`, `title`, proper `aria-*`, keyboard handlers where applicable
- Follow project a11y rules (no positive tabIndex, proper roles only when needed, etc.)

### Server (Bun/Hono)

- Align model ids end-to-end
- Default to canonical ids: `tiny`, `base`, `small`, `medium`, `large`, `large-v2`, `large-v3`
- Remove references to `Xenova/*` in server config

- Input schema robustness
- Replace `z.instanceof(File)` with tolerant schema that accepts `Blob & { name: string }`
- Preserve `name` for Whisper service to infer suffix

- Error handling and logging
- Return errors as `{ code, message, requestId }` consistently
- Add request-level logging with timing and file size stats, via server logger (no console)

- Basic rate limiting and auth
- Optional: protect `transcribe` to prevent abuse; add per-user concurrency guard (TTL map)

### Whisper Service (FastAPI)

- Efficient upload handling
- Use `SpooledTemporaryFile` or stream chunks to disk; avoid reading entire file into memory at once

- Optional pre-processing
- Add silence trimming with ffmpeg `silenceremove` or light-weight VAD (flag-controlled)

- Optional segmented outputs
- Add `returnSegments=true` to return segments/timestamps (default off)
- Maintain current default of returning plain text only

- Warm-up
- Preload default model on startup or lazy-load on first call (configurable)
- Log warm-up durations for observability

- Better diagnostics and security
- Return structured errors with codes; add simple per-IP rate limiting middleware

---

## Phased Implementation Plan

### Phase 1 — Stabilize and Align (Low Risk)

1) Fix model list query in TranscribeButton

- Correct React Query usage; pass RPC input separately from query options
- Ensure `showControls` drives whether the query runs, without changing RPC input shape

2) Align model ids end-to-end

- Server: change `WHISPER_MODELS` defaults from `Xenova/whisper-tiny` to `tiny`
- Web: default selected model on `/transcribe` to `tiny`
- Server: forward these exact ids to Whisper service; fallback gracefully if unknown

3) Relax server-side schema for file input

- Change Zod to accept `Blob & { name: string }` instead of `instanceof File`
- Preserve `name` and `type` if available

4) Improve server error handling

- Wrap Whisper service errors with consistent `{ code, message, requestId }`
- Add logging with timing and file size (use project logger)

Deliverables:

- No client WAV conversion changes yet
- Model ids consistent; model list displays/stores correct values
- No spurious Zod input errors
- Better error messages

### Phase 2 — Performance and UX

5) Remove default client-side WAV conversion

- `useTranscription`: send original blob by default
- Keep a guarded fallback behind a feature flag or specific user-agent quirk detection

6) Max recording duration and auto-stop

- Enforce limit (e.g., 45s)
- UI shows countdown/progress accurately; recorder auto-stops at cap

7) Cancel support

- Expose AbortController path to the request
- Add “Cancel” button during transcription and disable appropriate controls

8) File upload support

- Add drag-and-drop/file picker on `/transcribe`
- Reuse same pipeline and validations (size limits, etc.)

Deliverables:

- Noticeable performance gains on weak devices
- Better user control and prevention of oversized recordings
- Broader input support (file upload)

### Phase 3 — Quality and Features

9) Whisper pre-processing

- Add optional `trimSilence` flag; apply ffmpeg `silenceremove` or light VAD
- Keep defaults safe and fast; document how to enable

10) Segmented outputs (optional)

- Support `returnSegments=true` param
- Server plumbs through; web optionally displays a segment viewer (off by default)

11) Model warm-up and cache management

- Preload default model on startup or lazy
- Add maintenance endpoint to clear cache if required

12) Security & rate-limiting

- Server: add per-user rate limits for `transcribe`
- Whisper: simple per-IP rate limit

Deliverables:

- Better transcription quality for noisy inputs
- Optional timestamps for advanced use cases
- Lower cold-start latency

### Phase 4 — Observability and Tests

13) Telemetry

- Measure upload time, server proxy time, whisper processing time
- Log with requestId; optionally expose in a developer diagnostics panel

14) Tests

- Web: `useVoiceRecorder` boundaries; `useTranscription` without WAV conversion
- Server: schema accepts blobs; engine/model forwarded correctly
- Whisper: routes handle large/small files; pre-processing flags; preload success
- E2E: record short audio in browser tests, run full pipeline, validate output

Deliverables:

- Clear metrics for performance tuning
- Confidence via unit/integration/e2e tests

---

## Acceptance Criteria

- Recording works reliably in Chrome, Edge, Firefox, Safari
- Transcription succeeds for FA/EN without client WAV conversion by default
- Max duration enforced; auto-stop works; cancel works
- Model list loads and model selection is persisted; defaults to `tiny`
- No Zod errors from mis-wired queries; server accepts `Blob` reliably
- Whisper service optionally trims silence; can return segments if requested
- Structured errors and requestId propagated; no console logs
- Basic rate limiting prevents obvious abuse

---

## Risks and Mitigations

- Browser compatibility differences
- Keep minimal feature set for recording; test Safari specifically
- Maintain guarded WAV conversion fallback

- Whisper service performance on CPU
- Default to tiny/base; document compute_type tuning
- Provide CUDA image variant and warm-up

- Increased API surface (segments, trimSilence)
- Keep defaults unchanged to avoid regressions
- Feature-flag new options; rollout gradually

---

## Dependencies

- FastAPI and Python dependencies (whisper, whisperx, torch)
- ffmpeg available in Whisper image for silence trimming
- Bun/Hono server environment with file uploads
- ORPC link updates for abortable requests (or a dedicated fetch path)

---

## Rollout Plan

- Implement Phase 1; deploy and verify no regressions
- Implement Phase 2; A/B test WAV removal behind flag, then enable by default
- Implement Phase 3 optional features guarded by flags
- Add telemetry and tests in Phase 4; monitor and iterate

---

## Open Questions

- Do we want diarization now or later? (WhisperX supports diarization pipelines; adds complexity)
- Should segments be stored server-side for future features or only returned on-demand?
- Do we require auth for transcription in all environments or only production?

---

## File and Component Impact (Checklist)

- Web
- hooks
  - [ ] `apps/web/src/hooks/use-transcription.ts` (remove default WAV conversion; add abort)
  - [ ] `apps/web/src/hooks/use-voice-recorder.ts` (max duration, auto-stop)
- components
  - [ ] `apps/web/src/components/transcribe-button.tsx` (fix query usage; cancel; a11y)
- routes
  - [ ] `apps/web/src/routes/transcribe.tsx` (file upload, engine selection, cancel, UX polish)
- utils
  - [ ] `apps/web/src/utils/audio.ts` (keep as fallback only)

- Server
- procedures
  - [ ] `apps/server/src/procedures/transcribe.ts` (schema fix; structured errors; engine/model alignment)
- services
  - [ ] `apps/server/src/services/ai-providers/whisper.ts` (model id alignment; improved error mapping; logs)
- config
  - [ ] `apps/server/src/config.ts` (remove Xenova model defaults; align to canonical ids)
- app
  - [ ] `apps/server/src/app.ts` (optional: structured error handler/requestId propagation)

- Whisper Service
- routes
  - [ ] `apps/whisper/api/routes.py` (stream to disk; optional trim; optional segments; structured errors)
- engines
  - [ ] `apps/whisper/api/engines/whisper_engine.py` (no change expected)
  - [ ] `apps/whisper/api/engines/whisperx_engine.py` (no change expected)
- models
  - [ ] `apps/whisper/api/models.py` (ensure canonical ids; docstrings)
- main/config
  - [ ] `apps/whisper/api/main.py` (warm-up; logs)
  - [ ] `apps/whisper/api/config.py` (flags for trimSilence, preload, rate limits)

- Tests
- [ ] Add unit tests for web hooks
- [ ] Add server procedure tests (schema, forwarding)
- [ ] Add whisper route tests (size limits, flags)
- [ ] Add E2E route test for the whole pipeline

---

## Appendix: Error Codes (Draft)

- TRANSCRIBE_UNAVAILABLE: Whisper service not reachable/timeout
- TRANSCRIBE_UNSUPPORTED_FORMAT: Input codec not supported by backend
- TRANSCRIBE_TOO_LARGE: File too large
- TRANSCRIBE_FAILED: General failure
- RATE_LIMITED: Request rejected due to rate limit

Each response should include `{ code, message, requestId? }`.

---