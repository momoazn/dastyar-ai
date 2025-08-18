# Transcribe Functionality Refactoring

## Identified Issues and Bugs

### 1. **Whisper Service Issues** (`apps/whisper/src/main.py`)
- **Missing Error Details**: Generic error messages without specific details
- **No File Size Validation**: Could accept extremely large files causing memory issues
- **Missing Audio Duration Limits**: No maximum duration enforcement
- **Language Code Validation**: Only checks length, not valid language codes
- **Model Loading Issues**: Models loaded synchronously blocking the event loop
- **Memory Management**: No cleanup of loaded models when switching between them
- **Missing Rate Limiting**: No protection against abuse

### 2. **Server Procedure Issues** (`apps/server/src/orpc/procedures.ts`)
- **Hardcoded Response Format**: Always sets `response_format` to "text", ignoring client preferences
- **Lost Segments Data**: Only returns text, discarding segments and metadata
- **Poor Error Handling**: Generic error messages without context
- **Missing Retry Logic**: No retry mechanism for transient failures
- **No File Validation**: Doesn't validate file type or size before forwarding

### 3. **Transcribe Page Issues** (`apps/web/src/routes/transcribe.tsx`)
- **State Management**: Multiple useState calls could be consolidated
- **Language Detection**: Hardcoded language toggle, no automatic detection
- **Model Selection**: No persistence of user's model preference
- **File Upload UX**: No drag-and-drop support
- **Progress Indication**: Visual progress bar doesn't reflect actual transcription progress
- **Result Display**: Limited formatting options for transcribed text

### 4. **Chat Integration Issues** (`apps/web/src/components/chat-input.tsx`)
- **Language Detection**: Basic RTL detection, may fail for mixed content
- **Model Selection**: Always uses 'base' for Persian, 'tiny' for English (inflexible)
- **Error Recovery**: No retry mechanism on transcription failure
- **Text Insertion**: Simply appends text, no smart cursor positioning
- **Voice Feedback**: Limited visual/audio feedback during recording

### 5. **Voice Recorder Hook Issues** (`apps/web/src/hooks/use-voice-recorder.ts`)
- **Browser Compatibility**: Limited fallback for unsupported formats
- **Audio Quality**: No bitrate or quality settings
- **Recording Limits**: No maximum duration enforcement
- **Error Recovery**: Limited error recovery mechanisms
- **Performance**: Timer updates every 250ms could impact performance

## Refactoring Plan

### Phase 1: Backend Improvements
1. Enhance Whisper service with better validation and error handling
2. Improve server procedures with proper type safety and response handling
3. Add file validation and size limits

### Phase 2: Frontend Utilities
1. Create shared transcribe utilities
2. Implement better language detection
3. Add audio processing utilities

### Phase 3: Component Refactoring
1. Refactor transcribe page with better UX
2. Enhance chat integration
3. Improve voice recorder hook

### Phase 4: Testing & Validation
1. Add comprehensive error handling
2. Implement testing
3. Add documentation
