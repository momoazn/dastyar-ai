# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Dastyar AI** is a full-stack AI-powered application that provides multiple AI services including chat, image generation, audio transcription, translation, and text summarization. The project is built as a monorepo with separate server and web applications.

## Architecture

- **Monorepo Structure**: Uses Turbo for build orchestration and Bun as package manager
- **Server (Backend)**: Bun + Hono + SQLite + Drizzle ORM
- **Web (Frontend)**: React + Vite + TanStack Router + Tailwind CSS
- **Communication**: oRPC for type-safe API communication
- **Database**: SQLite with Drizzle ORM for schema management

## Tech Stack

### Backend (`apps/server`)
- **Runtime**: Bun
- **Framework**: Hono
- **Database**: SQLite with Better SQLite3 driver
- **ORM**: Drizzle ORM
- **AI Integrations**: OpenAI-compatible APIs, Google AI, Groq, OpenRouter
- **Audio Processing**: Hugging Face Transformers (Whisper models)
- **Image Generation**: Stable Diffusion integration

### Frontend (`apps/web`)
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: TanStack Router
- **Styling**: Tailwind CSS v4 + Radix UI components
- **State Management**: TanStack Query
- **Theming**: next-themes for dark/light mode

## Key Commands

### Development
```bash
bun run dev              # Start both server and web in development
bun run dev:web          # Start web app only (port 3001)
bun run dev:server       # Start server only (port 3000)
```

### Building
```bash
bun run build           # Build both applications to dist/
bun run build:web       # Build web application only to dist/web/
bun run build:server    # Build server application only
```

### Production Deployment
```bash
bun run compile         # Compile server to standalone binary at dist/dastyar-ai
bun run prepare-offline # Download Whisper models and WASM files for offline use
```

### Code Quality
```bash
bun run check           # Run Biome formatter and linter
bun run check-types     # Run TypeScript type checking
```

### Database Management
```bash
bun run db:push         # Push schema changes to database
bun run db:studio       # Open Drizzle Studio
bun run db:generate     # Generate migration files
bun run db:migrate      # Run migrations
```

## Application Features

### Core Services
- **Chat**: Multi-model AI chat with thread management (supports OpenAI, Google, Groq, OpenRouter)
- **Image Generation**: AI image creation with customizable parameters
- **Audio Transcription**: Whisper-based audio-to-text conversion
- **Translation**: Multi-language translation with tone control
- **Summarization**: Text summarization with different modes (concise/standard/detailed)

### Data Models
- **Models**: AI model configurations with provider metadata
- **Threads**: Chat conversation management
- **Messages**: Individual chat messages with status tracking
- **Translations**: Translation jobs with language/tone settings  
- **Summaries**: Summarization jobs with mode/tone settings
- **Generated Images**: AI-generated image metadata and storage

## Development Guidelines

### Code Standards
- Project uses **Ultracite** configuration (extends Biome) for strict TypeScript/React standards
- Accessibility-first approach with comprehensive a11y rules
- Type-safe API communication via oRPC
- Consistent error handling patterns

### File Structure Patterns
```
apps/
├── server/src/
│   ├── orpc/procedures/    # API endpoint definitions
│   ├── db/schema/          # Database schema definitions
│   ├── lib/providers/      # AI provider integrations
│   └── chat/              # Chat-specific handlers
├── web/src/
│   ├── routes/            # Page components (TanStack Router)
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Utility functions
```

### API Communication
- Uses oRPC for type-safe client-server communication
- Server exports procedures from `apps/server/src/orpc/procedures/`
- Client consumes via `apps/web/src/utils/orpc.ts`
- All API calls are handled through TanStack Query for caching/state management

### Database Workflow
1. Modify schema in `apps/server/src/db/schema/`
2. Generate migrations: `bun run db:generate`
3. Apply migrations: `bun run db:migrate`
4. Migrations are bundled into `migration-data.generated.ts` for deployment

### Configuration System
- **Centralized Config**: Uses `apps/server/src/lib/config.ts` for unified configuration management
- **Configuration Priority**: Environment variables → `APP_CONFIG` file → `execDir/config.json` → defaults
- **Environment Variables**: AI provider API keys, `SERVER_PORT`, `CORS_ORIGIN`, `WEB_DIST_DIR`, `DATABASE_URL`, `MODELS_DIR`
- **JSON Configuration**: Supports external JSON config files for deployment customization
- **Production Builds**: Optimized paths for standalone binary deployment with co-located assets

## Common Development Tasks

### Adding New AI Providers
1. Create provider client in `apps/server/src/lib/providers/`
2. Add provider constant to `constants.ts`
3. Update model seeding in `scripts/seed-models.ts`
4. Add provider to context in `lib/context.ts`

### Adding New Routes/Pages  
1. Create route component in `apps/web/src/routes/`
2. TanStack Router auto-generates route tree
3. Add navigation to sidebar components if needed
4. Create corresponding API procedures in server if required

### Modifying Database Schema
1. Edit schema in `apps/server/src/db/schema/index.ts`
2. Generate and run migrations as described above
3. Update any affected API procedures and components
4. Consider backward compatibility for existing data

### Production Deployment
1. **Build Assets**: `bun run build` (creates `dist/web/` and server build)
2. **Compile Binary**: `bun run compile` (creates standalone `dist/dastyar-ai` binary)  
3. **Prepare Offline**: `bun run prepare-offline` (downloads models and WASM files to `dist/`)
4. **Configuration**: Place `config.json` next to binary for custom settings
5. **Deploy**: Copy entire `dist/` directory to production server

### Offline Model Preparation
```bash
# Download default model (Xenova/whisper-tiny)
bun run prepare-offline

# Download specific models
bun run prepare-offline Xenova/whisper-base,Xenova/whisper-small

# Use environment variable
OFFLINE_MODEL=Xenova/whisper-base bun run prepare-offline
```