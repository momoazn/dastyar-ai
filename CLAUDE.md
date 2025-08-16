# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Root Commands (Turborepo)
- `bun install` - Install dependencies for all workspaces
- `bun dev` - Start all applications in development mode (web on :3001, server on :3000)
- `bun build` - Build all applications
- `bun check-types` - Type check all applications
- `bun check` - Run Biome formatter and linter on all files

### Workspace-Specific Commands
- `bun dev:web` - Start only the web application (:3001)
- `bun dev:server` - Start only the server (:3000)
- `bun dev:whisper` - Start only the whisper service (:8000)
- `bun compile:server` - Build only the server

### Database Commands
- `bun db:push` - Push schema changes to database
- `bun db:studio` - Open Drizzle Studio UI
- `bun db:generate` - Generate migrations
- `bun db:migrate` - Run migrations
- `cd apps/server && bun db:local` - Start local SQLite database

## Project Architecture

This is a full-stack AI application built as a Turborepo monorepo with these key components:

### Frontend (`apps/web`)
- **React 19** with **TanStack Router** for file-based routing
- **TailwindCSS v4** for styling with **shadcn/ui** components
- **TanStack Query** for server state management
- **oRPC** client for type-safe API communication
- **AI SDK React** for streaming chat functionality

### Backend (`apps/server`)
- **Hono** web framework running on **Bun**
- **oRPC** for type-safe RPC procedures
- **Drizzle ORM** with **SQLite** database
- **AI SDK** with multiple provider support (OpenAI, Gemini, Groq, Ollama, LMStudio, OpenRouter)
- **Transcription proxy** - forwards requests to the Python whisper service

### Whisper Service (`apps/whisper`)
- **FastAPI** Python web service for audio transcription
- **OpenAI Whisper** and **Faster Whisper** engine support
- **GPU acceleration** with CUDA support when available
- **Multiple model sizes** (tiny, base, small, medium, large variants)
- **REST API** with file upload and transcription endpoints

### Core Features
1. **Chat Threads** - Persistent chat sessions with AI models
2. **Multi-Provider AI** - Support for various AI providers with fallback handling
3. **Translation Service** - Professional translation with tone control
4. **Audio Transcription** - Frontend → Server → Python Whisper Service flow
5. **Model Management** - Dynamic model discovery and synchronization

### Database Schema
- `models` - AI model metadata (provider, name, enabled status)
- `threads` - Chat thread sessions with archive support
- `messages` - Individual messages with status tracking (idle, streaming, finished, errored)
- `translations` - Translation jobs with source/target languages and tone

### API Architecture
The backend uses oRPC for type-safe procedures organized into namespaces:
- `models.*` - Model listing and synchronization
- `threads.*` - Thread CRUD operations
- `messages.*` - Message management and thread clearing
- `translations.*` - Translation service
- `transcribe.*` - Audio transcription

### Provider System
AI providers are abstracted through the AI SDK with configuration in `apps/server/src/lib/providers/`:
- Dynamic model discovery from local providers (Ollama, LMStudio)
- Fallback handling for different provider capabilities
- Structured output support with JSON fallback

### Transcription Architecture
The transcription flow uses a microservice architecture:
1. **Frontend** uploads audio files via oRPC to the main server
2. **Server** proxies the file and parameters to the Python whisper service
3. **Whisper Service** processes the audio and returns transcription results
4. **Server** returns the results back to the frontend
- Configurable via `WHISPER_SERVICE_URL` environment variable (defaults to `http://localhost:8000`)

## Code Quality

This project uses **Ultracite** (extends Biome) for strict TypeScript linting and formatting:
- Run `bun check` to format and lint all files
- Enforces accessibility standards, React best practices, and TypeScript safety
- Zero configuration required - rules are defined in `.cursor/rules/ultracite.mdc`
- Console usage is allowed (disabled `noConsole` rule in `biome.json`)

## Development Workflow

1. **Database Setup**: Run `cd apps/server && bun db:local` then `bun db:push`
2. **Install Dependencies**: `bun install`
3. **Start Development**: `bun dev` (starts both web and server)
4. **Type Checking**: Always run `bun check-types` before committing
5. **Formatting**: Run `bun check` to auto-format code

## Python Dependencies

The whisper service requires Python 3.13+ and uses **uv** for dependency management:
- Install Python dependencies: `cd apps/whisper && uv sync`
- Models are automatically downloaded to `apps/whisper/models/`
- Supports both CPU and GPU (CUDA) acceleration

## Important Notes

- The project uses **Bun** as the runtime and package manager for TypeScript/JavaScript
- **Python 3.13** with **uv** for the whisper service
- Frontend runs on port **3001**, backend on port **3000**, whisper service on port **8000**
- Database is SQLite with local development setup
- All API communication is type-safe through oRPC
- Chat functionality supports real-time streaming via AI SDK
- Provider selection affects available models and capabilities
- Whisper service provides both OpenAI Whisper and Faster Whisper engines