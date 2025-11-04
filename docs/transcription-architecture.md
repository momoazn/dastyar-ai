# Transcription Architecture

## System Overview

The transcription system consists of three main layers:

1. **Web Layer** (React/TypeScript)
2. **Server Layer** (Bun/Hono)
3. **Whisper API** (FastAPI/Docker)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                            WEB LAYER                                 │
│                         (React/TypeScript)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────┐        ┌──────────────────────┐          │
│  │  /transcribe Route   │        │  TranscribeButton    │          │
│  │                      │        │    Component         │          │
│  │  • Engine Select     │        │                      │          │
│  │  • Model Select      │        │  • Inline Controls   │          │
│  │  • Language Select   │        │  • Compact UI        │          │
│  │  • Recording UI      │        │  • Reusable          │          │
│  │  • Result Display    │        │                      │          │
│  └──────────┬───────────┘        └──────────┬───────────┘          │
│             │                               │                       │
│             └───────────┬───────────────────┘                       │
│                         │                                           │
│                         ▼                                           │
│              ┌──────────────────────┐                               │
│              │  useTranscription    │                               │
│              │       Hook           │                               │
│              │                      │                               │
│              │  • No WAV conversion │                               │
│              │  • Direct file send  │                               │
│              │  • Error handling    │                               │
│              └──────────┬───────────┘                               │
│                         │                                           │
│                         ▼                                           │
│              ┌──────────────────────┐                               │
│              │  MediaRecorder API   │                               │
│              │                      │                               │
│              │  Output: webm/opus   │                               │
│              │  (Browser Native)    │                               │
│              └──────────┬───────────┘                               │
│                         │                                           │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
                          │ ORPC Call
                          │ { file, engine, model, language }
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          SERVER LAYER                                │
│                          (Bun/Hono)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              transcribe.ts (ORPC Procedures)               │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                             │    │
│  │  ┌──────────────────┐         ┌──────────────────┐        │    │
│  │  │ transcribe.models│         │transcribe.transcribe│      │    │
│  │  │                  │         │                     │      │    │
│  │  │ Input:           │         │ Input:              │      │    │
│  │  │  - engine?       │         │  - file (Blob)      │      │    │
│  │  │                  │         │  - engine?          │      │    │
│  │  │ Output:          │         │  - model?           │      │    │
│  │  │  - ModelInfo[]   │         │  - language?        │      │    │
│  │  │                  │         │                     │      │    │
│  │  │ • Cached 60s     │         │ Output:             │      │    │
│  │  │ • Fallback list  │         │  - string (text)    │      │    │
│  │  └────────┬─────────┘         └──────────┬──────────┘      │    │
│  │           │                              │                 │    │
│  └───────────┼──────────────────────────────┼─────────────────┘    │
│              │                              │                       │
│              │                              │                       │
│              ▼                              ▼                       │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │       whisper.ts (AI Provider Service)                  │       │
│  ├─────────────────────────────────────────────────────────┤       │
│  │                                                          │       │
│  │  • getWhisperModels()                                   │       │
│  │    - Fetch from Whisper API                             │       │
│  │    - Cache results (60s TTL)                            │       │
│  │    - Fallback to static list if unavailable             │       │
│  │                                                          │       │
│  │  • transcribe()                                         │       │
│  │    - Build multipart/form-data                          │       │
│  │    - POST to Whisper API                                │       │
│  │    - Map errors to Persian messages                     │       │
│  │                                                          │       │
│  │  • mapTranscriptionError()                              │       │
│  │    - Service unavailable → Persian message              │       │
│  │    - 413 Too Large → Persian message                    │       │
│  │    - Generic error → Persian message                    │       │
│  │                                                          │       │
│  └──────────────────────────┬──────────────────────────────┘       │
│                             │                                       │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                              │ HTTP Request
                              │ POST /transcribe (multipart/form-data)
                              │ GET /models
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        WHISPER API LAYER                             │
│                    (FastAPI in Docker Container)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                     FastAPI Endpoints                       │    │
│  ├────────────────────────────────────────────────────────────┤    │
│  │                                                             │    │
│  │  POST /transcribe                                          │    │
│  │  ├─ file: audio file (webm/opus/wav/mp3/...)              │    │
│  │  ├─ engine: "whisperx" | "whisper"                         │    │
│  │  ├─ model: "tiny" | "base" | "small" | ...                │    │
│  │  └─ language: "fa" | "en" | ...                            │    │
│  │                                                             │    │
│  │  Returns: { "text": "..." }                                │    │
│  │                                                             │    │
│  │  ─────────────────────────────────────────────────         │    │
│  │                                                             │    │
│  │  GET /models                                               │    │
│  │  Returns: [{ "id": "...", "name": "..." }, ...]           │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  Container: whisper-api                                              │
│  Port: 8001                                                          │
│  Managed by: docker-compose.whisper.yml                              │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Recording Phase

