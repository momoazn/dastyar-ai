# Transcription Flow Refactor - Implementation Summary

## Overview

Successfully refactored the transcription feature according to the simplified plan. The new implementation follows a straight-line flow (web → server → whisper-api) with minimal abstractions, no client-side audio conversion, and clear error handling.

## Changes Made

### 1. Web Layer Changes

#### `apps/web/src/hooks/use-transcription.ts`
- **Removed** client-side WAV conversion (`fileToWav16kMono`)
- **Added** `engine` parameter to `TranscriptionArgs`
- **Simplified** `transcribe` function to directly send the file without conversion
- Now sends raw recorded files (typically webm/opus) directly to server

#### `apps/web/src/routes/transcribe.tsx`
- **Added** engine selector with options: "whisperx" (default) and "whisper"
- **Changed** default model from `"Xenova/whisper-tiny"` to `"tiny"`
- **Reorganized** UI layout to show engine/language/model controls at the top
- **Updated** query to pass `engine` parameter to `transcribe.models`
- **Fixed** all transcribe calls to pass `engine` parameter
- **Updated** dependency arrays to include `engine`

#### `apps/web/src/components/transcribe-button.tsx`
- **Added** `engine` prop with default `"whisperx"`
- **Added** `onEngineChange` callback prop
- **Added** engine selector in `showControls` mode
- **Updated** query to pass `engine` to `transcribe.models.queryOptions`
- **Fixed** all transcribe calls to include `engine` parameter
- **Updated** dependency arrays to include `engine`

### 2. Server Layer Changes

#### `apps/server/src/procedures/transcribe.ts`
- **Updated** `transcribe` input schema to accept `Blob & { name: string }` (more tolerant)
- **Added** file size validation (non-empty check)
- **Changed** language validation to strict enum: `["fa", "en"]`
- **Added** `engine` parameter support
- **Changed** default model logic to always use `"tiny"`
- **Added** Blob-to-File conversion for whisper service compatibility
- **Simplified** model selection logic

#### `apps/server/src/services/ai-providers/whisper.ts`
- **Removed** complex pretty-name generation (`prettyWhisperName`, regex patterns)
- **Added** static fallback model list with simple names:
  - `tiny`, `base`, `small`, `medium`, `large`, `large-v2`, `large-v3`
- **Updated** `getWhisperModels()` to prefer API models, fallback to static list
- **Enhanced** error mapping in `mapTranscriptionError()`:
  - Detects service unavailable/timeout/network errors
  - Detects 413 (payload too large) errors
  - Returns localized Persian error messages
- **Maintained** models cache with 60-second TTL

#### `apps/server/src/config.ts`
- **Changed** default `WHISPER_MODELS` from `"Xenova/whisper-tiny"` to `"tiny"`
- **Simplified** `defaultWhisperModel` to always be `"tiny"`
- **Updated** fallback `whisperModelIds` to use `["tiny"]`

### 3. Unchanged Components

- `apps/web/src/utils/audio.ts` - Kept for potential future use
- Whisper API (FastAPI service) - No changes required
- Docker configuration - No changes required

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│ Web (MediaRecorder → raw file, typically webm/opus)        │
│ - Select engine: "whisperx" | "whisper"                     │
│ - Select model: "tiny" | "base" | "small" | ...            │
│ - Select language: "fa" | "en"                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Server (Bun/Hono ORPC)                                      │
│ - Receive Blob & { name }, engine, model, language         │
│ - Forward to Whisper API as multipart form-data            │
│ - Map errors to localized messages                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ Whisper API (FastAPI)                                       │
│ - POST /transcribe                                          │
│ - GET /models                                               │
│ - Returns { text } or HTTP error                            │
└─────────────────────────────────────────────────────────────┘
```

## Key Improvements

### Simplicity
- Removed client-side audio conversion (no AudioContext processing)
- Direct file upload without intermediate transformations
- Minimal abstractions and straightforward flow

### Error Handling
- Clear, localized error messages in Persian
- Specific handling for:
  - Service unavailable
  - Network/timeout errors
  - File too large (413)
  - Generic failures

### User Experience
- Engine selection (WhisperX vs Whisper)
- Model selection with fallback to static list
- Language selection (Persian/English)
- Default model changed to "tiny" for faster processing

### Flexibility
- Easy to add more engines in the future
- Simple model list management
- Configurable via `config.json`

## Configuration

Default settings in `config.json`:
```json
{
  "WHISPER_SERVER_URL": "http://127.0.0.1:8001",
  "WHISPER_TIMEOUT_MS": 120000,
  "WHISPER_MODELS": "tiny",
  "TRANSCRIBE_DEFAULT_ENGINE": "whisperx"
}
```

## Error Messages (Persian)

1. **Service unavailable**: "سرویس تشخیص گفتار در دسترس نیست. لطفاً Whisper Server را اجرا کنید."
2. **File too large**: "فایل ضبط شده خیلی بزرگ است. لطفاً صدای کوتاه‌تری ضبط کنید."
3. **Generic error**: "تبدیل صوت به متن انجام نشد. لطفاً دوباره تلاش کنید."

## Testing Checklist

- [x] Code compiles without errors
- [ ] Engine selector works (WhisperX/Whisper)
- [ ] Model selector populates correctly
- [ ] Model selector falls back to static list when API unavailable
- [ ] Language selector works (fa/en)
- [ ] Recording captures audio
- [ ] Audio uploads without conversion
- [ ] Transcription returns text
- [ ] Error messages display correctly
- [ ] Retry button works
- [ ] TranscribeButton component works in other views

## Migration Notes

### Breaking Changes
None - the API remains compatible with existing code.

### Behavioral Changes
1. Files are now sent as-is (webm/opus) instead of converted to WAV
2. Default model changed from `Xenova/whisper-tiny` to `tiny`
3. Model names simplified (no more pretty-name generation)
4. Static model fallback when Whisper API is unavailable

### Recommended Actions
1. Update `config.json` to use simple model names: `"tiny,base,small"`
2. Ensure Whisper API can handle webm/opus files (should work by default)
3. Test with both WhisperX and Whisper engines

## Future Enhancements (Out of Scope)

- Cancel in-flight requests
- Max duration enforcement
- Silence trimming/VAD
- Timestamped segments
- Streaming transcription
- Telemetry and rate-limiting
- Authentication/authorization
- Special Safari handling

## Files Modified

**Web (4 files):**
- `apps/web/src/hooks/use-transcription.ts`
- `apps/web/src/routes/transcribe.tsx`
- `apps/web/src/components/transcribe-button.tsx`

**Server (3 files):**
- `apps/server/src/procedures/transcribe.ts`
- `apps/server/src/services/ai-providers/whisper.ts`
- `apps/server/src/config.ts`

**Documentation (1 file):**
- `TRANSCRIPTION_REFACTOR_SUMMARY.md` (this file)

## Acceptance Criteria Status

✅ UI allows selecting engine, model, and language with correct defaults
✅ No client-side audio conversion
✅ No reliance on external commands
✅ Clear error messages
✅ Minimal codepaths and reduced abstractions
✅ Straight-line flow: web → server → whisper-api

---

**Implementation completed:** All changes have been applied and code compiles without errors.
**Next step:** Manual testing with Whisper API running.
