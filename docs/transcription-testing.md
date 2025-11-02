# Transcription Testing Checklist

This document provides a comprehensive testing guide for the refactored transcription feature.

## Prerequisites

### 1. Environment Setup

- [ ] Bun runtime installed
- [ ] Docker and Docker Compose installed
- [ ] Web app dependencies installed (`bun install` in root)
- [ ] Server app dependencies installed

### 2. Services Running

```bash
# Start Whisper API (required)
docker-compose -f docker-compose.whisper.yml up -d

# Verify Whisper API is running
curl http://127.0.0.1:8001/models

# Start the server
cd apps/server
bun run dev

# Start the web app
cd apps/web
bun run dev
```

---

## Functional Testing

### Basic Transcription Flow

#### Test 1: Record and Transcribe (Persian)
- [ ] Navigate to `/transcribe` page
- [ ] Verify default selections:
  - Engine: `whisperx`
  - Model: `tiny`
  - Language: `fa` (Persian)
- [ ] Click "شروع ضبط" (Start Recording)
- [ ] Verify red recording indicator appears
- [ ] Speak in Persian for 5-10 seconds
- [ ] Click "پایان ضبط" (Stop Recording)
- [ ] Wait for transcription to complete
- [ ] Verify Persian text appears in the result textarea
- [ ] Verify text is right-to-left aligned

#### Test 2: Record and Transcribe (English)
- [ ] Select `en` (English) from language dropdown
- [ ] Record audio in English for 5-10 seconds
- [ ] Verify English text appears correctly
- [ ] Verify text is left-to-right aligned

#### Test 3: Engine Selection
- [ ] Change engine from `whisperx` to `whisper`
- [ ] Record and transcribe audio
- [ ] Verify transcription completes successfully
- [ ] Change back to `whisperx`
- [ ] Verify transcription still works

#### Test 4: Model Selection
- [ ] Verify model dropdown populates with available models
- [ ] Try different models: `tiny`, `base`, `small` (if available)
- [ ] Verify each model processes audio successfully
- [ ] Note: larger models take longer but may be more accurate

### UI Controls and State

#### Test 5: Recording Controls
- [ ] Verify recording button shows microphone icon initially
- [ ] Click start recording
- [ ] Verify button changes to red with square icon
- [ ] Verify elapsed time counter updates
- [ ] Verify progress bar advances
- [ ] Stop recording
- [ ] Verify button returns to normal state

#### Test 6: Status Indicators
- [ ] Idle state shows "بیکار" badge
- [ ] Recording shows "در حال ضبط • [time]" badge with red color
- [ ] Transcribing shows "در حال تبدیل..." badge with loading spinner
- [ ] Verify badge updates in real-time

#### Test 7: Result Actions
- [ ] Record and transcribe audio
- [ ] Click "کپی" (Copy) button
- [ ] Verify text is copied to clipboard (paste elsewhere to confirm)
- [ ] Click "پاک کردن" (Clear) button
- [ ] Verify result textarea clears
- [ ] Record again
- [ ] Verify old result is replaced with new one

#### Test 8: Retry Functionality
- [ ] Record and transcribe audio
- [ ] Verify retry button appears after transcription completes
- [ ] Click retry button (refresh icon)
- [ ] Verify same audio is re-transcribed without re-recording
- [ ] Verify result updates

### Error Handling

#### Test 9: Whisper API Unavailable
- [ ] Stop Whisper API: `docker-compose -f docker-compose.whisper.yml down`
- [ ] Try to transcribe audio
- [ ] Verify error message appears:
  - "سرویس تشخیص گفتار در دسترس نیست. لطفاً Whisper Server را اجرا کنید."
- [ ] Restart Whisper API
- [ ] Retry transcription
- [ ] Verify it works after restart

#### Test 10: Model Fallback
- [ ] Stop Whisper API
- [ ] Reload the page
- [ ] Verify model dropdown shows fallback static list:
  - Tiny, Base, Small, Medium, Large, Large V2, Large V3
- [ ] Restart Whisper API
- [ ] Reload page
- [ ] Verify models load from API

#### Test 11: Microphone Access Denied
- [ ] Deny microphone permissions in browser
- [ ] Try to start recording
- [ ] Verify error message:
  - "عدم دسترسی به میکروفون یا عدم پشتیبانی مرورگر."
- [ ] Grant permissions and try again

#### Test 12: No Audio Captured
- [ ] Start recording
- [ ] Immediately stop recording without speaking
- [ ] Verify appropriate error handling
- [ ] System should either:
  - Skip transcription, or
  - Show "هیچ صدایی ضبط نشد." error

