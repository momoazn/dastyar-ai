# Building Dastyar AI for Windows

This guide covers building Dastyar AI as standalone Windows executables.

## Prerequisites

### For Building on macOS/Linux (Cross-Compilation)

- **Bun** 1.3.0 or later
- **Go** 1.23 or later
- **CMake** (for building whisper.cpp)
- **C++ compiler** (g++ or clang++)
- **Git**

### For Building on Windows

- **Bun** 1.3.0 or later
- **Go** 1.23 or later
- **CMake** (for building whisper.cpp)
- **C++ compiler** (MinGW or Visual Studio Build Tools)
- **Git**
- **Bash** (Git Bash or WSL)

## Quick Build (macOS/Linux)

From the project root:

```bash
# Build everything including Windows binaries
bun run build:windows

# Or build Windows server only
BUILD_WINDOWS_SERVER=1 bun run build.ts
```

This will create:
- `dist/dastyar-ai.exe` - Windows server binary
- `dist/whisper.exe` - Windows Whisper binary (if cross-compilation works)
- `dist/web/` - Web assets

## Detailed Build Process

### 1. Build Server Binary (Windows)

The server uses Bun's built-in cross-compilation:

```bash
cd apps/server
bun run build:windows
```

This creates `dist/dastyar-ai.exe` with:
- Embedded Bun runtime
- All Node.js dependencies bundled
- SQLite support (via better-sqlite3, bundled by Bun)

### 2. Build Whisper Binary (Windows)

#### Option A: Cross-Compile from macOS/Linux

The build script currently doesn't support Windows cross-compilation automatically. You'll need to build manually:

```bash
cd apps/whisper

# Download FFmpeg for Windows (if not already downloaded)
bash download-ffmpeg.sh --all

# Build whisper.cpp (this is platform-specific, so you may need to build on Windows)
# For cross-compilation, you'll need to set up a Windows build environment
# or use a Windows VM/container

# Build Go binary for Windows
GOOS=windows GOARCH=amd64 CGO_ENABLED=1 go build -o whisper.exe .
```

**Note**: Cross-compiling the Whisper binary is complex because it requires:
- CGO (C bindings)
- whisper.cpp static library
- Platform-specific FFmpeg binaries

#### Option B: Build on Windows

1. Install prerequisites:
   - Go 1.23+
   - CMake
   - C++ compiler (MinGW or Visual Studio)
   - Git

2. Build:
   ```bash
   cd apps/whisper
   bash build.sh
   ```

   This will:
   - Clone whisper.cpp if needed
   - Download FFmpeg for Windows
   - Build whisper.cpp
   - Build the Go binary with embedded FFmpeg

### 3. Build Web Frontend

```bash
cd apps/web
bun run build
```

This creates static assets in `dist/` that are served by the server.

## Complete Build Script

For a complete Windows distribution:

```bash
# From project root
bun install

# Build web frontend
cd apps/web && bun run build && cd ../..

# Build server for Windows
cd apps/server && bun run build:windows && cd ../..

# Build Whisper (on Windows or via cross-compilation)
cd apps/whisper && bash build.sh && cd ../..

# Copy everything to dist/
mkdir -p dist
cp apps/server/dist/dastyar-ai.exe dist/
cp apps/whisper/whisper.exe dist/
cp -r apps/web/dist dist/web
cp config.json dist/
```

## Distribution Package

A complete Windows distribution should include:

```
dastyar-ai-windows/
├── dastyar-ai.exe              # Main server
├── whisper.exe                 # Whisper API server
├── config.json                 # Configuration
├── web/                        # Web assets
│   ├── index.html
│   └── assets/
├── models/                     # Whisper models (download separately)
│   └── ggml-base.bin
├── start-dastyar-ai.bat        # Launcher
├── stop-dastyar-ai.bat         # Stop script
├── download-whisper-models.bat # Model downloader
├── check-health.bat            # Health check
├── configure.bat               # Configuration helper
└── WINDOWS-README.md           # User guide
```

## Troubleshooting

### Bun Cross-Compilation Issues

If Bun's Windows cross-compilation fails:
- Ensure you're using Bun 1.3.0 or later
- Check that `bun-windows-x64` target is available
- Try building on Windows directly

### Whisper Build Issues

**CGO errors**:
- Ensure CGO is enabled: `CGO_ENABLED=1`
- Install a C++ compiler
- Check that whisper.cpp is built correctly

**FFmpeg not found**:
- Run `download-ffmpeg.sh --all` first
- Check that FFmpeg binaries are in `bin/` directory

**Cross-compilation from macOS/Linux**:
- Consider using a Windows VM or container
- Or build on Windows directly

### SQLite Issues

Bun should bundle better-sqlite3 automatically. If you encounter issues:
- Ensure you're using the latest Bun version
- Check that the binary includes native bindings
- Test on a clean Windows machine

## Testing the Build

1. **Test on Windows**:
   ```cmd
   # Start services
   start-dastyar-ai.bat

   # Check health
   check-health.bat
   ```

2. **Verify offline operation**:
   - Disconnect from internet
   - Start services
   - Test transcription (requires models)
   - Test web interface

## Size Optimization

The final binaries are:
- `dastyar-ai.exe`: ~50-100MB (includes Bun runtime)
- `whisper.exe`: ~90MB (includes FFmpeg and whisper.cpp)

To reduce size:
- Use UPX compression (may trigger antivirus warnings)
- Strip debug symbols
- Use smaller Whisper models

## CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Build Windows

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - uses: actions/setup-go@v4
        with:
          go-version: '1.23'
      
      - name: Install dependencies
        run: bun install
      
      - name: Build
        run: bun run build:windows
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: windows-dist
          path: dist/
```

## Next Steps

After building:
1. Test on a clean Windows machine
2. Download Whisper models
3. Create installer (optional, using Inno Setup or NSIS)
4. Package for distribution

