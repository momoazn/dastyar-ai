# Dastyar AI - Project Structure

This document describes the organization of the Dastyar AI project.

---

## 📁 Root Directory

```
dastyar-ai/
├── README.md                    # Main project documentation
├── package.json                 # Workspace configuration
├── turbo.json                   # Turbo build configuration
├── tsconfig.json                # TypeScript configuration
├── biome.jsonc                  # Linting/formatting configuration
├── bunfig.toml                  # Bun runtime configuration
├── build.ts                     # Build orchestration script
├── config.json                  # Application configuration
│
├── apps/                        # Application components
│   ├── server/                  # Bun/Hono API server
│   ├── web/                     # React 19 frontend
│   └── whisper/                 # Go Whisper server
│
├── scripts/                     # Build and utility scripts
│   └── build/                   # TypeScript build scripts
│
├── docs/                        # General documentation
├── dist/                        # Build output (gitignored)
└── node_modules/               # Dependencies (gitignored)
```

---

## 📦 Apps Directory

### Server (`apps/server/`)

Bun-based API server with Hono framework.

```
apps/server/
├── src/
│   ├── index.ts                # Entry point
│   ├── config/                 # Configuration management
│   ├── database/               # Drizzle ORM setup
│   ├── handlers/               # API handlers
│   ├── routes/                 # API routes (ORPC)
│   ├── services/               # Business logic
│   ├── middleware/             # Middleware functions
│   └── scripts/                # Utility scripts
├── prisma/                     # Database schema (legacy)
├── drizzle/                    # Database migrations
├── dist/                       # Build output
│   └── dastyar-ai.exe         # Windows executable
├── package.json
└── tsconfig.json
```

### Web (`apps/web/`)

React 19 frontend with Vite.

```
apps/web/
├── src/
│   ├── main.tsx               # Entry point
│   ├── routes/                # TanStack Router routes
│   ├── components/            # React components
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilities
│   ├── styles/                # Global styles
│   └── assets/                # Static assets
├── dist/                      # Build output (static assets)
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Whisper (`apps/whisper/`)

Go-based Whisper transcription server.

```
apps/whisper/
├── main.go                    # Entry point
├── go.mod                     # Go dependencies
├── internal/
│   ├── config/               # Configuration
│   ├── handler/              # HTTP handlers
│   ├── service/              # Whisper service
│   └── ffmpeg/               # Embedded FFmpeg
│       ├── embed.go          # FFmpeg extraction
│       ├── embed_windows_amd64.go
│       ├── embed_darwin_amd64.go
│       ├── embed_linux_amd64.go
│       └── bin/              # Platform-specific FFmpeg binaries
├── whisper.cpp/              # Git submodule (whisper.cpp library)
├── models/                   # Whisper model files (.bin)
├── web/                      # Static web UI
├── whisper.exe               # Windows executable (after build)
└── build-windows.bat         # Windows build script
```

---

## 🔨 Build Scripts (`scripts/build/`)

TypeScript build orchestration scripts.

```
scripts/build/
├── index.ts                   # Main build entry point
├── context.ts                 # Build context (paths, platform info)
├── helpers.ts                 # Build helper functions
├── deps.ts                    # Dependency checking
├── apps.ts                    # App-specific build logic
└── packaging.ts               # Distribution packaging
```

---

## 📋 Distribution Package (`dist/`)

Build output for Windows distribution (created during build).

```
dist/
├── dastyar-ai.exe             # Main server executable
├── whisper.exe                # Whisper server executable
├── web/                       # Static web assets
│   ├── index.html
│   └── assets/
├── models/                    # Whisper models (optional)
│   └── ggml-base.bin
├── config.json                # Configuration (auto-generated)
├── data.db                    # SQLite database (created on first run)
├── start-dastyar-ai.bat       # Launcher
├── stop-dastyar-ai.bat        # Stop script
├── check-health.bat           # Health check
├── configure.bat              # Configuration helper
├── download-whisper-models.bat # Model downloader
├── verify-installation.bat    # Installation checker
├── README.md                  # User guide
├── QUICK-START.txt           # Quick reference
└── BUILD.md                  # Build instructions (optional)
```

---

## 📚 Documentation Organization

### Root Level

- **README.md** - Main project documentation
  - Quick start for developers and users
  - Development instructions
  - Project overview
- **CLAUDE.md** - Project guidelines and conventions
- **TASKS.md** - Production readiness task list

### General Documentation (`docs/`)

Project-wide documentation including:

- **SECRETS.md** - Secrets management and security guide
- **API documentation** - API endpoints and usage
- **Architecture documentation** - System design and architecture

---

## 🎯 Key Files

### Configuration

- **config.json** - Application runtime configuration
- **biome.jsonc** - Code linting and formatting rules
- **turbo.json** - Monorepo build configuration
- **tsconfig.json** - TypeScript compiler settings
- **bunfig.toml** - Bun runtime configuration

### Build

- **build.ts** - Main build orchestration
- **package.json** - Workspace dependencies and scripts
- **scripts/build/** - TypeScript build scripts

### Development

- **CLAUDE.md** - Project guidelines and conventions
- **AGENTS.md** - AI agent documentation

---

## 🚀 Common Tasks

### Development

```bash
# From project root
bun install              # Install dependencies
bun run dev             # Start all services in dev mode
bun run check-types     # Type checking
bun run lint:fix        # Fix linting issues
```

### Build and Deployment

```bash
# Build for current platform
bun run build           # Build web + server + whisper

# Cross-platform builds
bun run build:windows   # Build for Windows from macOS/Linux
bun run build:all       # Build for all platforms

# Service management
bun run start           # Start all services
bun run stop            # Stop all services
bun run status          # Check service status
```

---

## 📂 Gitignored Directories

- `node_modules/` - NPM/Bun dependencies
- `dist/` - Build output
- `.turbo/` - Turbo cache
- `apps/*/dist/` - App-specific build outputs
- `apps/server/uploaded-documents/` - User uploads
- `apps/server/generated-images/` - Generated images
- `apps/whisper/.go-work/` - Go build cache
- `apps/whisper/whisper.cpp/build_go/` - C++ build artifacts

---

## 🔍 Finding Things

**Looking for...**

- **Build scripts?** → `scripts/` or root build files
- **Documentation?** → `docs/` or root README.md
- **API code?** → `apps/server/src/`
- **Web UI code?** → `apps/web/src/`
- **Whisper code?** → `apps/whisper/`
- **Configuration?** → `config.json` or `apps/server/src/config/`
- **Database schema?** → `apps/server/src/database/schema/`

---

## 📊 Directory Sizes (Approximate)

- `apps/server/` - ~50MB (with node_modules: ~200MB)
- `apps/web/` - ~30MB (with node_modules: ~400MB)
- `apps/whisper/` - ~20MB (with whisper.cpp: ~500MB)
- `dist/` - ~140-200MB (without models)
- `dist/` - ~280-340MB (with base model)

---

## 🔄 Update This Document

When adding new directories or reorganizing:

1. Update this document
2. Update root README.md links
3. Update CLAUDE.md if guidelines change
4. Update script paths in build scripts if needed

---

**Last Updated**: 2025
**Version**: 1.0