#### Test 13: Long Recording
- [ ] Record audio for more than 60 seconds
- [ ] Verify progress bar maxes out at 100%
- [ ] Stop recording
- [ ] Attempt transcription
- [ ] Note: May succeed or fail depending on file size limits

### TranscribeButton Component

#### Test 14: Basic Button Usage
- [ ] Navigate to chat or another page using TranscribeButton
- [ ] Verify button renders with microphone icon
- [ ] Click button to start recording
- [ ] Verify button shows red square icon
- [ ] Stop recording
- [ ] Verify transcription completes
- [ ] Verify transcribed text appears in the input field

#### Test 15: Button with Controls
- [ ] Find a TranscribeButton with `showControls={true}`
- [ ] Verify language toggle appears
- [ ] Verify engine selector appears (if enabled)
- [ ] Verify model selector appears
- [ ] Test changing each control
- [ ] Verify transcription uses selected settings

---

## Integration Testing

### Test 16: Chat Integration
- [ ] Navigate to chat page
- [ ] Locate transcribe button in message input
- [ ] Record a voice message
- [ ] Verify transcribed text populates the input field
- [ ] Send the message
- [ ] Verify message is sent correctly

### Test 17: Multiple Transcriptions
- [ ] Perform 3-5 transcriptions in a row
- [ ] Verify each one completes successfully
- [ ] Verify no memory leaks or slowdowns
- [ ] Verify results don't get mixed up

### Test 18: Language Switching
- [ ] Transcribe in Persian
- [ ] Switch to English
- [ ] Transcribe in English
- [ ] Switch back to Persian
- [ ] Verify each transcription respects the selected language

---

## Performance Testing

### Test 19: Different Audio Lengths
- [ ] Short (5 seconds): _____ seconds to transcribe
- [ ] Medium (15 seconds): _____ seconds to transcribe
- [ ] Long (30 seconds): _____ seconds to transcribe
- [ ] Very long (60 seconds): _____ seconds to transcribe

### Test 20: Different Models
- [ ] Tiny model: _____ seconds to transcribe
- [ ] Base model: _____ seconds to transcribe
- [ ] Small model: _____ seconds to transcribe
- Note: Record processing times for comparison

### Test 21: Concurrent Transcriptions
- [ ] Open two browser tabs
- [ ] Start transcription in both simultaneously
- [ ] Verify both complete successfully
- [ ] Verify no errors or conflicts

---

## Browser Compatibility

### Test 22: Chrome/Edge
- [ ] All basic tests pass
- [ ] Audio format: _____________
- [ ] Notes: _____________

### Test 23: Firefox
- [ ] All basic tests pass
- [ ] Audio format: _____________
- [ ] Notes: _____________

### Test 24: Safari (macOS/iOS)
- [ ] All basic tests pass
- [ ] Audio format: _____________
- [ ] Notes: _____________
- Note: Plan explicitly states no special Safari handling required

---

## API Testing

### Test 25: Direct API - Get Models
```bash
# Test getting models
curl http://localhost:3000/rpc/transcribe.models

# Expected response:
# [{"id":"tiny","name":"Tiny"}, ...]
```
- [ ] Returns array of models
- [ ] Each model has `id` and `name`
- [ ] Response time: _____ ms

### Test 26: Direct API - Transcribe
```bash
# Test transcription with curl
curl -X POST http://localhost:3000/rpc/transcribe.transcribe \
  -F "file=@test-audio.webm" \
  -F "engine=whisperx" \
  -F "model=tiny" \
  -F "language=fa"
```
- [ ] Returns transcribed text
- [ ] Handles various audio formats
- [ ] Response time: _____ ms

### Test 27: Whisper API Direct
```bash
# Test Whisper API directly
curl http://127.0.0.1:8001/models

curl -X POST http://127.0.0.1:8001/transcribe \
  -F "file=@test-audio.webm" \
  -F "engine=whisperx" \
  -F "model=tiny" \
  -F "language=fa"
```
- [ ] Models endpoint returns data
- [ ] Transcribe endpoint accepts files
- [ ] Returns JSON with `text` field

---

## Edge Cases

### Test 28: Empty/Invalid File
- [ ] Attempt to send empty file
- [ ] Verify appropriate error handling
- [ ] System should reject gracefully

### Test 29: Unsupported Audio Format
- [ ] Try uploading an image file (if upload is enabled)
- [ ] Verify rejection or appropriate error

