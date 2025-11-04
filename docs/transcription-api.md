# Transcription API Reference

## Overview

The transcription API provides speech-to-text conversion using either WhisperX or Whisper engines. Audio files are recorded in the browser and sent directly to the server without client-side conversion.

## API Endpoints

### 1. Get Available Models

Retrieves the list of available transcription models for a specific engine.

**ORPC Procedure:** `transcribe.models`

**Input:**
```typescript
{
  engine?: "whisperx" | "whisper"  // Optional, defaults to "whisperx"
}
```

**Output:**
```typescript
Array<{
  id: string;    // Model identifier (e.g., "tiny", "base", "small")
  name: string;  // Human-readable model name
}>
```

**Example Request:**
```typescript
const models = await orpc.transcribe.models({ input: { engine: "whisperx" } });
```

**Example Response:**
```typescript
[
  { id: "tiny", name: "Tiny" },
  { id: "base", name: "Base" },
  { id: "small", name: "Small" },
  { id: "medium", name: "Medium" },
  { id: "large", name: "Large" },
  { id: "large-v2", name: "Large V2" },
  { id: "large-v3", name: "Large V3" }
]
```

**Fallback Behavior:**
- If Whisper API is unavailable, returns a static fallback list
- Models are cached for 60 seconds to reduce API calls

---

### 2. Transcribe Audio

Transcribes an audio file to text using the specified engine, model, and language.

**ORPC Procedure:** `transcribe.transcribe`

**Input:**
```typescript
{
  file: Blob & { name: string };         // Audio file (typically webm/opus from MediaRecorder)
  engine?: "whisperx" | "whisper";      // Optional, defaults to "whisperx"
  model?: string;                        // Optional, defaults to "tiny"
  language?: "fa" | "en";               // Optional, defaults to "fa"
}
```

**Output:**
```typescript
string  // Transcribed text
```

**Example Request:**
```typescript
const text = await orpc.transcribe.transcribe({
  file: recordedAudioFile,
  engine: "whisperx",
  model: "tiny",
  language: "fa"
});
```

**Example Response:**
```typescript
"سلام، این یک متن نمونه است."
```

---

## Whisper API (FastAPI Backend)

The server forwards requests to the Whisper API running on Docker.

### POST /transcribe

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Fields:
  - `file`: Audio file
  - `engine`: "whisperx" or "whisper"
  - `model`: Model ID (e.g., "tiny")
  - `language`: ISO 639-1 code (e.g., "fa", "en")

**Response:**
```json
{
  "text": "Transcribed text here"
}
```

### GET /models

**Request:**
- Method: `GET`

**Response:**
```json
[
  { "id": "tiny", "name": "Tiny" },
  { "id": "base", "name": "Base" }
]
```

---

## Error Handling

### Client Errors

The client displays localized error messages in Persian:

1. **Service Unavailable**
   - Trigger: Whisper API is not running or unreachable
   - Message: "سرویس تشخیص گفتار در دسترس نیست. لطفاً Whisper Server را اجرا کنید."

2. **File Too Large**
   - Trigger: HTTP 413 or file size exceeds limit
   - Message: "فایل ضبط شده خیلی بزرگ است. لطفاً صدای کوتاه‌تری ضبط کنید."

3. **Transcription Failed**
   - Trigger: Generic server error
   - Message: "تبدیل صوت به متن انجام نشد. لطفاً دوباره تلاش کنید."

4. **Microphone Access Denied**
   - Message: "عدم دسترسی به میکروفون یا عدم پشتیبانی مرورگر."

5. **No Audio Captured**
   - Message: "هیچ صدایی ضبط نشد."

### Server Error Mapping

The server maps various error conditions to user-friendly messages:

```typescript
// Network/timeout errors
if (message.includes("fetch") || message.includes("abort")) {
  return "Service unavailable message";
}

// Payload too large
if (message.includes("413") || message.includes("too large")) {
  return "File too large message";
}

// Generic fallback
return "Transcription failed message";
```

---

## Configuration

### Server Config (`config.json`)

```json
{
  "WHISPER_SERVER_URL": "http://127.0.0.1:8001",
  "WHISPER_TIMEOUT_MS": 120000,
  "WHISPER_MODELS": "tiny,base,small",
  "TRANSCRIBE_DEFAULT_ENGINE": "whisperx"
}
```

### Environment Variables

- `WHISPER_SERVER_URL`: URL of the Whisper API service (default: `http://127.0.0.1:8001`)
- `WHISPER_TIMEOUT_MS`: Request timeout in milliseconds (default: `120000`)
- `WHISPER_MODELS`: Comma-separated list of model IDs (default: `"tiny"`)
- `TRANSCRIBE_DEFAULT_ENGINE`: Default engine to use (default: `"whisperx"`)

---

## Usage Examples

### React Hook Usage

