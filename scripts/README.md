# Dastyar AI - Scripts Directory

This directory contains all build, deployment, and utility scripts for the Dastyar AI project.

## Directory Structure

```
scripts/
├── README.md                    # This file
├── build.ts                     # Main build orchestrator
├── check-dependencies.ts        # Verify build prerequisites
├── build-web.ts                 # Build React frontend
├── build-server.ts              # Build Bun server binary
├── build-whisper.ts             # Build Go Whisper server
├── package-dist.ts              # Package distribution files
├── project-paths.ts             # Shared script paths
├── run-command.ts               # Bun process execution helper
├── command-discovery.ts         # Command detection helper
├── whisper-assets.ts            # FFmpeg/model utilities
│
├── start.ts                     # Start all services
├── stop.ts                      # Stop all services
├── status.ts                    # Check service status
│
├── downloads/                   # Download utilities
│   ├── download-ffmpeg.ts      # Download FFmpeg binaries
│   └── download-model.ts       # Download Whisper models
│
├── testing/                     # Testing utilities
│   └── test-api.ts             # Test Whisper API endpoints
│
└── wrappers/                    # Platform-specific wrappers
    ├── start.bat / .sh         # Start services wrapper
    ├── stop.bat / .sh          # Stop services wrapper
    ├── status.bat / .sh        # Status check wrapper
    ├── download-ffmpeg.bat / .sh
    ├── download-model.bat / .sh
    └── test-api.bat / .sh
```

## Main Scripts

### Build & Deploy

**`build.ts`** - Main build orchestrator
```bash
bun scripts/build.ts                    # Build for current platform
bun scripts/build.ts --platform=windows # Build for Windows
bun scripts/build.ts --platform=all     # Build all platforms
bun scripts/build.ts --skip-deps        # Skip dependency install
bun scripts/build.ts --skip-web         # Skip web build
bun scripts/build.ts --skip-server      # Skip server build
bun scripts/build.ts --skip-whisper     # Skip whisper build
bun scripts/build.ts --skip-package     # Skip dist packaging
bun scripts/build.ts --force-deps       # Force dependency reinstall
bun scripts/build.ts --no-parallel      # Disable parallel web/server build
bun scripts/build.ts --release          # Release build (auto-bump version)
bun scripts/build.ts --release --bump=major # Release build with major bump
```

Build behavior:
- Web and server builds run in parallel by default.
- Dependencies are reinstalled only when needed (lockfiles changed, `node_modules` missing, or CI).
- Use `--force-deps` for clean reproducible local builds.
- Release mode auto-bumps root `package.json` version (default bump: `minor`) and commits it as `chore(release): bump version to vX.Y.Z`.

Or use npm scripts:
```bash
bun run build              # Current platform
bun run build:windows      # Windows build
bun run build:all          # All platforms
```

### Service Management

**`start.ts`** - Start services
```bash
bun scripts/start.ts           # Start both Whisper + Server
bun scripts/start.ts whisper   # Start only Whisper API
bun scripts/start.ts server    # Start only main server

# Or use wrappers
./scripts/wrappers/start.sh    # Unix
scripts\wrappers\start.bat     # Windows

# Or npm scripts
bun run start
```

**`stop.ts`** - Stop services
```bash
bun scripts/stop.ts            # Stop all services
bun scripts/stop.ts whisper    # Stop only Whisper
bun scripts/stop.ts server     # Stop only server

# Or use npm scripts
bun run stop
```

**`status.ts`** - Check service status
```bash
bun scripts/status.ts          # Check all services

# Or use npm scripts
bun run status
```

## Build Modules

These build modules can be run independently:

```bash
bun scripts/check-dependencies.ts  # Verify build tools
bun scripts/build-web.ts           # Build web only
bun scripts/build-server.ts        # Build server only
bun scripts/build-whisper.ts       # Build whisper only
bun scripts/package-dist.ts        # Package distribution
```

## Download Scripts

Located in `downloads/`:

**`download-ffmpeg.ts`** - Download FFmpeg binaries
```bash
bun scripts/downloads/download-ffmpeg.ts        # Current platform
bun scripts/downloads/download-ffmpeg.ts --all  # All platforms
bun scripts/downloads/download-ffmpeg.ts --force

# Or use npm scripts
bun run download:ffmpeg
bun run download:ffmpeg:all
```

**`download-model.ts`** - Download Whisper models
```bash
bun scripts/downloads/download-model.ts ggml-base.bin
bun scripts/downloads/download-model.ts ggml-large-v3.bin --force

# Or use npm scripts
bun run download:model ggml-base.bin
```

Default download locations:
- FFmpeg binaries: `apps/whisper/ffmpeg-binaries`
- Whisper models: `apps/whisper/models`

Available models:
- `ggml-tiny.bin` - Fastest (75MB)
- `ggml-base.bin` - Balanced (142MB) - Recommended
- `ggml-small.bin` - Good quality (466MB)
- `ggml-medium.bin` - High quality (1.5GB)
- `ggml-large-v3.bin` - Best quality (2.9GB)

## Testing Scripts

Located in `testing/`:

**`test-api.ts`** - Test Whisper API
```bash
bun scripts/testing/test-api.ts
bun scripts/testing/test-api.ts sample.wav

# Or use npm scripts
bun run test:api
bun run test:api sample.wav
```

## Platform Wrappers

Located in `wrappers/` - Simple .bat/.sh files for convenience:

**Windows:**
```batch
scripts\wrappers\start.bat
scripts\wrappers\stop.bat
scripts\wrappers\status.bat
scripts\wrappers\download-ffmpeg.bat
scripts\wrappers\download-model.bat ggml-base.bin
scripts\wrappers\test-api.bat sample.wav
```

**macOS/Linux:**
```bash
./scripts/wrappers/start.sh
./scripts/wrappers/stop.sh
./scripts/wrappers/status.sh
./scripts/wrappers/download-ffmpeg.sh
./scripts/wrappers/download-model.sh ggml-base.bin
./scripts/wrappers/test-api.sh sample.wav
```

## NPM Scripts

All scripts are also available as npm scripts in `package.json`:

```bash
# Build
bun run build
bun run build:windows
bun run build:all

# Service management
bun run start
bun run stop
bun run status

# Downloads
bun run download:ffmpeg
bun run download:ffmpeg:all
bun run download:model

# Testing
bun run test:api

# Development
bun run dev              # Start dev servers
bun run dev:web          # Web only
bun run dev:server       # Server only
bun run dev:whisper      # Whisper only

# Database
bun run db:push
bun run db:studio
bun run db:generate
bun run db:migrate

# Quality
bun run check-types
bun run lint:fix
bun run lint:check
```

## Cross-Platform Notes

All TypeScript scripts work identically on Windows, macOS, and Linux:
- ✅ Same command syntax
- ✅ Same behavior
- ✅ Same output
- ✅ Platform detection is automatic

Platform-specific wrappers (.bat/.sh) are provided for convenience but are optional.

## Development

All scripts are written in TypeScript and run with Bun for maximum performance and cross-platform compatibility.

To modify scripts:
1. Edit the TypeScript files directly
2. Run linter: `bun run lint:fix`
3. Test the script: `bun scripts/path/to/script.ts`
4. No compilation needed - Bun runs TypeScript natively
