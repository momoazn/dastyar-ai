# Persian AI Assistant - Project Context

## Project Identity
- **Name**: Persian AI Assistant
- **Type**: Web Application
- **Primary Language**: Persian
- **Purpose**: Multilingual AI assistant with chat, image generation, and translation capabilities

## Core Features
1. **Chat Interface**
   - Powered by local LLM (Ollama)
   - Real-time conversation
   - Model selection capability
   - Persistent chat history

2. **Image Generation**
   - Powered by Stable Diffusion
   - Text-to-image generation
   - Image customization options

3. **Translation Service**
   - Multi-language support
   - Text translation capabilities
   - Integration with chat system

4. **Audio Features**
   - Whisper-powered transcription
   - Audio recording capabilities
   - Speech-to-text functionality

## Technical Architecture

### Frontend Architecture
```typescript
// Core Structure
src/
  ├── app.tsx           // Main application setup
  ├── atoms.ts          // Global state management
  ├── pages/            // Route components
  ├── components/       // UI components
  ├── hooks/           // Custom React hooks
  ├── lib/             // Utilities
  └── services/        // API integrations
```

### Key Frontend Components
1. **Pages**
   - `home.tsx`: Entry point and dashboard
   - `chat.tsx`: Chat interface
   - `image.tsx`: Image generation interface
   - `translation.tsx`: Translation interface

2. **Core Components**
   - `sidebar.tsx`: Navigation and context
   - `chat-input.tsx`: User input interface
   - `message.tsx`: Message display
   - `settings-modal.tsx`: Configuration interface

3. **State Management**
   - Uses atomic patterns
   - Global state with atoms.ts
   - Persistent storage integration

### Backend Architecture
```go
backend/
  ├── main.go          // Server entry point
  ├── handlers/        // HTTP request handlers
  ├── db/             // Database operations
  ├── utils/          // Helper functions
  └── logger/         // Custom logging
```

## Technology Stack

### Frontend Technologies
- **Framework**: React 18+
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Build Tool**: Vite
- **Package Manager**: Bun

### Backend Technologies
- **Language**: Go
- **Database**: Integrated persistence layer
- **Development**: Air (hot reloading)
- **Logging**: Custom implementation

### External Services
- **LLM**: Ollama (local deployment)
- **Image Generation**: Stable Diffusion
- **Speech Processing**: Whisper

## Development Workflow

### Tools and Configuration
- **IDE**: VSCode optimized
- **Code Quality**:
  - ESLint for linting
  - Prettier for formatting
- **Build Automation**: Makefile
- **Environment**: Configurable via .env

### Data Flow Pattern
1. User Input → Frontend Components
2. Frontend → Backend API Calls
3. Backend → External Service Integration
4. Data Persistence → Database Layer
5. Response → Frontend Update
6. State Management → UI Refresh

## Integration Points

### API Endpoints
- Chat communication endpoints
- Image generation endpoints
- Translation service endpoints
- Audio processing endpoints

### Service Communications
- Local LLM interaction protocol
- Image generation pipeline
- Translation processing flow
- Audio transcription workflow

## Best Practices

### Code Organization
- Modular component structure
- Clear separation of concerns
- Consistent file naming
- Type-safe implementations

### State Management
- Atomic state patterns
- Persistent storage handling
- Real-time updates
- Error boundary handling

### UI/UX Principles
- Responsive design
- Dark/light theme support
- Accessibility compliance
- Persian language optimization

## Development Guidelines

### Setup Requirements
1. Node.js environment
2. Go development setup
3. Local LLM configuration
4. Environment variables

### Running the Project
1. Frontend development server
2. Backend API server
3. Database connections
4. External service configurations

This context document is designed for LLM reference and provides structured information about the Persian AI Assistant project's architecture, features, and implementation details.
