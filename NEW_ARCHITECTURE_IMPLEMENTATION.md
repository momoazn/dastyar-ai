# New RAG Architecture Implementation

## Overview
Successfully implemented the new architecture where the Hono backend handles all streaming and PocketBase updates, while the frontend only listens to PocketBase subscriptions for real-time updates.

## Key Changes Made

### 1. Database Schema Update
- **PDFs Collection**: Changed from `message` field to `thread` field
- Updated `api/database.ts` to work with thread-based PDFs
- Added proper status handling with `MessagesStatusOptions` enum

### 2. Backend API Changes (`api/routes.ts`)

#### Ollama SDK Integration:
- **Updated**: Replaced raw `fetch()` calls with official Ollama JavaScript SDK
- **Benefits**: Better error handling, type safety, and cleaner streaming API
- **Implementation**: Uses `ollama.generate()` with `stream: true` for real-time responses
- **Streaming**: Simplified from manual JSON parsing to `for await (const part of response)`

#### PDF Upload Flow:
- Upload PDF → Process with RAG → Store in thread-based PDFs collection
- Creates Persian upload message: `فایل PDF "{filename}" آپلود شد.`
- Processes PDF for vector embeddings immediately upon upload

#### Chat Flow:
- User sends message → Creates user message in PocketBase
- Creates assistant message placeholder with "reasoning" status
- Checks thread for PDFs and enhances with RAG if present
- Streams from Ollama using SDK and updates PocketBase every 100ms
- Adds Persian source citations: `**منابع:** filename (بخش chunk)`
- Updates message status: `reasoning` → `streaming` → `finished`

### 3. Frontend Simplification

#### New `useSimplifiedChat` Hook:
- Removed all Ollama streaming logic from frontend
- Pure PocketBase subscription model
- Sends messages to `/api/chat` endpoint
- Real-time updates via PocketBase subscriptions
- Maintains PDF management functionality

#### Updated Components:
- `src/pages/chat.tsx` uses simplified hook
- Maintains all existing UI functionality
- Better error handling and loading states

### 4. PDF Management Updates

#### Updated `use-pdf-upload.ts`:
- Now uploads via Hono API `/api/pdf/upload`
- Works with thread-based schema
- Deletes via Hono API `/api/pdf/{id}`
- Proper error handling and progress tracking

## New Flow Architecture

### PDF Upload:
1. User attaches PDF → Upload to `/api/pdf/upload`
2. Backend processes PDF and stores in `pdfs` collection with `thread` field
3. Creates Persian upload message in PocketBase
4. Frontend receives real-time update via PocketBase subscription

### Chat Message:
1. User sends message → Frontend calls `/api/chat`
2. Backend creates user message in PocketBase
3. Backend creates assistant placeholder message
4. Backend checks for thread PDFs and enhances with RAG if present
5. Backend streams from Ollama using SDK and updates PocketBase every 100ms
6. Frontend receives real-time updates via PocketBase subscription
7. Final message includes source citations if RAG was used

## Technical Implementation Details

### Ollama SDK Integration:
```typescript
// Before: Raw fetch with manual JSON parsing
const response = await fetch("http://localhost:11434/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ model, prompt, stream: true }),
});

// After: Clean SDK usage
const ollama = new Ollama({ host: "http://localhost:11434" });
const response = await ollama.generate({
  model: body.model,
  prompt: finalMessage,
  stream: true,
});

for await (const part of response) {
  if (part.response) {
    // Handle streaming content
  }
  if (part.done) {
    // Handle completion
  }
}
```

### Backend Streaming:
- Uses Hono's `stream()` for real-time responses
- Updates PocketBase every 100ms for smooth UX
- Handles reasoning tokens with `<think>` tags
- Proper error states and recovery

### Frontend Subscriptions:
- Real-time message updates via PocketBase
- PDF attachment state management
- Loading and generation states
- Proper cleanup on component unmount

### Persian Language Support:
- Upload messages in Persian
- Source citations in Persian
- RTL layout maintained throughout
- Error messages in Persian

## Benefits of New Architecture

### Performance:
- Reduced frontend bundle size (removed complex streaming logic)
- Better real-time sync via PocketBase subscriptions
- Server-side RAG processing for better performance
- More reliable streaming with official SDK

### Maintainability:
- Single source of truth for streaming logic (backend)
- Simplified frontend chat hook
- Better separation of concerns
- Consistent Persian language support
- Type-safe Ollama integration

### User Experience:
- Real-time message updates
- Better loading states
- Proper error handling
- Seamless PDF integration with RAG

### Developer Experience:
- Official SDK with better documentation
- Type safety and IntelliSense support
- Cleaner async/await patterns
- Better error handling and debugging

## Migration Benefits

1. **Simplified Frontend**: Removed ~400+ lines of duplicate streaming code
2. **Better Performance**: Server-side RAG processing with SDK optimization
3. **Real-time Updates**: PocketBase subscriptions for instant UI updates
4. **Maintainability**: Single streaming implementation with official SDK
5. **Scalability**: Better architecture for future features
6. **Type Safety**: Full TypeScript support with Ollama SDK

The implementation maintains full backward compatibility while providing a much cleaner, more maintainable, and more reliable architecture. 