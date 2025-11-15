# Windows Deployment Files

This directory contains all Windows-specific deployment files, scripts, and documentation for Dastyar AI.

---

## 📁 Directory Structure

```
windows/
├── scripts/              # Windows batch scripts
│   ├── build-all-windows.bat
│   ├── check-build-prerequisites.bat
│   ├── dist-windows.bat
│   ├── start-dastyar-ai.bat
│   ├── stop-dastyar-ai.bat
│   ├── check-health.bat
│   ├── configure.bat
│   ├── download-whisper-models.bat
│   └── verify-installation.bat
└── docs/                 # Windows documentation
    ├── WINDOWS-DEPLOYMENT-GUIDE.md
    ├── DEPLOYMENT-CHECKLIST.md
    ├── WINDOWS-BUILD.md
    ├── WINDOWS-README.md
    ├── WINDOWS-QUICK-START.txt
    └── WINDOWS-DEPLOYMENT-SUMMARY.md
```

---

## 🚀 Quick Start

### For Developers (Building)

```cmd
# 1. Verify prerequisites
cd windows\scripts
check-build-prerequisites.bat

# 2. Build everything
build-all-windows.bat

# 3. Package distribution
dist-windows.bat
```

**Full Guide**: See [docs/WINDOWS-DEPLOYMENT-GUIDE.md](docs/WINDOWS-DEPLOYMENT-GUIDE.md)

### For End Users (Using)

```cmd
# 1. Extract distribution package to a folder
# 2. (Optional) Download models
cd path\to\dastyar-ai
windows\scripts\download-whisper-models.bat

# 3. Start application
windows\scripts\start-dastyar-ai.bat
```

**Full Guide**: See [docs/WINDOWS-README.md](docs/WINDOWS-README.md)

---

## 📚 Documentation

### For Developers

1. **[docs/WINDOWS-DEPLOYMENT-GUIDE.md](docs/WINDOWS-DEPLOYMENT-GUIDE.md)** - Complete deployment guide
   - Prerequisites installation (Bun, Go, CMake, C++ compiler, Git)
   - Step-by-step build instructions
   - Troubleshooting guide
   - FAQ

2. **[docs/DEPLOYMENT-CHECKLIST.md](docs/DEPLOYMENT-CHECKLIST.md)** - Deployment checklist
   - Pre-build verification
   - Build process steps
   - Testing checklist
   - Distribution packaging

3. **[docs/WINDOWS-BUILD.md](docs/WINDOWS-BUILD.md)** - Technical build details
   - Cross-compilation notes
   - CI/CD integration

4. **[docs/WINDOWS-DEPLOYMENT-SUMMARY.md](docs/WINDOWS-DEPLOYMENT-SUMMARY.md)** - Quick overview
   - Architecture validation
   - Build status
   - Common issues

### For End Users

1. **[docs/WINDOWS-README.md](docs/WINDOWS-README.md)** - User guide
   - Installation instructions
   - Configuration guide
   - Feature documentation
   - Troubleshooting

2. **[docs/WINDOWS-QUICK-START.txt](docs/WINDOWS-QUICK-START.txt)** - Quick reference
   - Essential commands
   - First-time setup
   - Quick troubleshooting

---

## 🔧 Build Scripts

Located in **[scripts/](scripts/)**:

### For Developers

| Script | Purpose |
|--------|---------|
| `check-build-prerequisites.bat` | Verify build environment (Bun, Go, CMake, etc.) |
| `build-all-windows.bat` | Build all components (web + server + whisper) |
| `dist-windows.bat` | Assemble distribution package |

### For End Users (Included in Distribution)

| Script | Purpose |
|--------|---------|
| `start-dastyar-ai.bat` | Launch the application |
| `stop-dastyar-ai.bat` | Stop all services |
| `check-health.bat` | Verify services are running |
| `configure.bat` | Interactive configuration tool |
| `download-whisper-models.bat` | Download Whisper models |
| `verify-installation.bat` | Verify installation completeness |

---

## 📦 What Gets Built

### Self-Contained Binaries

- **dastyar-ai.exe** (~50-100MB)
  - Embedded Bun runtime
  - All Node.js dependencies bundled
  - SQLite database engine included

- **whisper.exe** (~80-100MB)
  - Go binary with whisper.cpp
  - Embedded FFmpeg for Windows
  - No external dependencies

- **web/** (~1-5MB)
  - Static HTML/CSS/JS
  - Pre-built React 19 application

### Distribution Size

- **Without models**: ~140-200MB
- **With base model**: ~280-340MB

---

## ✅ Deployment Features

- ✅ **Fully offline**: No internet required after setup
- ✅ **No dependencies**: Everything is self-contained
- ✅ **Portable**: Copy folder and run anywhere
- ✅ **Zero configuration**: Auto-generates config on first run
- ✅ **User-friendly**: Batch scripts for all operations

---

## 🎯 Build Requirements

### Development Machine

**Software**:
- Windows 10/11 (64-bit)
- Bun 1.3.0+
- Go 1.23+
- CMake 3.15+
- C++ compiler (MinGW-w64 or Visual Studio Build Tools)
- Git

**Hardware**:
- 4GB+ RAM
- 10GB free disk space
- 2+ CPU cores

**Installation time**: 30-60 minutes
**Build time**: 5-15 minutes

### Target System (End User)

**Software**:
- Windows 10/11 (64-bit)
- **That's it! No other dependencies needed**

**Hardware**:
- 4GB+ RAM
- 5GB free disk space

---

## 📞 Support

- **Full Documentation**: [docs/WINDOWS-DEPLOYMENT-GUIDE.md](docs/WINDOWS-DEPLOYMENT-GUIDE.md)
- **Quick Start**: [docs/WINDOWS-QUICK-START.txt](docs/WINDOWS-QUICK-START.txt)
- **Troubleshooting**: [docs/WINDOWS-DEPLOYMENT-GUIDE.md](docs/WINDOWS-DEPLOYMENT-GUIDE.md#troubleshooting)
- **Main Project**: [../README.md](../README.md)

---

**Last Updated**: 2025
**Platform**: Windows 10/11 (64-bit)