```
User clicks "Start Recording"
         ↓
MediaRecorder.start()
         ↓
User speaks (audio captured)
         ↓
User clicks "Stop Recording"
         ↓
MediaRecorder.stop()
         ↓
Blob created (webm/opus format)
         ↓
File object created with name
```

### 2. Transcription Phase

```
File + engine + model + language
         ↓
useTranscription hook
         ↓
ORPC mutation: transcribe.transcribe
         ↓
Server receives Blob & { name }
         ↓
Server validates input
         ↓
Server converts Blob to File
         ↓
Server builds FormData
         ↓
HTTP POST to Whisper API
         ↓
Whisper API processes audio
         ↓
Returns JSON: { "text": "..." }
         ↓
Server returns string to client
         ↓
UI displays transcribed text
```

### 3. Model Loading Phase

```
Component mounts
         ↓
Query: transcribe.models({ engine })
         ↓
Server checks cache (60s TTL)
         ↓
Cache miss → Fetch from Whisper API
         ↓
GET http://127.0.0.1:8001/models
         ↓
Success: Return models list
         ↓
Failure: Return static fallback list
         ↓
Cache result
         ↓
Return to client
         ↓
UI populates dropdown
```

---

## Component Relationships

```
┌─────────────────────────────────────────────────────┐
│                  /transcribe Route                   │
│                                                       │
│  State:                                              │
│  • engine: "whisperx" | "whisper"                   │
│  • model: string                                     │
│  • language: "fa" | "en"                            │
│  • result: string                                    │
│  • error: string | null                             │
│                                                       │
│  Uses:                                               │
│  • useTranscription()                               │
│  • useVoiceRecorder()                               │
│  • useQuery(transcribe.models)                      │
│                                                       │
└─────────────────────────────────────────────────────┘
                         │
                         │ uses
                         ▼
┌─────────────────────────────────────────────────────┐
│              useTranscription Hook                   │
│                                                       │
│  Accepts:                                            │
│  • onSuccess callback                               │
│  • onError callback                                 │
│                                                       │
│  Returns:                                            │
│  • transcribe(args) function                        │
│  • isPending boolean                                │
│                                                       │
│  Uses:                                               │
│  • useMutation(transcribe.transcribe)               │
│                                                       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│             TranscribeButton Component               │
│                                                       │
│  Props:                                              │
│  • onTranscribed: (text) => void                    │
│  • onError?: (error) => void                        │
│  • language?: "fa" | "en"                           │
│  • engine?: "whisperx" | "whisper"                  │
│  • model?: string                                    │
│  • showControls?: boolean                           │
│  • onLanguageChange?: callback                      │
│  • onEngineChange?: callback                        │
│  • onModelChange?: callback                         │
│                                                       │
│  Uses:                                               │
│  • useTranscription()                               │
│  • useVoiceRecorder()                               │
│  • useQuery(transcribe.models)                      │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## File Organization

```
refactor-auth/
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── hooks/
│   │       │   └── use-transcription.ts      ← Hook for transcription
│   │       ├── routes/
│   │       │   └── transcribe.tsx            ← Full transcription page
│   │       ├── components/
│   │       │   └── transcribe-button.tsx     ← Reusable button component
│   │       └── utils/
│   │           └── audio.ts                  ← Audio utils (not used now)
│   │
│   └── server/
│       └── src/
│           ├── procedures/
│           │   └── transcribe.ts             ← ORPC procedures
│           ├── services/
│           │   └── ai-providers/
│           │       └── whisper.ts            ← Whisper API client
│           └── config.ts                     ← Configuration
│
├── docs/
│   ├── transcription-api.md                  ← API reference
│   ├── transcription-testing.md              ← Testing guide
│   └── transcription-architecture.md         ← This file
│
├── TRANSCRIPTION_REFACTOR_SUMMARY.md         ← Implementation summary
└── docker-compose.whisper.yml                ← Whisper API container
```

---

## State Management

### Web State Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Component State                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Local State (useState):                                     │
│  • engine                      → Controls Whisper engine     │
│  • model                       → Controls model selection    │
│  • language                    → Controls language           │
│  • result                      → Stores transcription result │
│  • transcribeError             → Stores error messages       │
│                                                               │
│  Recording State (useVoiceRecorder):                         │
│  • isRecording                 → Recording status            │
│  • elapsedMs                   → Recording duration          │
│  • recordedFile                → Captured audio file         │
│  • error                       → Recording errors            │
│                                                               │
│  Transcription State (useTranscription):                     │
│  • isPending                   → Transcription in progress   │
│                                                               │
│  Query State (useQuery):                                     │
│  • data: models[]              → Available models            │
│  • isLoading                   → Loading models              │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### State Transitions

```
IDLE
  │
  │ User clicks "Start Recording"
  ▼