### Test 30: Network Interruption
- [ ] Start transcription
- [ ] Disable network mid-transcription (if possible)
- [ ] Verify timeout error appears
- [ ] Re-enable network
- [ ] Verify retry works

### Test 31: Rapid Start/Stop
- [ ] Start recording
- [ ] Immediately stop
- [ ] Start again
- [ ] Immediately stop
- [ ] Repeat 5 times quickly
- [ ] Verify no crashes or stuck states

### Test 32: Very Quiet Audio
- [ ] Record audio in a very quiet environment
- [ ] Or speak very softly
- [ ] Attempt transcription
- [ ] Note: May return empty or minimal text

### Test 33: Background Noise
- [ ] Record with significant background noise
- [ ] Verify transcription still attempts to process
- [ ] Note accuracy for reference

---

## Configuration Testing

### Test 34: Custom Config
Edit `config.json`:
```json
{
  "WHISPER_SERVER_URL": "http://127.0.0.1:8001",
  "WHISPER_TIMEOUT_MS": 30000,
  "WHISPER_MODELS": "base,small,medium",
  "TRANSCRIBE_DEFAULT_ENGINE": "whisper"
}
```
- [ ] Restart server
- [ ] Verify timeout increased to 30s
- [ ] Verify model list shows base, small, medium
- [ ] Verify default engine is whisper (not whisperx)

### Test 35: Invalid Config
- [ ] Set invalid `WHISPER_SERVER_URL`
- [ ] Verify server handles gracefully
- [ ] Verify fallback to static model list
- [ ] Verify clear error messages

---

## Accessibility Testing

### Test 36: Keyboard Navigation
- [ ] Tab through all controls
- [ ] Verify focus indicators are visible
- [ ] Activate record button with Enter/Space
- [ ] Navigate dropdowns with arrow keys
- [ ] Verify all controls are reachable

### Test 37: Screen Reader
- [ ] Test with NVDA/JAWS/VoiceOver
- [ ] Verify labels are announced
- [ ] Verify status changes are announced (aria-live)
- [ ] Verify error messages are announced

### Test 38: RTL Layout
- [ ] Verify Persian UI elements are RTL
- [ ] Verify English UI elements are LTR
- [ ] Verify no layout breaks
- [ ] Verify controls align correctly

---

## Regression Testing

### Test 39: Audio Utils Not Used
- [ ] Verify `fileToWav16kMono` is not called
- [ ] Verify raw webm/opus files are sent
- [ ] Check network tab: file should be webm/opus, not WAV
- [ ] Verify transcription still works without conversion

### Test 40: Old Code Removed
- [ ] Search codebase for removed patterns:
  - `fileToWav16kMono` usage in transcription flow
  - `Xenova/whisper-tiny` hardcoded strings
  - Pretty-name regex patterns in whisper.ts
- [ ] Verify these are not present

---

## Documentation Verification

### Test 41: API Documentation
- [ ] Review `docs/transcription-api.md`
- [ ] Verify all examples work
- [ ] Verify error messages match documentation

### Test 42: Implementation Summary
- [ ] Review `TRANSCRIPTION_REFACTOR_SUMMARY.md`
- [ ] Verify all listed changes are present
- [ ] Verify acceptance criteria are met

---

## Sign-Off

### Developer Testing
- Tester: _______________
- Date: _______________
- Environment: _______________
- Overall Status: ⬜ Pass ⬜ Fail ⬜ Needs Work

### Issues Found
1. _______________________________________
2. _______________________________________
3. _______________________________________

### Notes
_________________________________________________
_________________________________________________
_________________________________________________

---

## Known Limitations (By Design)

These are intentionally out of scope and should NOT be tested:

- ❌ Cancel in-flight requests
- ❌ Max duration enforcement
- ❌ Silence trimming/VAD
- ❌ Timestamped segments
- ❌ Streaming transcription
- ❌ Telemetry and rate-limiting
- ❌ Authentication/authorization for transcription
- ❌ Special Safari handling

---

## Quick Test Script

For rapid smoke testing:

```bash
#!/bin/bash
# quick-test.sh

echo "1. Starting Whisper API..."
docker-compose -f docker-compose.whisper.yml up -d
sleep 5

echo "2. Checking Whisper API..."
curl -s http://127.0.0.1:8001/models | jq .

echo "3. Test complete. Manual browser testing required."
echo "   Navigate to http://localhost:5173/transcribe"
```

Save as `quick-test.sh`, make executable with `chmod +x quick-test.sh`, and run.
