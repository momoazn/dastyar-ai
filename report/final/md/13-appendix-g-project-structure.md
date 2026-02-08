# پیوست G: ساختار پروژه و نمای درختی

این پیوست، سند ساختار پروژه و یک نمای درختی با عمق محدود را ارائه می‌کند.

## وضعیت فعلی (همگام با مخزن)

در زمان آماده‌سازی این گزارش Markdown، ساختار واقعی مخزن به صورت خلاصه چنین است:

```text
dastyar-ai/
├── apps/
│   ├── server/                 # Bun/Hono API server + ORPC
│   │   ├── src/
│   │   │   ├── app.ts
│   │   │   ├── server.ts
│   │   │   ├── config.ts
│   │   │   ├── database/       # Drizzle + SQLite (schema + migrations)
│   │   │   ├── middlewares/
│   │   │   ├── procedures/     # ORPC routers/procedures
│   │   │   ├── repositories/
│   │   │   ├── routes/         # Hono routes (/rpc, /api/chat, /api/images)
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── config.example.json
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   ├── web/                    # React 19 + Vite + TanStack Router/Query
│   └── whisper/                # Go + whisper.cpp (OpenAI-compatible endpoints)
├── scripts/                    # Build/ops orchestration + wrappers + tests
│   ├── build.ts
│   ├── start.ts
│   ├── stop.ts
│   ├── status.ts
│   ├── tasks/
│   ├── downloads/
│   ├── wrappers/
│   └── testing/
├── docs/                       # Documentation (SECRETS.md, TASKS.md, ...)
├── report/
│   └── final/
│       ├── md/                 # گزارش نهایی: فایل‌های Markdown ترتیبی
│       └── docx/               # خروجی نهایی گزارش به صورت DOCX
└── specs/
```

نکته: نسخه نهایی گزارش به صورت Markdown در `report/final/md/` و نسخه DOCX در `report/final/docx/report.docx` نگه‌داری می‌شود.

## متن سند ساختار (نسخه آرشیوی؛ ممکن است قدیمی باشد)

متن زیر، برای ردیابی تحول مستندسازی پروژه، از اسناد موجود استخراج شده است و ممکن است با وضعیت فعلی مخزن (به‌ویژه مسیرهای build و برخی زیرپوشه‌ها) تفاوت داشته باشد.

```md
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
```

## نمای درختی (عمق محدود)