RECORDING
  │ • isRecording = true
  │ • elapsedMs updates every 100ms
  │
  │ User clicks "Stop Recording"
  ▼
PROCESSING
  │ • recordedFile created
  │ • Automatic transcription triggered
  │
  │ useEffect detects recordedFile
  ▼
TRANSCRIBING
  │ • isPending = true
  │ • File sent to server
  │
  ├─ Success
  │  ▼
  │  COMPLETE
  │    • result = transcribed text
  │    • isPending = false
  │    • recordedFile cleared
  │
  └─ Error
     ▼
     ERROR
       • transcribeError = error message
       • isPending = false
       • recordedFile retained (for retry)
```

---

## Error Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Error Sources                            │
└─────────────────────────────────────────────────────────────┘
         │
         ├─ Recording Errors
         │  ├─ micAccessDenied         → "عدم دسترسی به میکروفون..."
         │  ├─ noAudioCaptured         → "هیچ صدایی ضبط نشد."
         │  ├─ fileTooLarge            → "فایل ضبط شده خیلی بزرگ است..."
         │  └─ processingFailed        → "پردازش فایل صوتی ناموفق بود."
         │
         └─ Transcription Errors
            ├─ Service Unavailable     → "سرویس تشخیص گفتار در دسترس نیست..."
            ├─ Network Error           → "سرویس تشخیص گفتار در دسترس نیست..."
            ├─ Timeout                 → "سرویس تشخیص گفتار در دسترس نیست..."
            ├─ 413 Too Large           → "فایل ضبط شده خیلی بزرگ است..."
            └─ Generic Error           → "تبدیل صوت به متن انجام نشد..."
```

---

## Configuration Flow

```
config.json
    ↓
config.ts (Server)
    ↓
Environment Variables Parsed:
    • WHISPER_SERVER_URL          → "http://127.0.0.1:8001"
    • WHISPER_TIMEOUT_MS          → 120000
    • WHISPER_MODELS              → "tiny" (CSV)
    • TRANSCRIBE_DEFAULT_ENGINE   → "whisperx"
    ↓
Exported Constants:
    • env.WHISPER_SERVER_URL
    • env.WHISPER_TIMEOUT_MS
    • whisperModelIds             → ["tiny"]
    • defaultWhisperModel         → "tiny"
    • defaultTranscribeEngine     → "whisperx"
    ↓
Used by:
    • whisper.ts service
    • transcribe.ts procedures
```

---

## Caching Strategy

### Model List Cache

```
┌────────────────────────────────────────┐
│      getWhisperModels() called         │
└────────────────┬───────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Cache exists? │
         └───────┬───────┘
                 │
        ┌────────┴────────┐
        │                 │
       YES               NO
        │                 │
        ▼                 ▼
   ┌─────────┐      ┌──────────┐
   │ Fresh?  │      │  Fetch   │
   │ <60s    │      │from API  │
   └────┬────┘      └────┬─────┘
        │                │
       YES               │
        │                │
        │           ┌────┴────┐
        │           │Success? │
        │           └────┬────┘
        │                │
        │         ┌──────┴──────┐
        │        YES            NO
        │         │              │
        │         ▼              ▼
        │    ┌────────┐    ┌─────────┐
        │    │ Cache  │    │Fallback │
        │    │& Return│    │ Static  │
        │    └───┬────┘    └────┬────┘
        │        │              │
        └────────┴──────────────┘
                 │
                 ▼
          Return models[]
```