```typescript
import { useTranscription } from "@/hooks/use-transcription";

function MyComponent() {
  const { transcribe, isPending } = useTranscription({
    onSuccess: (text) => {
      console.log("Transcription:", text);
    },
    onError: (error) => {
      console.error("Error:", error);
    }
  });

  const handleTranscribe = (audioFile: File) => {
    transcribe({
      file: audioFile,
      engine: "whisperx",
      model: "tiny",
      language: "fa"
    });
  };

  return (
    <button onClick={() => handleTranscribe(myAudioFile)} disabled={isPending}>
      {isPending ? "Transcribing..." : "Transcribe"}
    </button>
  );
}
```

### TranscribeButton Component

```typescript
import { TranscribeButton } from "@/components/transcribe-button";

function ChatInput() {
  const [language, setLanguage] = useState<"fa" | "en">("fa");
  const [engine, setEngine] = useState<"whisperx" | "whisper">("whisperx");
  const [model, setModel] = useState("tiny");

  return (
    <TranscribeButton
      onTranscribed={(text) => console.log(text)}
      onError={(error) => console.error(error)}
      language={language}
      engine={engine}
      model={model}
      showControls={true}
      onLanguageChange={setLanguage}
      onEngineChange={setEngine}
      onModelChange={setModel}
    />
  );
}
```

### Direct Query Usage

```typescript
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

function ModelSelector() {
  const [engine, setEngine] = useState<"whisperx" | "whisper">("whisperx");

  const { data: models, isLoading } = useQuery(
    orpc.transcribe.models.queryOptions({ input: { engine } })
  );

  if (isLoading) return <div>Loading models...</div>;

  return (
    <select>
      {models?.map(m => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </select>
  );
}
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Browser MediaRecorder                                    │
│    - Captures audio (typically webm/opus)                   │
│    - No client-side conversion                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Web App (React)                                          │
│    - useTranscription hook                                  │
│    - Sends: file, engine, model, language                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Server (Bun/Hono ORPC)                                   │
│    - Validates input                                        │
│    - Converts Blob to File                                  │
│    - Forwards as multipart/form-data                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Whisper API (FastAPI in Docker)                         │
│    - Processes audio with selected engine/model            │
│    - Returns JSON: { "text": "..." }                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Response Chain (Server → Web)                           │
│    - Server maps errors to localized messages              │
│    - Web displays result or error                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Model Information

### Available Models

| Model ID   | Name      | Size  | Speed    | Accuracy |
|------------|-----------|-------|----------|----------|
| tiny       | Tiny      | ~39MB | Fastest  | Basic    |
| base       | Base      | ~74MB | Fast     | Good     |
| small      | Small     | ~244MB| Medium   | Better   |
| medium     | Medium    | ~769MB| Slow     | Great    |
| large      | Large     | ~1.5GB| Slower   | Best     |
| large-v2   | Large V2  | ~1.5GB| Slower   | Best     |
| large-v3   | Large V3  | ~1.5GB| Slower   | Best     |

### Engine Comparison

**WhisperX:**
- More accurate with timestamps
- Better for longer audio
- Includes word-level alignment
- Default engine

**Whisper:**
- Faster for short clips
- Simpler output
- Less memory usage

---

## Best Practices

1. **Model Selection**
   - Use `tiny` for quick demos and testing
   - Use `base` or `small` for production with good balance
   - Use `medium` or `large` for high accuracy requirements

2. **Language Detection**
   - Always specify language if known (improves accuracy)
   - Supports `fa` (Persian) and `en` (English) by default

3. **Error Handling**
   - Always provide `onError` callback
   - Display user-friendly messages
   - Allow users to retry failed transcriptions

4. **Performance**
   - Keep recordings under 60 seconds when possible
   - Use smaller models for real-time feedback
   - Consider file size limits (server may enforce max size)

5. **Caching**
   - Models list is cached for 60 seconds
   - Reduces load on Whisper API
   - Falls back to static list if API unavailable

---

## Troubleshooting

### Whisper API Not Running

**Symptom:** "سرویس تشخیص گفتار در دسترس نیست"

**Solution:**
```bash
docker-compose -f docker-compose.whisper.yml up -d
```

### Wrong Audio Format

**Symptom:** Transcription fails immediately

**Solution:**
- Browser MediaRecorder typically produces webm/opus
- Whisper API should handle this automatically
- Check Whisper API logs for format issues

### Model Not Found

**Symptom:** Model dropdown is empty or shows fallback list

**Solution:**
1. Verify Whisper API is running
2. Check `GET http://127.0.0.1:8001/models` returns data
3. Update `WHISPER_MODELS` in config.json

### Timeout Errors

**Symptom:** Requests fail after 20 seconds

**Solution:**
- Increase `WHISPER_TIMEOUT_MS` in config.json
- Use smaller audio files
- Use faster model (tiny/base)

---

## Version History

- **v1.0.0** - Initial simplified implementation
  - Engine selection (WhisperX/Whisper)
  - Direct file upload without conversion
  - Static model fallback
  - Localized error messages

---

Last updated: 2024
