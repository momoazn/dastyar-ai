# Persian AI Assistant

<p align="center">
  <strong>🤖 A modern AI assistant with Persian language support</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18+-blue?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Go-1.24+-00ADD8?logo=go" alt="Go">
  <img src="https://img.shields.io/badge/TypeScript-5.8+-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind-4.1+-06B6D4?logo=tailwindcss" alt="Tailwind">
</p>

A comprehensive AI-powered platform providing Persian language support with modern web technologies, featuring real-time chat capabilities, image generation, and translation services powered by local AI models.

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and **Bun** for frontend
- **Go 1.24+** for backend
- **Ollama** running on port 11434
- **Stable Diffusion** running on port 7860

### Installation & Running

```bash
# 1. Clone the repository
git clone <repository-url>
cd persian-ai-assistant

# 2. Install dependencies
make install

# 3. Start development servers
make dev
```

The application will be available at `http://localhost:8080`

### Build for Production

```bash
make build
./persian-ai-assistant  # Run the built binary
```

## ✨ Features

- 🤖 **AI Chat**: Local model integration with Ollama
- 🎨 **Image Generation**: Stable Diffusion powered image creation
- 🔄 **Translation**: Multi-language translation with tone control
- 🎤 **Voice Input**: Whisper-powered speech-to-text
- 🇮🇷 **Persian Support**: Full RTL and Persian language optimization
- 📱 **Responsive Design**: Modern UI with shadcn/ui components
- 🔒 **Privacy First**: All AI processing happens locally

## 🏗️ Project Status

