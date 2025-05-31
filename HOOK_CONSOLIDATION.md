# Hook Consolidation: Unified Chat System

## Overview

We've successfully consolidated three similar hooks into a single, comprehensive `useUnifiedChat` hook that eliminates duplication and provides all chat functionality in one place.

## Consolidated Hooks

### ❌ **Deprecated Hooks** (can be removed)
- `use-chat-streaming.ts` - Basic streaming chat functionality
- `use-rag-streaming-chat.ts` - RAG-enabled streaming chat
- `use-rag-chat.ts` - RAG enhancement utilities (still used internally)

### ✅ **New Unified Hook**
- `use-unified-chat.ts` - Complete chat system with streaming, RAG, and PDF management

## Key Features of `useUnifiedChat`

### 🔄 **Core Chat Functionality**
- Real-time streaming with Ollama
- PocketBase integration with subscriptions
- Message persistence and synchronization
- Reasoning/thinking mode support
- Error handling and recovery

### 📄 **RAG Integration**
- PDF upload and management
- Document processing for vector search
- Context enhancement for messages
- Source attribution in responses
- Thread-based document organization

### 🎯 **Smart Features**
- Automatic RAG enhancement when documents are present
- Seamless fallback to regular chat when no documents
- Real-time document status tracking
- Progressive message updates during streaming

## Migration Guide

### Before (Multiple Hooks)
```typescript
// Old approach - multiple hooks
const {
  prompt,
  setPrompt,
  sendMessage,
  stopStreaming,
  isStreaming,
  messages,
} = useRAGStreamingChat(threadId);

const { uploadPDF, deletePDF, isUploading } = usePDFUpload();
const { enhanceMessageWithRAG } = useRAGChat();
```

### After (Unified Hook)
```typescript
// New approach - single hook
const {
  // Core chat functionality
  prompt,
  setPrompt,
  sendMessage,
  stopStreaming,
  isStreaming,
  messages,
  
  // RAG functionality
  attachedPDFs,
  handleFileSelect,
  handleRemovePDF,
  isUploading,
  uploadProgress,
  hasRAGDocuments,
  
  // Utilities
  refetchMessages,
} = useUnifiedChat(threadId);
```

## Implementation Details

### 🏗 **Architecture**
- **Single Source of Truth**: All chat state managed in one place
- **Modular Design**: Internal use of specialized hooks (`usePDFUpload`, `useRAGChat`)
- **Type Safety**: Comprehensive TypeScript types with `ExtendedMessage`
- **Performance**: Optimized with proper memoization and effect dependencies

### 🔧 **Internal Structure**
```typescript
// State Management
- Core chat state (prompt, streaming, messages)
- RAG state (PDFs, documents status)
- Streaming control (abort controllers, intervals)

// Effects
- PocketBase subscriptions for real-time updates
- PDF management lifecycle
- Document status tracking

// Handlers
- Message sending with RAG enhancement
- PDF upload/removal with vector store updates
- Streaming with periodic database updates
```

### 📊 **Data Flow**
1. **Message Input**: User types message
2. **RAG Check**: If documents exist, enhance message with context
3. **Streaming**: Send enhanced message to Ollama
4. **Real-time Updates**: Stream response with periodic database updates
5. **Source Attribution**: Include document sources in final message

## Benefits

### 🚀 **Performance**
- Reduced bundle size (eliminated duplicate code)
- Better memory management (single hook instance)
- Optimized re-renders (consolidated state updates)

### 🛠 **Maintainability**
- Single point of maintenance for chat functionality
- Consistent API across all chat features
- Easier testing and debugging

### 👥 **Developer Experience**
- Simplified imports and usage
- Better TypeScript support
- Comprehensive feature set in one hook

## Usage Examples

### Basic Chat
```typescript
const { prompt, setPrompt, sendMessage, messages } = useUnifiedChat(threadId);
```

### Chat with PDF Support
```typescript
const {
  prompt,
  setPrompt,
  sendMessage,
  messages,
  attachedPDFs,
  handleFileSelect,
  hasRAGDocuments,
} = useUnifiedChat(threadId);
```

### Complete Integration
```typescript
// In your component
const chatHook = useUnifiedChat(threadId);

return (
  <ChatInput
    prompt={chatHook.prompt}
    setPrompt={chatHook.setPrompt}
    handleSendPrompt={() => chatHook.sendMessage(model, threadId)}
    isStreaming={chatHook.isStreaming}
    stopStreaming={chatHook.stopStreaming}
    // RAG props
    attachedPDFs={chatHook.attachedPDFs}
    onFileSelect={chatHook.handleFileSelect}
    onRemovePDF={chatHook.handleRemovePDF}
    isUploading={chatHook.isUploading}
    hasRAGDocuments={chatHook.hasRAGDocuments}
  />
);
```

## Next Steps

1. **✅ Update Components**: Chat page already updated to use `useUnifiedChat`
2. **🧹 Cleanup**: Remove deprecated hook files after testing
3. **📝 Documentation**: Update component documentation
4. **🧪 Testing**: Verify all functionality works as expected

## File Changes Made

### Updated Files
- ✅ `src/hooks/use-unified-chat.ts` - New unified hook
- ✅ `src/hooks/index.ts` - Added export
- ✅ `src/pages/chat.tsx` - Updated to use unified hook
- ✅ `src/components/assistant-message.tsx` - Enhanced for RAG sources

### Files to Remove (after testing)
- 🗑️ `src/hooks/use-rag-streaming-chat.ts`
- 🗑️ `src/hooks/use-chat-streaming.ts` (if not used elsewhere)

### Files to Keep
- ✅ `src/hooks/use-rag-chat.ts` - Used internally by unified hook
- ✅ `src/hooks/use-pdf-upload.ts` - Used internally by unified hook

This consolidation significantly improves the codebase by eliminating duplication while maintaining all functionality in a more organized and maintainable structure. 