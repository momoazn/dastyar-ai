# Dastyar AI - Complete Windows Deployment Guide

**Version**: 1.0
**Target Platform**: Windows 10/11 (64-bit)
**Deployment Type**: Offline-capable standalone application

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Build Environment Setup](#build-environment-setup)
4. [Building the Application](#building-the-application)
5. [Creating Distribution Package](#creating-distribution-package)
6. [Testing the Distribution](#testing-the-distribution)
7. [Deployment to Target Systems](#deployment-to-target-systems)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## Overview

### What Gets Built

Dastyar AI is packaged as a **completely self-contained Windows application** with:

- **dastyar-ai.exe** (~50-100MB) - Main server with embedded Bun runtime, all Node.js dependencies, and SQLite database
- **whisper.exe** (~90MB) - Whisper transcription server with embedded whisper.cpp library and FFmpeg
- **web/** - Static HTML/CSS/JS frontend assets
- **Batch scripts** - User-friendly Windows launcher and management scripts

### Offline Deployment

✅ **No internet required** after initial setup
✅ **No external dependencies** - all libraries are statically linked or embedded
✅ **Portable** - can be copied to any Windows machine
✅ **Zero configuration** - works out of the box with sensible defaults

### Optional External Services

The following services are **optional** and must be installed separately on the target system:

- **Ollama** - For local LLM features (http://localhost:11434)
- **Automatic1111 Stable Diffusion WebUI** - For image generation (http://localhost:7860)
- **LM Studio** - Alternative local LLM (http://localhost:1234/v1)

The application will work without these services, but related features will be unavailable.

---

## Prerequisites

### For Building (Development Machine)

You need a **Windows 10/11 (64-bit)** machine with the following installed:

#### 1. Bun (JavaScript Runtime)

**Required Version**: 1.3.0 or later

**Installation**:
```powershell
# Using PowerShell (run as Administrator)
powershell -c "irm bun.sh/install.ps1|iex"
```

**Verify**:
```cmd
bun --version
```

**Alternative**: Download from https://bun.sh/

---

#### 2. Go (Programming Language)

**Required Version**: 1.23 or later

**Installation**:
1. Download installer from https://go.dev/dl/
2. Run the MSI installer
3. Follow the installation wizard

**Verify**:
```cmd
go version
```

---

#### 3. CMake (Build System)

**Required Version**: 3.15 or later

**Installation Options**:

**Option A: Using Chocolatey** (Recommended)
```cmd
# Install Chocolatey first if needed: https://chocolatey.org/install
choco install cmake
```

**Option B: Manual Install**
1. Download from https://cmake.org/download/
2. Run the installer
3. **Important**: Check "Add CMake to system PATH" during installation

**Verify**:
```cmd
cmake --version
```

---

#### 4. C++ Compiler

You need **one** of the following:

**Option A: MinGW-w64** (Recommended for simplicity)

**Installation**:
1. Download from https://winlibs.com/
2. Download the latest "UCRT runtime" version (e.g., `winlibs-x86_64-posix-seh-gcc-13.2.0-mingw-w64ucrt-11.0.1-r5.zip`)
3. Extract to `C:\mingw64`
4. Add to PATH: `C:\mingw64\bin`

**Verify**:
```cmd
g++ --version
```

**Option B: Visual Studio Build Tools**

**Installation**:
1. Download from https://visualstudio.microsoft.com/downloads/ (scroll to "Tools for Visual Studio")
2. Download "Build Tools for Visual Studio 2022"
3. Run installer and select:
   - ✅ Desktop development with C++
   - ✅ Windows 10/11 SDK

**Verify**:
```cmd
# Open "x64 Native Tools Command Prompt for VS 2022"
cl
```

---

#### 5. Git

**Required Version**: 2.0 or later

**Installation**:
1. Download from https://git-scm.com/download/win
2. Run installer
3. Use default settings (especially "Git Bash")

**Verify**:
```cmd
git --version
```

---

### For Target Systems (End Users)

**Required**:
- Windows 10/11 (64-bit)
- **That's it!** No other dependencies needed

**Optional** (for full AI features):
- Ollama: https://ollama.ai
- Stable Diffusion WebUI: https://github.com/AUTOMATIC1111/stable-diffusion-webui
- LM Studio: https://lmstudio.ai

---

## Build Environment Setup

### Step 1: Verify Prerequisites

Run this verification script to check all prerequisites:

```cmd
@echo off
echo Checking build prerequisites...
echo.

echo [1/5] Checking Bun...
where bun >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ Bun not found
    echo     Install from: https://bun.sh/
    set ERROR=1
) else (
    for /f "tokens=*" %%i in ('bun --version') do echo   ✓ Bun %%i
)

echo [2/5] Checking Go...
where go >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ Go not found
    echo     Install from: https://go.dev/dl/
    set ERROR=1
) else (
    for /f "tokens=3" %%i in ('go version') do echo   ✓ Go %%i
)

echo [3/5] Checking CMake...
where cmake >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ CMake not found
    echo     Install from: https://cmake.org/download/
    set ERROR=1
) else (
    for /f "tokens=3" %%i in ('cmake --version') do echo   ✓ CMake %%i
)

echo [4/5] Checking C++ compiler...
where g++ >nul 2>&1
if %errorlevel% neq 0 (
    where cl >nul 2>&1
    if %errorlevel% neq 0 (
        echo   ✗ C++ compiler not found
        echo     Install MinGW or Visual Studio Build Tools
        set ERROR=1
    ) else (
        echo   ✓ MSVC compiler found
    )
) else (
    for /f "tokens=*" %%i in ('g++ --version ^| findstr /C:"gcc"') do echo   ✓ %%i
)

echo [5/5] Checking Git...
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo   ✗ Git not found
    echo     Install from: https://git-scm.com/download/win
    set ERROR=1
) else (
    for /f "tokens=3" %%i in ('git --version') do echo   ✓ Git %%i
)

echo.
if defined ERROR (
    echo ✗ Some prerequisites are missing. Please install them and try again.
    exit /b 1
) else (
    echo ✓ All prerequisites are installed!
    echo You are ready to build Dastyar AI.
)
pause
```

Save this as `check-build-prerequisites.bat` and run it.

---

### Step 2: Clone the Repository

```cmd
cd C:\
git clone https://github.com/yourusername/dastyar-ai.git
cd dastyar-ai
```

Or if you already have the source code, navigate to the project directory:

```cmd
cd C:\path\to\dastyar-ai
```

---

### Step 3: Install JavaScript Dependencies

```cmd
bun install
```

This installs all Node.js/TypeScript dependencies for the server and web frontend.

**Expected Output**:
```
bun install v1.x.x
+ 1500 packages installed [2.5s]
```

---

## Building the Application

### Build Process Overview

The build process consists of 4 main steps:

1. **Web Frontend** → Static HTML/CSS/JS assets
2. **Server** → Standalone Windows executable with Bun runtime
3. **Whisper** → Go binary with embedded whisper.cpp and FFmpeg
4. **Assembly** → Package everything into `dist/` directory

---

### Step 1: Build Web Frontend

```cmd
cd apps\web
bun run build
cd ..\..
```

**What this does**:
- Compiles React 19 application using Vite
- Bundles all dependencies
- Generates static assets in `apps/web/dist/`

**Expected Output**:
```
vite v5.x.x building for production...
✓ 142 modules transformed
dist/index.html          0.5 kB
dist/assets/index.js     250 kB
✓ built in 3.2s
```

**Troubleshooting**:
- If you get TypeScript errors, run: `bun run check-types`
- If you get memory errors, increase Node memory: `set NODE_OPTIONS=--max-old-space-size=4096`

---

### Step 2: Build Server

```cmd
cd apps\server
bun run build:windows
cd ..\..
```

**What this does**:
- Bundles database migrations
- Compiles TypeScript to JavaScript
- Creates standalone executable with `bun build --compile`
- Embeds Bun runtime (~40MB)
- Bundles all Node.js dependencies
- Creates `apps/server/dist/dastyar-ai.exe`

**Expected Output**:
```
$ bun db:bundle
✓ Bundled migrations
$ bun build src/index.ts --compile --minify --target bun-windows-x64 --outfile ./dist/dastyar-ai.exe
  [1/3] Compiling...
  [2/3] Bundling...
  [3/3] Writing...
✓ Built dastyar-ai.exe (52.3 MB)
```

**Build Time**: ~30-60 seconds

**Troubleshooting**:
- If build fails with SQLite errors, run: `bun run db:generate`
- If target not supported: Update Bun to 1.3.0+

---

### Step 3: Build Whisper Server

This is the **most complex step** because it requires compiling C++ code.

```cmd
cd apps\whisper
build-windows.bat
cd ..\..
```

**What this does**:
1. Clones whisper.cpp repository (if not present)
2. Downloads FFmpeg binaries for Windows
3. Builds whisper.cpp static library using CMake
4. Compiles Go application with CGO
5. Embeds FFmpeg into the binary
6. Creates `apps/whisper/whisper.exe`

**Expected Output**:
```
=========================================
Building Whisper Server with whisper.cpp
=========================================

Checking for required tools...
  ✓ Go found
  ✓ CMake found
  ✓ C++ compiler found (MinGW)
  ✓ Git found

Cloning whisper.cpp...
  ✓ whisper.cpp cloned

Downloading ffmpeg binaries for embedding...
  ✓ ffmpeg binaries already downloaded

Building whisper.cpp library...
  ✓ whisper.cpp built successfully

Building Go whisper server...
  ✓ Build successful!

Binary created: whisper.exe
```

**Build Time**: 3-10 minutes (first time)

**Troubleshooting**:

**Problem**: CMake fails with "Could not find compiler"
```
Solution: Ensure C++ compiler is in PATH
For MinGW: set PATH=C:\mingw64\bin;%PATH%
For MSVC: Use "x64 Native Tools Command Prompt for VS 2022"
```

**Problem**: Go build fails with CGO errors
```
Solution: Ensure whisper.cpp built successfully first
Check that build_go/ directory exists and contains libwhisper.a
```

**Problem**: FFmpeg download fails
```
Solution: Download manually from:
https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
Extract ffmpeg.exe to apps/whisper/internal/ffmpeg/bin/ffmpeg-windows-amd64.exe
```

---

### Step 4: Assemble Distribution Package

```cmd
dist-windows.bat
```

**What this does**:
1. Verifies all binaries exist
2. Copies executables to `dist/`
3. Copies web assets to `dist/web/`
4. Copies batch scripts to `dist/`
5. Copies documentation to `dist/`
6. Creates models directory

**Expected Output**:
```
========================================
   Creating Windows Distribution
========================================

Copying batch files to dist...
  ✓ Batch files copied

Copying documentation to dist...
  ✓ Documentation copied

Checking for models...
  ⚠ Created models directory (empty)
  → Users will need to run download-whisper-models.bat

========================================
   Distribution Package Ready
========================================

Location: dist\

Contents:
  ✓ dastyar-ai.exe
  ✓ whisper.exe
  ✓ web\
  ✓ Batch scripts
  ✓ Documentation
  ⚠ models\ (may be empty)
```

---

### Step 5: (Optional) Download Whisper Models

If you want to bundle models with the distribution:

```cmd
cd dist
download-whisper-models.bat
```

**Model Selection**:
```
Available Whisper models:

1. tiny    (75MB   - Fastest, least accurate)
2. base    (142MB  - Balanced speed/accuracy) ← RECOMMENDED
3. small   (466MB  - Good accuracy)
4. medium  (1.5GB  - High accuracy)
5. large-v3(2.9GB  - Best accuracy)

Select model to download (1-6): 2
```

**Recommendation**: Choose option 2 (base model) for the best balance.

---

### Full Build Script

For convenience, here's a complete build script:

**build-all-windows.bat**:
```batch
@echo off
echo ========================================
echo    Building Dastyar AI for Windows
echo ========================================
echo.

REM Step 1: Install dependencies
echo [1/4] Installing JavaScript dependencies...
bun install
if %errorlevel% neq 0 goto :error

REM Step 2: Build web frontend
echo.
echo [2/4] Building web frontend...
cd apps\web
bun run build
if %errorlevel% neq 0 goto :error
cd ..\..

REM Step 3: Build server
echo.
echo [3/4] Building server...
cd apps\server
bun run build:windows
if %errorlevel% neq 0 goto :error
cd ..\..

REM Step 4: Build Whisper
echo.
echo [4/4] Building Whisper server...
cd apps\whisper
call build-windows.bat
if %errorlevel% neq 0 goto :error
cd ..\..

REM Step 5: Assemble distribution
echo.
echo Assembling distribution package...
call dist-windows.bat

echo.
echo ========================================
echo    ✓ Build Complete!
echo ========================================
goto :end

:error
echo.
echo ========================================
echo    ✗ Build Failed!
echo ========================================
echo Check the error messages above.
pause
exit /b 1

:end
pause
```

**Usage**:
```cmd
build-all-windows.bat
```

**Total Build Time**: 5-15 minutes (first build)

---

## Creating Distribution Package

### Option 1: ZIP Archive (Recommended)

```cmd
cd dist
powershell Compress-Archive -Path * -DestinationPath ..\dastyar-ai-windows.zip -Force
cd ..
```

**Result**: `dastyar-ai-windows.zip` (~140-200MB without models, ~280-340MB with base model)

---

### Option 2: Self-Extracting EXE (Advanced)

Using **7-Zip**:

1. Install 7-Zip: https://www.7-zip.org/
2. Create SFX archive:

```cmd
cd dist
"C:\Program Files\7-Zip\7z.exe" a -sfx dastyar-ai-installer.exe *
```

---

### Distribution Package Contents

```
dist/
├── dastyar-ai.exe              # Main server (50-100MB)
├── whisper.exe                 # Whisper server (90MB)
├── config.json                 # Configuration (auto-generated if missing)
├── web/                        # Web frontend assets
│   ├── index.html
│   └── assets/
│       ├── index-[hash].js
│       └── index-[hash].css
├── models/                     # Whisper models
│   └── ggml-base.bin          # (Optional, 142MB)
├── start-dastyar-ai.bat       # Main launcher
├── stop-dastyar-ai.bat        # Stop services
├── check-health.bat           # Health check
├── configure.bat              # Configuration helper
├── download-whisper-models.bat # Model downloader
├── verify-installation.bat    # Installation checker
├── README.md                  # User guide
├── QUICK-START.txt           # Quick reference
└── BUILD.md                  # Build instructions
```

---

## Testing the Distribution

### Local Testing

Before distributing, test the package on your build machine:

```cmd
cd dist
verify-installation.bat
```

**Expected Output**:
```
========================================
   Dastyar AI - Installation Verification
========================================

Checking installation...

[1/5] Checking executables...
  ✓ dastyar-ai.exe found
  ✓ whisper.exe found
[2/5] Checking web assets...
  ✓ web/ directory found with index.html
[3/5] Checking configuration...
  ⚠ config.json not found (will be created on first run)
[4/5] Checking Whisper models...
  ✓ Found 1 model(s) in models/
[5/5] Checking helper scripts...
  ✓ start-dastyar-ai.bat found
  ✓ stop-dastyar-ai.bat found
  ✓ download-whisper-models.bat found
  ✓ check-health.bat found
  ✓ configure.bat found

========================================
      ✓ Installation is complete and ready to use!
========================================
```

---

### Test Launch

```cmd
start-dastyar-ai.bat
```

**Expected Behavior**:
1. Console window opens showing startup logs
2. Whisper server starts on port 8080
3. Main server starts on port 3000
4. Browser opens automatically to http://localhost:3000
5. Web interface loads successfully

**Manual Test**:
1. Navigate to http://localhost:3000 in browser
2. Try uploading an audio file for transcription
3. Check that health endpoints respond:
   - http://localhost:3000/health
   - http://localhost:8080/health

---

### VM Testing (Recommended)

For thorough testing, use a **clean Windows 10/11 VM**:

1. Create a Windows VM (VirtualBox, Hyper-V, or VMware)
2. **DO NOT install any development tools**
3. Copy `dist/` folder or ZIP file to VM
4. Extract and run `verify-installation.bat`
5. Run `start-dastyar-ai.bat`
6. Test all features

This ensures the distribution truly has no external dependencies.

---

## Deployment to Target Systems

### Deployment Checklist

- [ ] Build completed successfully on Windows
- [ ] Distribution package created (ZIP or folder)
- [ ] Tested on build machine
- [ ] Tested on clean Windows VM
- [ ] Documentation included in package
- [ ] Whisper models included (or instructions provided)

---

### Installation Instructions for End Users

**For Users Receiving the Package**:

#### Step 1: Extract the Package

1. Extract `dastyar-ai-windows.zip` to a folder, e.g., `C:\dastyar-ai\`
2. **Important**: Choose a location where you have write permissions

#### Step 2: (Optional) Download Whisper Models

If models are not included:

1. Open the extracted folder
2. Double-click `download-whisper-models.bat`
3. Select option 2 (base model) for balanced performance
4. Wait for download to complete

#### Step 3: Start the Application

1. Double-click `start-dastyar-ai.bat`
2. Wait for services to start (~5-10 seconds)
3. Browser will open automatically to http://localhost:3000

#### Step 4: Verify Installation

If browser doesn't open automatically:
1. Double-click `check-health.bat`
2. If all checks pass, open http://localhost:3000 manually

---

### Network Access Configuration

**Default**: Application is accessible only from the local machine (127.0.0.1)

**To allow network access** (e.g., access from other computers):

1. Run `configure.bat`
2. Select option 2 (Server Host)
3. Enter: `0.0.0.0`
4. Restart the application

**Important**: Update Windows Firewall to allow incoming connections on ports 3000 and 8080.

---

### Windows Firewall Configuration

If users can't access the application from the network:

```powershell
# Run PowerShell as Administrator
New-NetFirewallRule -DisplayName "Dastyar AI - Main Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Dastyar AI - Whisper Server" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

---

### Running as a Windows Service (Advanced)

For production deployments where the application should start automatically:

**Using NSSM (Non-Sucking Service Manager)**:

1. Download NSSM: https://nssm.cc/download
2. Extract `nssm.exe` to `C:\nssm\`
3. Run as Administrator:

```cmd
cd C:\nssm
nssm install DastyarWhisper "C:\dastyar-ai\whisper.exe"
nssm install DastyarAI "C:\dastyar-ai\dastyar-ai.exe"

nssm start DastyarWhisper
timeout /t 3
nssm start DastyarAI
```

**To remove services**:
```cmd
nssm stop DastyarAI
nssm stop DastyarWhisper
nssm remove DastyarAI confirm
nssm remove DastyarWhisper confirm
```

---

## Troubleshooting

### Build Issues

#### Issue: "Bun not found"
```
Error: 'bun' is not recognized as an internal or external command
```

**Solution**:
1. Verify Bun installation: `bun --version`
2. If not installed, download from https://bun.sh/
3. Restart terminal after installation

---

#### Issue: "CMake configuration failed"
```
Error: CMake was unable to find a build program corresponding to "Ninja"
```

**Solution**:
1. Ensure C++ compiler is in PATH
2. For MinGW: `set PATH=C:\mingw64\bin;%PATH%`
3. For MSVC: Use "x64 Native Tools Command Prompt for VS 2022"

---

#### Issue: "Go build failed - CGO errors"
```
Error: undefined reference to `whisper_init_from_file`
```

**Solution**:
1. Ensure whisper.cpp built successfully
2. Check that `apps/whisper/whisper.cpp/build_go/` exists
3. Rebuild whisper.cpp:
   ```cmd
   cd apps\whisper\whisper.cpp
   rmdir /s /q build_go
   cd ..
   build-windows.bat
   ```

---

### Runtime Issues

#### Issue: "Services won't start"
```
Error: Port 3000/8080 already in use
```

**Solution**:
1. Check for conflicting processes:
   ```cmd
   netstat -ano | findstr :3000
   netstat -ano | findstr :8080
   ```
2. Kill conflicting processes:
   ```cmd
   taskkill /F /PID [PID_NUMBER]
   ```

---

#### Issue: "Whisper not working"
```
Error: No models found in models/ directory
```

**Solution**:
1. Download models:
   ```cmd
   download-whisper-models.bat
   ```
2. Or manually download from:
   https://huggingface.co/ggerganov/whisper.cpp/tree/main
3. Place `.bin` files in `models/` directory

---

#### Issue: "Database errors"
```
Error: Cannot open database file
```

**Solution**:
1. Ensure write permissions in application directory
2. Run as Administrator (one time to create database)
3. Or move to a location with write permissions (e.g., `C:\Users\YourName\dastyar-ai\`)

---

#### Issue: "Web interface not loading"
```
Error: 404 Not Found
```

**Solution**:
1. Verify `web/` directory exists and contains `index.html`
2. Check server logs for errors
3. Ensure `WEB_DIST_DIR` in config.json is set to `./web`

---

### Performance Issues

#### Issue: "Slow transcription"
```
Transcription takes several minutes for short audio
```

**Solutions**:
1. Use a smaller model (tiny or base)
2. Ensure running on SSD (not HDD)
3. Check CPU usage - Whisper is CPU-intensive
4. Consider upgrading hardware or using GPU acceleration (requires rebuild with CUDA support)

---

#### Issue: "High memory usage"
```
Application uses 2-4GB RAM
```

**Explanation**: This is normal behavior:
- Bun runtime: ~100MB
- Node.js dependencies: ~200MB
- Whisper model in memory: 150MB-3GB (depending on model)
- Active transcriptions: ~100-500MB

**Optimization**:
- Use smaller Whisper model (tiny or base)
- Restart application periodically to clear memory

---

## FAQ

### General Questions

**Q: Can I run this on Windows Server?**
A: Yes, Windows Server 2016 or later is supported.

**Q: Does this work offline?**
A: Yes, completely offline after initial setup. No internet required for core functionality.

**Q: Can I run multiple instances?**
A: Yes, but you need to change the ports in config.json for each instance.

**Q: What's the minimum system requirements?**
```
Minimum:
- Windows 10 64-bit
- 4GB RAM
- 2 CPU cores
- 5GB disk space (without models)

Recommended:
- Windows 10/11 64-bit
- 8GB+ RAM
- 4+ CPU cores
- 10GB disk space (with base model)
- SSD storage
```

---

### Technical Questions

**Q: Can I build on Windows and deploy to Linux?**
A: No, this guide is for Windows-only builds. For cross-platform builds, build on each target OS separately.

**Q: Can I customize the web interface?**
A: Yes, modify files in `apps/web/src/`, then rebuild:
```cmd
cd apps\web
bun run build
cd ..\..
dist-windows.bat
```

**Q: How do I update the application?**
A: Rebuild from source and replace the executables:
1. `git pull` to get latest changes
2. Run full build process
3. Replace `dastyar-ai.exe` and `whisper.exe`
4. Restart application

**Q: Can I use different Whisper models?**
A: Yes, download multiple models and switch in config.json:
```json
"WHISPER_MODELS": "base"  // or tiny, small, medium, large-v3
```

**Q: How do I enable GPU acceleration?**
A: This requires rebuilding whisper.cpp with CUDA support (NVIDIA GPUs) or OpenCL (AMD GPUs). This is an advanced topic not covered in this guide.

---

### Security Questions

**Q: Is the JWT_SECRET secure?**
A: The default JWT_SECRET is for development only. For production:
1. Run `configure.bat`
2. Select option 3 (JWT Secret)
3. Enter a strong random string (32+ characters)

**Q: Should I enable network access?**
A: Only if needed. For single-user local use, keep the default (127.0.0.1).

**Q: How do I secure the application?**
A: For production deployments:
1. Change JWT_SECRET
2. Set CORS_ORIGIN to your domain
3. Use a reverse proxy (nginx, IIS) with HTTPS
4. Configure Windows Firewall properly
5. Don't run as Administrator

---

## Additional Resources

### Official Documentation
- **Bun**: https://bun.sh/docs
- **Go**: https://go.dev/doc/
- **Whisper.cpp**: https://github.com/ggerganov/whisper.cpp
- **Vite**: https://vitejs.dev/

### Community Support
- GitHub Issues: [Your repository URL]
- Discord: [Your Discord URL]
- Documentation: See `WINDOWS-README.md` for user guide

### Related Files
- `WINDOWS-README.md` - End-user documentation
- `WINDOWS-QUICK-START.txt` - Quick reference card
- `WINDOWS-BUILD.md` - Technical build details
- `README.md` - General project information

---

## Appendix: Build Environment Variables

Advanced users can customize the build with environment variables:

```cmd
REM Skip dependency installation
set NO_INSTALL=1

REM Force Windows build
set BUILD_WINDOWS_SERVER=1

REM Set custom build directory
set BUILD_DIR=C:\custom-build

REM Increase Node.js memory for large builds
set NODE_OPTIONS=--max-old-space-size=4096

REM Then run build
bun run build:windows
```

---

## Appendix: Directory Structure

Understanding the project structure:

```
dastyar-ai/
├── apps/
│   ├── server/           # Hono/Bun server
│   │   ├── src/
│   │   ├── prisma/
│   │   └── dist/         # Built server binary
│   ├── web/              # React 19 frontend
│   │   ├── src/
│   │   └── dist/         # Built web assets
│   └── whisper/          # Go Whisper server
│       ├── internal/
│       ├── models/
│       ├── whisper.cpp/  # Git submodule
│       └── whisper.exe   # Built binary
├── dist/                 # Final distribution package
│   ├── dastyar-ai.exe
│   ├── whisper.exe
│   ├── web/
│   └── models/
├── scripts/              # Build scripts
│   └── build/
├── *.bat                 # Windows batch scripts
└── *.md                  # Documentation

Build outputs:
- apps/server/dist/dastyar-ai.exe → dist/dastyar-ai.exe
- apps/whisper/whisper.exe → dist/whisper.exe
- apps/web/dist/ → dist/web/
```

---

## Version History

**Version 1.0** (Current)
- Initial Windows deployment guide
- Covers Bun 1.3.0+, Go 1.23+
- Full offline deployment support
- Comprehensive troubleshooting

---

**Last Updated**: 2025
**Author**: Dastyar AI Team
**License**: See LICENSE file
