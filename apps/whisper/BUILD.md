# Whisper API Executable Build

This document explains how to build a single executable binary from the Whisper Python API.

## Overview

The Whisper API can be compiled into a standalone executable using PyInstaller. This creates a single file that includes:

- Python interpreter
- All dependencies (FastAPI, Whisper, PyTorch, etc.)
- Application code
- Static assets (HTML UI)

## Build Requirements

- Python 3.13+
- uv package manager
- ~2GB free disk space for build process
- ~206MB for final executable

### Platform-Specific Requirements

- **Windows**: See [WINDOWS_BUILD.md](WINDOWS_BUILD.md) for detailed Windows build instructions
- **macOS/Linux**: Standard build tools (gcc, make)

## Quick Build

```bash
# Build the executable
bun run build

# Or manually:
uv run python build.py
```

## Build Process

The build script performs these steps:

1. **Clean**: Removes previous build artifacts
2. **Install**: Installs PyInstaller and build dependencies
3. **Bundle**: Uses PyInstaller to create single executable
4. **Verify**: Checks executable creation and reports size

## Build Configuration

### PyInstaller Spec File (`whisper-api.spec`)

- **Entry Point**: `src/main.py`
- **Model Files**: Bundles existing models from `models/` directory
- **Hidden Imports**: Handles FastAPI, Whisper, PyTorch dependencies
- **Optimizations**: UPX compression, excludes unnecessary packages

### Custom Hooks

- `hooks/hook-whisper.py`: Handles OpenAI Whisper dependencies

## Output

- **Location**: `dist/whisper-api`
- **Size**: ~206MB (includes PyTorch, tiny model, dependencies)
- **Platform**: Native binary for build platform

## Deployment

### Basic Deployment (Tiny Model Only)

The executable includes only the tiny model and can be deployed by:

1. Copy `dist/whisper-api` to target machine
2. Set executable permissions: `chmod +x whisper-api`
3. Run: `./whisper-api`

### Extended Deployment (Additional Models)

To use larger models (base, small, medium, large):

1. Copy `dist/whisper-api` to target machine
2. Create `models/` directory next to the executable
3. Copy desired model files to the `models/` directory
4. Set executable permissions: `chmod +x whisper-api`
5. Run: `./whisper-api`

Example deployment structure:

```
/opt/whisper/
├── whisper-api          # Executable (250MB)
└── models/              # Optional: additional models
    ├── base.pt
    ├── small.pt
    └── medium.pt
```

## Configuration

The executable respects these environment variables:

- `WHISPER_PORT`: Port to run on (default: 40002)
- `TQDM_DISABLE`: Disable progress bars (set to "1")

## Size Optimization

The executable size breakdown:

- PyTorch (~150MB)
- Python interpreter and stdlib (~50MB)
- FastAPI and dependencies (~30MB)
- Tiny Whisper model (~20MB)
- Additional ML libraries (~100MB)

**Already Optimized:**

- Only bundles tiny model (reduces size by ~800MB)
- Larger models loaded from local `models/` directory
- UPX compression enabled

**Further Optimization:**

- Consider removing unused PyTorch features if not needed
- Use CPU-only PyTorch build for smaller size (if no CUDA needed)

## Troubleshooting

### Build Fails

- Ensure all dependencies are installed: `uv sync --group build`
- Check Python version: `python --version` (should be 3.13+)
- Clear build cache: `bun run build:clean`

### Runtime Errors

#### `ModuleNotFoundError: No module named 'jaraco.text'`

This error has been fixed by:

- Adding `jaraco.text` and related modules to hidden imports
- Including `setuptools` and `jaraco.text` in build dependencies
- Not excluding `setuptools` from the bundle

The fix has been applied to the build configuration.

### Large File Size

- Remove unused models from `models/` directory
- Modify `whisper-api.spec` to exclude more packages
- Disable UPX compression if causing issues

### Runtime Issues

- Ensure models directory is accessible
- Check port availability (default 40002)
- Verify file permissions on executable

## Manual Build Steps

If the automated build fails, you can build manually:

```bash
# Install dependencies
uv sync --group build

# Clean previous builds
rm -rf build dist

# Build with PyInstaller
uv run pyinstaller whisper-api.spec --clean

# Test executable
./dist/whisper-api
```

## Cross-Platform Notes

- Build on target platform (Linux, macOS, Windows)
- Models and dependencies are platform-specific
- PyTorch includes platform-specific optimizations
- Consider Docker for consistent Linux builds