### Cache Properties

- **TTL**: 60 seconds
- **Storage**: In-memory (`let _modelsCache`)
- **Invalidation**: Time-based only
- **Fallback**: Static list of 7 models

---

## Performance Characteristics

### Request Flow Timing

```
Recording (user-dependent)
    ↓ ~0ms
File Creation (instant)
    ↓ ~10-50ms
Network Upload (varies by size)
    ↓ ~100-500ms (for small files)
Server Processing (minimal)
    ↓ ~10-30ms
Whisper API (model-dependent)
    ↓ tiny:   ~500-2000ms
    ↓ base:   ~1000-3000ms
    ↓ small:  ~2000-5000ms
    ↓ medium: ~5000-10000ms
Network Download (instant, text only)
    ↓ ~10-50ms
UI Update (instant)
    ↓ ~5-10ms
Total: ~1-10 seconds (typical)
```

### File Sizes

```
Audio Format: webm/opus (typical)
    • 5 sec  recording: ~20-50 KB
    • 15 sec recording: ~60-150 KB
    • 30 sec recording: ~120-300 KB
    • 60 sec recording: ~240-600 KB

No WAV conversion means:
    • Smaller file sizes
    • Faster uploads
    • No client-side processing
```

---

## Security Considerations

### Current Implementation

- ✅ No sensitive data in client code
- ✅ Server validates input types
- ✅ Timeout prevents hanging requests
- ✅ Error messages don't leak internals
- ✅ No XSS (text is not rendered as HTML)

### Not Implemented (Future)

- ❌ Authentication/authorization
- ❌ Rate limiting
- ❌ File size limits (enforced by Whisper API only)
- ❌ Content type validation (relaxed for compatibility)

---

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Production Setup                       │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌────────────────┐                                      │
│  │  Web Browser   │                                      │
│  └────────┬───────┘                                      │
│           │                                              │
│           ▼                                              │
│  ┌────────────────┐                                      │
│  │  Web Server    │                                      │
│  │  (Bun/Static)  │                                      │
│  │  Port: 5173    │                                      │
│  └────────┬───────┘                                      │
│           │                                              │
│           ▼                                              │
│  ┌────────────────┐                                      │
│  │  API Server    │                                      │
│  │  (Bun/Hono)    │                                      │
│  │  Port: 3000    │                                      │
│  └────────┬───────┘                                      │
│           │                                              │
│           ▼                                              │
│  ┌────────────────┐                                      │
│  │  Whisper API   │                                      │
│  │  (Docker)      │                                      │
│  │  Port: 8001    │                                      │
│  └────────────────┘                                      │
│                                                           │
│  All running on same host or networked containers        │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## Comparison: Before vs After

### Before Refactor

```
Browser
  ↓
Capture webm/opus
  ↓
Convert to WAV 16kHz mono (AudioContext)
  ↓
Upload WAV file
  ↓
Server forwards to Whisper API
  ↓
Result

Issues:
• Client-side processing (slow)
• Larger file sizes (WAV is uncompressed)
• Complex code with error-prone conversion
• Browser compatibility concerns
```

### After Refactor

```
Browser
  ↓
Capture webm/opus
  ↓
Upload raw file (no conversion)
  ↓
Server forwards to Whisper API
  ↓
Result

Benefits:
✅ No client-side processing
✅ Smaller file sizes
✅ Simpler, more maintainable code
✅ Faster overall flow
```

---

## Extensibility Points

### Adding New Engines

1. Add to `SttEngine` type in `whisper.ts`
2. Add to enum in `transcribe.ts`
3. Add to UI selectors
4. Update Whisper API to handle new engine

### Adding New Languages

1. Update `language` enum in `transcribe.ts`
2. Add to language selector in UI
3. Add translations to `persian-texts.ts`
4. Ensure Whisper API supports the language

### Adding New Models

1. Add to `STATIC_MODELS` fallback list
2. Update `WHISPER_MODELS` in config.json
3. Ensure Whisper API has the model available

---

## Maintenance Checklist

- [ ] Monitor Whisper API uptime
- [ ] Check model cache hit rate
- [ ] Review error logs for patterns
- [ ] Test with different audio formats
- [ ] Update model list as new models are released
- [ ] Verify timeout settings are appropriate
- [ ] Check disk space for Docker volumes

---

Last updated: 2024