- ✅ **Core Features**: Chat, Translation, Image Generation
- ✅ **Persian Language**: Full RTL support implemented
- ✅ **Local AI**: Ollama and Stable Diffusion integration
- 🚧 **Audio Features**: Whisper integration in progress
- 📋 **Planned**: User authentication, cloud deployment

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technical Architecture](#technical-architecture)
3. [Core Features](#core-features)
4. [Technology Stack](#technology-stack)
5. [Project Structure](#project-structure)
6. [Development Environment](#development-environment)
7. [API Documentation](#api-documentation)
8. [Development Workflow](#development-workflow)
9. [Build & Deployment](#build--deployment)
10. [Recent Development Activities](#recent-development-activities)

---

## Project Overview

### Project Identity

- **Name**: Persian AI Assistant
- **Type**: Modern Web Application
- **Primary Language**: Persian (Farsi)
- **Purpose**: Multilingual AI assistant with chat, image generation, and translation capabilities
- **Architecture**: Full-stack application with React frontend and Go backend

### Mission Statement

A comprehensive AI-powered platform providing Persian language support with modern web technologies, featuring real-time chat capabilities, image generation, and translation services powered by local AI models.

---

## Technical Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  External AI    │
│   (React/TS)    │◄──►│   (Go/Echo)     │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • UI Components │    │ • REST API      │    │ • Ollama Model  │
│ • State Mgmt    │    │ • Database      │    │ • Stable Diff.  │
│ • Routing       │    │ • Auth/Logging  │    │ • Whisper       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Frontend Architecture

```typescript
// Core Structure
src/
├── app.tsx           // Main application setup & routing
├── atoms.ts          // Global state management (Jotai)
├── pages/            // Route components
│   ├── home.tsx      // Dashboard/landing page
│   ├── chat.tsx      // Chat interface
│   ├── image.tsx     // Image generation interface
│   └── translation.tsx // Translation interface
├── components/       // Reusable UI components
│   ├── layouts/      // Layout components
│   ├── ui/           // Base UI components (shadcn/ui)
│   ├── app-sidebar.tsx // Navigation & context
│   ├── chat-input.tsx  // User input interface
│   ├── message.tsx     // Message display
│   └── settings-modal.tsx // Configuration interface
├── hooks/           // Custom React hooks
├── lib/             // Utilities & configurations
│   ├── api/         // API integration utilities
│   └── utils.ts     // Helper functions
└── services/        // External service integrations
    ├── ollama.ts    // Ollama model integration
    ├── stable-diffusion.ts // Image generation
    └── whisper.ts   // Speech-to-text
```

### Backend Architecture

```go
backend/
├── main.go          // Server entry point & initialization
├── handlers/        // HTTP request handlers
│   ├── server.go    // Server setup & middleware
│   ├── chat.go      // Chat endpoints
│   ├── translate.go // Translation endpoints
│   └── types.go     // Request/response types
├── db/              // Database operations
│   └── models.go    // Data models & schemas
├── utils/           // Helper functions
├── logger/          // Custom logging implementation
│   └── logger.go    // Structured logging with rotation
└── docs/            // API documentation
    ├── swagger.yaml // OpenAPI specification
    └── docs.go      // Generated documentation
```

---

## Core Features

### 1. Chat Interface

- **Local Model Integration**: Powered by Ollama for privacy and performance
- **Real-time Conversation**: Streaming responses with TypeScript support
- **Model Selection**: Dynamic model switching capability
- **Persistent History**: Chat threads stored locally with SQLite
- **RTL Support**: Full Persian language display support

### 2. Image Generation

- **Stable Diffusion Integration**: Local image generation
- **Text-to-Image**: Persian and English prompt support
- **Customization Options**:
  - Adjustable steps (1-150)
  - Guidance scale control
  - Negative prompts
  - Resolution options (512x512 to 1024x1024)
- **Progress Tracking**: Real-time generation progress

### 3. Translation Service

- **Multi-language Support**: Comprehensive language coverage
- **Translation Threads**: Organized translation history
- **Tone Control**: Formal, informal, and neutral tone options
- **AI Model Selection**: Choose from available models
- **Context Preservation**: Thread-based translation memory

### 4. Audio Features

- **Whisper Integration**: Local speech-to-text processing
- **Audio Recording**: Browser-based recording capabilities
- **Real-time Transcription**: Live audio processing
- **Multi-format Support**: Various audio input formats

---

## Technology Stack

### Frontend Technologies

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite 6.2+ with hot reloading
- **Package Manager**: Bun (modern, fast JavaScript runtime)
- **Styling**:
  - Tailwind CSS 4.1+ for utility-first styling
  - shadcn/ui for component library
  - Persian font support (Vazirmatn)
- **State Management**:
  - Jotai for atomic state management
  - TanStack Query for server state
- **Routing**: React Router DOM 7.4+
- **UI Components**: Radix UI primitives

### Backend Technologies

- **Language**: Go 1.24+ for performance and concurrency
- **Web Framework**: Echo 4.13+ for HTTP handling
- **Database**:
  - SQLite with GORM for local data persistence
  - Automatic migrations and schema management
- **Logging**:
  - Zerolog for structured logging
  - Lumberjack for log rotation
- **API Documentation**: Swagger/OpenAPI 3.0

### External Services & Dependencies

- **Model**: Ollama (local deployment) for privacy
- **Image Generation**: Stable Diffusion (local instance)
- **Speech Processing**: Whisper for transcription
- **Development Tools**:
  - Air for Go hot reloading
  - ESLint + Prettier for code quality
  - TypeScript for type safety

---

## Project Structure

### Database Schema

```sql
-- Chat Management
ChatThread {
  ID: uint (primary key)
  Title: string
  Messages: []Message (foreign key relationship)
  Model: string (AI model used)
  CreatedAt, UpdatedAt: time
}

Message {
  ID: uint (primary key)
  ChatThreadID: uint (foreign key)
  Content: string
  Role: string (user/assistant)
  Status: string
  Reasoning: string
  AIModel: string
  SentAt: time
}

-- Translation Management
TranslationThread {
  ID: uint (primary key)
  Title: string
  Translations: []Translation
  AIModel: string
  CreatedAt, UpdatedAt: time
}

Translation {
  ID: uint (primary key)
  ThreadID: uint (foreign key)
  SourceText, TranslatedText: string
  SourceLanguage, TargetLanguage: string
  Tone: string
  AIModel: string
  CreatedAt: time
}
```

### API Endpoints Structure

```yaml
# Chat Management
GET    /api/chat-threads          # List all chat threads
POST   /api/chat-threads          # Create new chat thread
GET    /api/chat-threads/:id      # Get specific thread
PUT    /api/chat-threads/:id      # Update thread
DELETE /api/chat-threads/:id      # Delete thread
GET    /api/chat-threads/:id/messages # Get thread messages
POST   /api/chat                  # Send chat message (streaming)

# Translation Management
GET    /api/translation-threads   # List translation threads
POST   /api/translation-threads   # Create translation thread
GET    /api/translation-threads/:id # Get specific thread
DELETE /api/translation-threads/:id # Delete thread
POST   /api/translate             # Perform translation

# Model Management
GET    /api/models                # List available AI models

# Image Generation
POST   /api/generate-image        # Generate image from prompt

# Audio Processing
POST   /api/transcribe            # Transcribe audio to text
```

---

## Development Environment

### Prerequisites

- **Node.js 18+** for frontend development
- **Go 1.24+** for backend development
- **Bun** for fast package management
- **Ollama** running locally on port 11434
- **Stable Diffusion** running locally on port 7860

### Environment Configuration

Create a `.env` file in the root directory:

```bash
# Backend Configuration
SERVER_ADDR=localhost:8080
OLLAMA_HOST=http://localhost:11434
DONT_OPEN_BROWSER=false

# Database
DB_PATH=chats.db

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### Development Setup

```bash
# 1. Install dependencies
make install

# 2. Start development servers
make dev

# 3. Individual commands
make dev-frontend  # Start React dev server
make dev-backend   # Start Go server with hot reload

# 4. Build for production
make build

# 5. Clean up
make clean
```

---

## API Documentation

### Request/Response Patterns

```typescript
// Standard Response Wrapper
interface Response<T> {
  data: T;
}

// Paginated Response
interface PaginatedResponse<T> {
  data: T[];
  has_next: boolean;
  has_previous: boolean;
  total: number;
  current_page: number;
  total_pages: number;
}

// Error Response
interface ErrorResponse {
  message: string;
}
```

### Chat API Example

```typescript
// Send Chat Message
POST /api/chat
{
  "thread_id": "string",
  "content": "string",
  "ai_model": "string"
}

// Streaming Response (Server-Sent Events)
data: {"content": "partial response...", "status": "generating"}
data: {"content": "complete response", "status": "completed"}
```

### Translation API Example

```typescript
// Translate Text
POST /api/translate
{
  "thread_id": "string",
  "source_text": "string",
  "source_language": "en",
  "target_language": "fa",
  "tone": "formal",
  "model": "model_name"
}
```

---

## Development Workflow

### Code Quality Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Enforced linting rules for consistency
- **Prettier**: Automated code formatting
- **Git Hooks**: Pre-commit validation

### State Management Patterns

```typescript
// Atomic State (Jotai)
export const currentChatThreadAtom = atom<ChatThread | null>(null);
export const messagesAtom = atom<Message[]>([]);

// Server State (TanStack Query)
export const useChatThreads = (options?: QueryOptions) => {
  return useQuery({
    queryKey: ["chatThreads"],
    queryFn: fetchChatThreads,
    ...options,
  });
};
```

### Error Handling

- **Frontend**: Error boundaries with graceful fallbacks
- **Backend**: Structured error responses with logging
- **Network**: Retry mechanisms for failed requests

---

## Build & Deployment

### Build Process

```bash
# Production Build
make build

# Output Structure
persian-ai-assistant/          # Executable binary
├── frontend/dist/            # Static frontend assets
└── logs/                     # Application logs
```

### Docker Support (Future)

```dockerfile
# Multi-stage build for optimal image size
FROM node:18-alpine AS frontend-builder
# ... frontend build steps

FROM golang:1.24-alpine AS backend-builder
# ... backend build steps

FROM alpine:latest
# ... final image assembly
```

### Configuration Management

- **Environment Variables**: `.env` file support
- **Build Flags**: Conditional compilation
- **Static Asset Embedding**: Go embed for SPA serving

---

## Recent Development Activities

### Navigation Improvements

- **Active Item Logic**: Fixed sidebar navigation to properly highlight active routes
- **URL Matching**: Implemented longest prefix matching for nested routes
- **Type Safety**: Added proper TypeScript types for navigation items

### Architecture Decisions

- **Local AI Models**: Emphasis on privacy with local Ollama deployment
- **SQLite Database**: Lightweight, embedded database for development simplicity
- **Streaming Responses**: Real-time chat experience with Server-Sent Events
- **RTL Support**: First-class Persian language support throughout the UI

### Performance Optimizations

- **Bun Runtime**: Fast JavaScript execution and package management
- **Vite Build Tool**: Lightning-fast development builds
- **Go Concurrency**: Efficient handling of concurrent requests
- **Asset Embedding**: Single binary deployment with embedded static files

### Security Considerations

- **Local Processing**: All AI operations happen locally for privacy
- **CORS Configuration**: Proper cross-origin request handling
- **Input Validation**: Server-side request validation
- **Error Sanitization**: Safe error message exposure

---

## Future Roadmap

### Planned Features

- **User Authentication**: Multi-user support with sessions
- **Cloud Deployment**: Docker containerization and cloud deployment guides
- **Plugin System**: Extensible AI model integration
- **Advanced UI**: Dark/light theme switching, accessibility improvements
- **Mobile App**: React Native mobile application
- **API Rate Limiting**: Production-ready API protection

### Technical Debt

- **Testing Suite**: Comprehensive unit and integration tests
- **Documentation**: Complete API documentation with examples
- **Monitoring**: Application metrics and health checks
- **Backup System**: Database backup and restore functionality

---

## Contributing Guidelines

### Development Process

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Follow code quality standards (ESLint, Prettier)
4. Write tests for new functionality
5. Update documentation as needed
6. Submit pull request with detailed description

### Code Style

- **Go**: Follow standard Go formatting (`gofmt`)
- **TypeScript**: Use provided ESLint configuration
- **Commits**: Follow conventional commit messages
- **Documentation**: Update relevant documentation for changes

### Getting Help

- Check existing issues and discussions
- Review API documentation and code examples
- Follow setup instructions carefully
- Ensure all prerequisites are properly installed

---

_This documentation is maintained as a living document and updated regularly to reflect the current state of the Persian AI Assistant project._