```text
.claude/
  - .DS_Store
  - settings.local.json
.cursor/
  - debug.log
.opencode/
  - command/
  - .gitignore
  - bun.lock
  - package.json
.vscode/
  - extensions.json
  - settings.json
  - tasks.json
apps/
  - server/
    - src/
      - database/
        - migrations/
        - schema/
        - .DS_Store
        - index.ts
        - migrate.ts
        - migration-data.generated.ts
      - lib/
        - context.ts
        - file-validation.test.ts
        - file-validation.ts
        - logger.ts
        - pdfjs-node-polyfills.ts
        - prompts.ts
        - startup.ts
      - middlewares/
        - auth.ts
      - procedures/
        - helpers/
        - admin.ts
        - auth.ts
        - base.ts
        - code.ts
        - documents.ts
        - health.ts
        - image-threads.ts
        - images.ts
        - index.ts
        - llm-models.ts
        - messages.ts
        - summarize.ts
        - threads.ts
        - transcribe.ts
        - translation.ts
      - repositories/
        - admin.ts
        - auth.test.ts
        - auth.ts
        - code-runs.ts
        - documents.ts
        - image-threads.ts
        - images.ts
        - llm-models.ts
        - messages.ts
        - ollama-servers.ts
        - summaries.ts
        - system-settings.ts
        - threads.ts
        - translations.ts
      - routes/
        - chat.ts
        - images.ts
        - rpc.ts
      - scripts/
        - bundle-migrations.ts
        - make-user-admin.ts
      - services/
        - ai-providers/
        - processors/
        - storage/
        - auth.test.ts
        - auth.ts
        - index.ts
      - types/
        - config.ts
        - messages.ts
      - utils/
        - chat.test.ts
        - chat.ts
        - llm-json.test.ts
        - llm-json.ts
        - persian-normalize.test.ts
        - persian-normalize.ts
        - text-extractor.test.ts
        - text-extractor.ts
      - .DS_Store
      - app.ts
      - config.ts
      - index.ts
      - server.ts
    - uploaded-documents/
    - .DS_Store
    - .gitignore
    - config.example.json
    - data.db
    - drizzle.config.ts
    - package.json
    - run-all-tests-orpc.ts
    - tsconfig.json
  - web/
    - .tanstack/
      - tmp/
        - 7fbb3467-7f06e7a9bf64ec58375a77bec4376fc0
    - src/
      - atoms/
        - auth.ts
        - initial-prompt.ts
        - model.ts
      - components/
        - admin/
        - ai-elements/
        - chat/
        - effects/
        - glass/
        - image-generation/
        - scaffold/
        - settings/
        - sidebar/
        - transcribe/
        - translation/
        - ui/
        - document-upload-button.tsx
        - error-boundary.test.tsx
        - error-boundary.tsx
        - header.tsx
        - prompt-input-base.tsx
        - theme-provider.tsx
        - theme-toggle.tsx
        - transcribe-button.tsx
        - user-profile.tsx
      - hooks/
        - use-ai-chat.ts
        - use-chat-input.ts
        - use-chat-thread.ts
        - use-feature-model-selection.ts
        - use-image-generation.ts
        - use-image-threads.ts
        - use-mobile.test.ts
        - use-mobile.ts
        - use-transcription.ts
        - use-user.ts
        - use-voice-recorder.ts
      - layouts/
        - admin.tsx
        - auth.tsx
        - protected.tsx
      - lib/
        - texts/
        - enum-mappings.ts
        - error-utils.ts
        - image-generation-constants.ts
        - image-generation-utils.test.ts
        - image-generation-utils.ts
        - logger.ts
        - pdf.ts
        - utils.test.ts
        - utils.ts
      - routes/
        - chat/
        - code/
        - image/
        - summary/
        - translation/
        - __root.tsx
        - admin.tsx
        - index.tsx
        - login.tsx
        - register.tsx
        - settings.tsx
        - transcribe.tsx
      - types/
        - database.ts
        - messages.ts
        - settings.ts
      - utils/
        - audio.ts
        - orpc.ts
      - index.css
      - main.tsx
      - routeTree.gen.ts
    - .DS_Store
    - .env
    - .env.example
    - .env.local
    - .gitignore
    - bunfig.toml
    - components.json
    - index.html
    - package.json
    - test-setup.ts
    - tsconfig.json
    - vite.config.ts
  - whisper/
    - .go-work/
      - build-cache/
        - 00/
        - 01/
        - 02/
        - 03/
        - 04/
        - 05/
        - 06/
        - 07/
        - 08/
        - 09/
        - 0a/
        - 0b/
        - 0c/
        - 0d/
        - 0e/
        - 0f/
        - 10/
        - 11/
        - 12/
        - 13/
        - 14/
        - 15/
        - 16/
        - 17/
        - 18/
        - 19/
        - 1a/
        - 1b/
        - 1c/
        - 1d/
        - 1e/
        - 1f/
        - 20/
        - 21/
        - 22/
        - 23/
        - 24/
        - 25/
        - 26/
        - 27/
        - 28/
        - 29/
        - 2a/
        - 2b/
        - 2c/
        - 2d/
        - 2e/
        - 2f/
        - 30/
        - 31/
        - 32/
        - 33/
        - 34/
        - 35/
        - 36/
        - 37/
        - 38/
        - 39/
        - 3a/
        - 3b/
        - 3c/
        - 3d/
        - 3e/
        - 3f/
        - 40/
        - 41/
        - 42/
        - 43/
        - 44/
        - 45/
        - 46/
        - 47/
        - 48/
        - 49/
        - 4a/
        - 4b/
        - 4c/
        - 4d/
        - 4e/
        - 4f/
        - 50/
        - 51/
        - 52/
        - 53/
        - 54/
        - 55/
        - 56/
        - 57/
        - 58/
        - 59/
        - 5a/
        - 5b/
        - 5c/
        - 5d/
        - 5e/
        - 5f/
        - 60/
        - 61/
        - 62/
        - 63/
        - 64/
        - 65/
        - 66/
        - 67/
        - 68/
        - 69/
        - 6a/
        - 6b/
        - 6c/
        - 6d/
        - 6e/
        - 6f/
        - 70/
        - 71/
        - 72/
        - 73/
        - 74/
        - 75/
        - 76/
        - 77/
        - 78/
        - 79/
        - 7a/
        - 7b/
        - 7c/
        - 7d/
        - 7e/
        - 7f/
        - 80/
        - 81/
        - 82/
        - 83/
        - 84/
        - 85/
        - 86/
        - 87/
        - 88/
        - 89/
        - 8a/
        - 8b/
        - 8c/
        - 8d/
        - 8e/
        - 8f/
        - 90/
        - 91/
        - 92/
        - 93/
        - 94/
        - 95/
        - 96/
        - 97/
        - 98/
        - 99/
        - 9a/
        - 9b/
        - 9c/
        - 9d/
        - 9e/
        - 9f/
        - a0/
        - a1/
        - a2/
        - a3/
        - a4/
        - a5/
        - a6/
        - a7/
        - a8/
        - a9/
        - aa/
        - ab/
        - ac/
        - ad/
        - ae/
        - af/
        - b0/
        - b1/
        - b2/
        - b3/
        - b4/
        - b5/
        - b6/
        - b7/
        - b8/
        - b9/
        - ba/
        - bb/
        - bc/
        - bd/
        - be/
        - bf/
        - c0/
        - c1/
        - c2/
        - c3/
        - c4/
        - c5/
        - c6/
        - c7/
        - c8/
        - c9/
        - ca/
        - cb/
        - cc/
        - cd/
        - ce/
        - cf/
        - d0/
        - d1/
        - d2/
        - d3/
        - d4/
        - d5/
        - d6/
        - d7/
        - d8/
        - d9/
        - da/
        - db/
        - dc/
        - dd/
        - de/
        - df/
        - e0/
        - e1/
        - e2/
        - e3/
        - e4/
        - e5/
        - e6/
        - e7/
        - e8/
        - e9/
        - ea/
        - eb/
        - ec/
        - ed/
        - ee/
        - ef/
        - f0/
        - f1/
        - f2/
        - f3/
        - f4/
        - f5/
        - f6/
        - f7/
        - f8/
        - f9/
        - fa/
        - fb/
        - fc/
        - fd/
        - fe/
        - ff/
        - README
        - trim.txt
      - pkg/
        - mod/
    - ffmpeg-binaries/
      - ffmpeg-darwin-arm64
    - internal/
      - audio/
        - converter.go
        - wav_reader.go
      - config/
        - config.go
      - handler/
        - transcribe.go
      - service/
        - whisper.go
    - models/
      - ggml-base.bin
    - temp/
    - web/
      - static/
        - index.html
    - whisper.cpp/
      - .devops/
        - cublas.Dockerfile
        - main-cuda.Dockerfile
        - main-intel.Dockerfile
        - main-musa.Dockerfile
        - main.Dockerfile
      - .github/
        - workflows/
      - bindings/
        - go/
        - java/
        - javascript/
        - ruby/
        - CMakeLists.txt
      - build_go/
        - autogenerated/
        - bin/
        - CMakeFiles/
        - ggml/
        - src/
        - cmake_install.cmake
        - CMakeCache.txt
        - compile_commands.json
        - Makefile
        - whisper-config.cmake
        - whisper-version.cmake
        - whisper.pc
      - ci/
        - README.md
        - run.sh
      - cmake/
        - build-info.cmake
        - DefaultTargetOptions.cmake
        - FindFFmpeg.cmake
        - git-vars.cmake
        - whisper-config.cmake.in
        - whisper.pc.in
      - examples/
        - addon.node/
        - bench/
        - bench.wasm/
        - cli/
        - command/
        - command.wasm/
        - deprecation-warning/
        - lsp/
        - python/
        - quantize/
        - server/
        - stream/
        - stream.wasm/
        - sycl/
        - talk-llama/
        - vad-speech-segments/
        - wchess/
        - whisper.android/
        - whisper.android.java/
        - whisper.nvim/
        - whisper.objc/
        - whisper.swiftui/
        - whisper.wasm/
        - CMakeLists.txt
        - coi-serviceworker.js
        - common-ggml.cpp
        - common-ggml.h
        - common-sdl.cpp
        - common-sdl.h
        - common-whisper.cpp
        - common-whisper.h
        - common.cpp
        - common.h
        - ffmpeg-transcode.cpp
        - generate-karaoke.sh
        - grammar-parser.cpp
        - grammar-parser.h
        - helpers.js
        - json.hpp
        - livestream.sh
        - miniaudio.h
        - server.py
        - stb_vorbis.c
        - twitch.sh
        - yt-wsp.sh
      - ggml/
        - cmake/
        - include/
        - src/
        - .gitignore
        - CMakeLists.txt
      - grammars/
        - assistant.gbnf
        - chess.gbnf
        - colors.gbnf
      - include/
        - whisper.h
      - models/
        - .gitignore
        - convert-h5-to-coreml.py
        - convert-h5-to-ggml.py
        - convert-pt-to-ggml.py
        - convert-silero-vad-to-ggml.py
        - convert-whisper-to-coreml.py
        - convert-whisper-to-openvino.py
        - download-coreml-model.sh
        - download-ggml-model.cmd
        - download-ggml-model.sh
        - download-vad-model.cmd
        - download-vad-model.sh
        - for-tests-ggml-base.bin
        - for-tests-ggml-base.en.bin
        - for-tests-ggml-large.bin
        - for-tests-ggml-medium.bin
        - for-tests-ggml-medium.en.bin
        - for-tests-ggml-small.bin
        - for-tests-ggml-small.en.bin
        - for-tests-ggml-tiny.bin
        - for-tests-ggml-tiny.en.bin
        - for-tests-silero-v5.1.2-ggml.bin
        - generate-coreml-interface.sh
        - generate-coreml-model.sh
        - ggml_to_pt.py
        - README.md
        - requirements-coreml.txt
        - requirements-openvino.txt
      - samples/
        - .gitignore
        - jfk.mp3
        - jfk.wav
        - README.md
      - scripts/
        - apple/
        - bench-all-gg.txt
        - bench-all.sh
        - bench-wts.sh
        - bench.py
        - build-info.sh
        - convert-all.sh
        - deploy-wasm.sh
        - gen-authors.sh
        - get-flags.mk
        - quantize-all.sh
        - sha-all.sh
        - sync-ggml-am.sh
        - sync-ggml.last
        - sync-ggml.sh
        - sync-llama.sh
      - src/
        - coreml/
        - openvino/
        - CMakeLists.txt
        - whisper-arch.h
        - whisper.cpp
      - tests/
        - earnings21/
        - librispeech/
        - .gitignore
        - CMakeLists.txt
        - en-0-ref.txt
        - en-1-ref.txt
        - en-2-ref.txt
        - es-0-ref.txt
        - run-tests.sh
        - test-c.c
        - test-vad-full.cpp
        - test-vad.cpp
        - test-whisper.js
      - .dockerignore
      - .gitignore
      - AUTHORS
      - build-xcframework.sh
      - close-issue.yml
      - CMakeLists.txt
      - LICENSE
      - Makefile
      - README.md
      - README_sycl.md
    - .DS_Store
    - .gitignore
    - dev.ts
    - go.mod
    - go.sum
    - main.go
    - Makefile
    - package.json
    - README.md
    - whisper
  - .DS_Store
docs/
  - archive/
    - CLEANUP_SUMMARY.md
    - CODEBASE_SIMPLIFICATION_PLAN.md
    - DRY_KISS_REFACTORING_PLAN.md
    - IMPLEMENTATION_UPDATE.md
    - IMPROVEMENTS_REPORT.md
    - PHASE3_COMPLETION_SUMMARY.md
    - PHASE3_QUICK_REFERENCE.md
    - SETTINGS_REBUILD_PLAN.md
  - .DS_Store
  - admin-panel.md
  - PROJECT-STRUCTURE.md
  - README.md
  - report.docx
  - report_original.docx
  - SECRETS.md
  - TASKS.md
  - thesis-proposal.md
report/
  - final/
    - 00-front-matter.md
    - appendix-a-config.md
    - appendix-b-api.md
    - appendix-c-database.md
    - appendix-d-glossary.md
    - appendix-e-extra.md
    - chapter-01-moghaddame.md
    - chapter-02-barresi-adabiyat.md
    - chapter-03-ravesh-shenasi.md
    - chapter-04-peyade-sazi.md
    - chapter-05-natije-giri.md
    - estimate-pages.py
    - generate-report-md.py
    - index.md
    - README.md
    - references.md
  - final3/
    - 00-front-matter.md
    - appendix-a-config.md
    - appendix-b-api.md
    - appendix-c-database.md
    - appendix-d-glossary.md
    - appendix-e-production-readiness.md
    - appendix-f-secrets-and-security.md
    - appendix-g-project-structure.md
    - appendix-h-build-and-testing.md
    - appendix-i-thesis-proposal.md
    - appendix-j-admin-panel.md
    - appendix-k-archive.md
    - appendix-l-cleanup.md
    - chapter-01-moghaddame.md
    - chapter-02-barresi-adabiyat.md
    - chapter-03-ravesh-shenasi.md
    - chapter-04-peyade-sazi.md
    - chapter-05-natije-giri.md
    - estimate-pages.py
    - index.md
    - README.md
  - build-final3-md.py
  - chapter1-introduction.md
  - chapter2-literature-review.md
  - chapter3-methodology.md
  - chapter4-results.md
  - chapter5-conclusion.md
  - generate-report-docx.py
scripts/
  - downloads/
    - download-ffmpeg.ts
    - download-model.ts
  - tasks/
    - build-server.ts
    - build-web.ts
    - build-whisper.ts
    - check-dependencies.ts
    - package-dist.ts
  - testing/
    - test-auth-api.ts
    - test-chat-api.ts
    - test-code-api.ts
    - test-document-api.ts
    - test-image-api.ts
    - test-summary-api.ts
    - test-translation-api.ts
    - test-whisper-api.ts
  - wrappers/
    - download-ffmpeg.bat
    - download-ffmpeg.sh
    - download-model.bat
    - download-model.sh
    - start.bat
    - start.sh
    - status.bat
    - status.sh
    - stop.bat
    - stop.sh
    - test-api.bat
    - test-api.sh
  - .DS_Store
  - build.ts
  - README.md
  - start.ts
  - status.ts
  - stop.ts
specs/
  - e2e-auth-testing-plan.md
  - IMPROVEMENTS_TODO.md
  - README.md
.DS_Store
.gitignore
AGENTS.md
biome.jsonc
bun.lock
bunfig.toml
CLAUDE.md
CLEANUP_PLAN.md
CLEANUP_REVIEW.md
config.json
package.json
README.md
tsconfig.json
turbo.json
```
