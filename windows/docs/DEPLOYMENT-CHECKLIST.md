# Dastyar AI - Windows Deployment Checklist

Use this checklist to ensure a successful Windows deployment of Dastyar AI.

---

## Pre-Build Checklist

### Development Environment Setup

- [ ] **Windows 10/11 (64-bit)** build machine available
- [ ] **Bun 1.3.0+** installed and verified (`bun --version`)
- [ ] **Go 1.23+** installed and verified (`go version`)
- [ ] **CMake 3.15+** installed and verified (`cmake --version`)
- [ ] **C++ compiler** installed (MinGW-w64 or Visual Studio Build Tools)
- [ ] **Git** installed and verified (`git --version`)
- [ ] **10GB+ free disk space** available
- [ ] Project repository cloned or extracted
- [ ] Located in project root directory (has `package.json`)

**Quick Verification**:
```cmd
check-build-prerequisites.bat
```

---

## Build Process Checklist

### Step 1: Dependency Installation

- [ ] Run `bun install` in project root
- [ ] No errors during installation
- [ ] `node_modules/` directory created

### Step 2: Web Frontend Build

- [ ] Navigate to `apps/web/`
- [ ] Run `bun run build`
- [ ] Build completes without errors
- [ ] `apps/web/dist/` directory created
- [ ] `apps/web/dist/index.html` exists

**Build Command**:
```cmd
cd apps\web
bun run build
cd ..\..
```

### Step 3: Server Build

- [ ] Navigate to `apps/server/`
- [ ] Run `bun run build:windows`
- [ ] Build completes without errors
- [ ] `apps/server/dist/dastyar-ai.exe` created
- [ ] Binary size is reasonable (~50-100MB)

**Build Command**:
```cmd
cd apps\server
bun run build:windows
cd ..\..
```

### Step 4: Whisper Server Build

- [ ] Navigate to `apps/whisper/`
- [ ] Run `build-windows.bat`
- [ ] whisper.cpp repository cloned (if first build)
- [ ] FFmpeg binaries downloaded for Windows
- [ ] whisper.cpp library built successfully
- [ ] Go binary compiled without CGO errors
- [ ] `apps/whisper/whisper.exe` created
- [ ] Binary size is reasonable (~80-100MB)

**Build Command**:
```cmd
cd apps\whisper
build-windows.bat
cd ..\..
```

**Common Issues**:
- CMake configuration fails → Check C++ compiler in PATH
- CGO errors → Ensure whisper.cpp built successfully
- FFmpeg download fails → Download manually

### Step 5: Distribution Assembly

- [ ] Run `dist-windows.bat`
- [ ] All files copied to `dist/` successfully
- [ ] `dist/dastyar-ai.exe` exists
- [ ] `dist/whisper.exe` exists
- [ ] `dist/web/` directory exists
- [ ] `dist/web/index.html` exists
- [ ] All `.bat` scripts copied to `dist/`
- [ ] Documentation files copied to `dist/`
- [ ] `dist/models/` directory created

**Build Command**:
```cmd
dist-windows.bat
```

### Step 6: Optional - Download Models

- [ ] Navigate to `dist/`
- [ ] Run `download-whisper-models.bat`
- [ ] Select desired model (recommend option 2: base)
- [ ] Download completes successfully
- [ ] `.bin` file exists in `dist/models/`

**Model Selection Guide**:
- **tiny** (75MB) - Fastest, lowest accuracy
- **base** (142MB) - **Recommended** - Good balance
- **small** (466MB) - Better accuracy, slower
- **medium** (1.5GB) - High accuracy, much slower
- **large-v3** (2.9GB) - Best accuracy, very slow

---

## Testing Checklist

### Local Testing (Build Machine)

- [ ] Navigate to `dist/`
- [ ] Run `verify-installation.bat`
- [ ] All checks pass (executables, web assets, scripts)
- [ ] No critical errors reported

**Verification Command**:
```cmd
cd dist
verify-installation.bat
```

### Launch Test

- [ ] Run `start-dastyar-ai.bat`
- [ ] Whisper server starts (console shows startup messages)
- [ ] Main server starts (console shows startup messages)
- [ ] Browser opens automatically
- [ ] Web interface loads at http://localhost:3000
- [ ] No JavaScript errors in browser console

### Functional Tests

- [ ] Health endpoint responds: http://localhost:3000/health
- [ ] Whisper health responds: http://localhost:8080/health
- [ ] Can access web interface
- [ ] Can navigate between pages
- [ ] Upload test (if models available):
  - [ ] Upload a small audio file (.mp3, .wav, or .m4a)
  - [ ] Transcription starts
  - [ ] Transcription completes successfully
  - [ ] Text output is displayed

### Cleanup Test

- [ ] Run `stop-dastyar-ai.bat`
- [ ] Both services stop gracefully
- [ ] No orphaned processes (`tasklist | findstr "dastyar\|whisper"`)

### Health Check Test

- [ ] Start services again
- [ ] Run `check-health.bat`
- [ ] All 4 checks pass:
  - [ ] Whisper process running
  - [ ] Main server process running
  - [ ] Whisper API health endpoint responding
  - [ ] Main server health endpoint responding

---

## VM Testing Checklist (Recommended)

### VM Setup

- [ ] Create clean Windows 10/11 VM
- [ ] **DO NOT install development tools** (Bun, Go, etc.)
- [ ] Only install Windows updates
- [ ] VM has 4GB+ RAM
- [ ] VM has 10GB+ free disk space

### Distribution Testing

- [ ] Copy `dist/` folder to VM (or transfer ZIP file)
- [ ] If ZIP: Extract to `C:\dastyar-ai\`
- [ ] Run `verify-installation.bat`
- [ ] All checks pass (or only model warning)

### Installation Test

- [ ] Run `start-dastyar-ai.bat`
- [ ] Services start successfully
- [ ] Browser opens automatically
- [ ] Web interface loads correctly
- [ ] Check if config.json is auto-created

### Model Download Test (if not bundled)

- [ ] Run `download-whisper-models.bat`
- [ ] Select a model
- [ ] Download completes
- [ ] Model appears in `models/` directory
- [ ] Restart services
- [ ] Verify transcription works

### Offline Test

- [ ] **Disable VM network** (disconnect network adapter)
- [ ] Restart services
- [ ] Verify application still works
- [ ] Test transcription
- [ ] All features work (except those requiring external services)

**This is the most important test** - it verifies true offline capability!

---

## Distribution Package Checklist

### Package Contents Verification

Navigate to `dist/` and verify all files are present:

```
dist/
├── [ ] dastyar-ai.exe              (~50-100MB)
├── [ ] whisper.exe                 (~80-100MB)
├── [ ] config.json                 (optional, auto-generated)
├── [ ] web/
│   ├── [ ] index.html
│   └── [ ] assets/
│       ├── [ ] index-[hash].js
│       └── [ ] index-[hash].css
├── [ ] models/
│   └── [ ] ggml-base.bin          (optional, 142MB)
├── [ ] start-dastyar-ai.bat
├── [ ] stop-dastyar-ai.bat
├── [ ] check-health.bat
├── [ ] configure.bat
├── [ ] download-whisper-models.bat
├── [ ] verify-installation.bat
├── [ ] README.md
├── [ ] QUICK-START.txt
└── [ ] BUILD.md
```

### File Size Verification

Expected sizes (approximate):

- [ ] **dastyar-ai.exe**: 50-100MB
- [ ] **whisper.exe**: 80-100MB
- [ ] **web/ directory**: 1-5MB
- [ ] **models/ggml-base.bin** (if included): 142MB

**Total package size**:
- Without models: ~140-200MB
- With base model: ~280-340MB

### Creating Distribution Archive

- [ ] Navigate to parent directory
- [ ] Create ZIP archive:
  ```cmd
  powershell Compress-Archive -Path dist\* -DestinationPath dastyar-ai-windows.zip -Force
  ```
- [ ] Verify ZIP created successfully
- [ ] Test extracting ZIP
- [ ] Verify all files extracted correctly

### Alternative: Self-Extracting Archive (Optional)

If using 7-Zip for self-extracting EXE:

- [ ] 7-Zip installed
- [ ] Navigate to `dist/`
- [ ] Create SFX:
  ```cmd
  "C:\Program Files\7-Zip\7z.exe" a -sfx dastyar-ai-installer.exe *
  ```
- [ ] Test installer on clean VM
- [ ] Verify extraction works

---

## Documentation Checklist

### Included Documentation

Verify these files are in the distribution:

- [ ] **README.md** (WINDOWS-README.md renamed)
  - [ ] Contains user guide
  - [ ] Quick start instructions
  - [ ] Configuration guide
  - [ ] Troubleshooting section

- [ ] **QUICK-START.txt**
  - [ ] First-time setup steps
  - [ ] Starting/stopping instructions
  - [ ] Basic troubleshooting

- [ ] **BUILD.md** (Optional, for advanced users)
  - [ ] Build instructions
  - [ ] Technical details

### Additional Documentation (Optional)

- [ ] Create release notes (RELEASE-NOTES.md)
- [ ] Create changelog (CHANGELOG.md)
- [ ] Include license file (LICENSE.txt)
- [ ] Add version information

---

## Deployment Preparation Checklist

### Security Hardening

- [ ] Review default JWT_SECRET
- [ ] Document how to change JWT_SECRET for production
- [ ] Review CORS settings
- [ ] Document network security recommendations
- [ ] Include Windows Firewall configuration guide

### Configuration

- [ ] Verify default config.json values are sensible
- [ ] Test config auto-generation
- [ ] Test configure.bat interactive tool
- [ ] Document all configuration options
- [ ] Provide example configurations

### Performance Optimization

- [ ] Verify binaries are optimized/minified
- [ ] Check that unused dependencies aren't included
- [ ] Verify static assets are compressed
- [ ] Test cold start time (< 10 seconds)
- [ ] Test memory usage (< 500MB idle, < 2GB under load)

---

## Final Deployment Checklist

### Pre-Deployment

- [ ] All build steps completed successfully
- [ ] Local testing passed
- [ ] VM testing passed
- [ ] Offline testing passed
- [ ] Documentation reviewed and updated
- [ ] Version number updated (if applicable)
- [ ] Release notes created (if applicable)

### Distribution

- [ ] Distribution archive created (ZIP or EXE)
- [ ] Archive filename includes version (e.g., `dastyar-ai-v1.0-windows.zip`)
- [ ] Archive tested on clean Windows machine
- [ ] File hashes calculated (optional, for verification):
  ```cmd
  certutil -hashfile dastyar-ai-windows.zip SHA256
  ```

### Communication

- [ ] Installation instructions provided
- [ ] System requirements documented
- [ ] Support contact information included
- [ ] Known issues documented (if any)
- [ ] FAQ created or updated

### User Support

- [ ] Create quick start guide (QUICK-START.txt ✓)
- [ ] Create troubleshooting guide (in README.md ✓)
- [ ] Test installation instructions with fresh users
- [ ] Prepare support resources (email, Discord, etc.)

---

## Post-Deployment Checklist

### User Feedback

- [ ] Gather installation feedback
- [ ] Document common issues
- [ ] Update FAQ based on user questions
- [ ] Track bug reports

### Monitoring

- [ ] Monitor for Windows compatibility issues
- [ ] Check for performance problems on different hardware
- [ ] Verify offline functionality in real deployments

### Updates

- [ ] Plan update mechanism
- [ ] Document update procedure
- [ ] Test update process (replacing executables)

---

## Troubleshooting Checklist

If any issues arise during deployment, verify:

### Build Issues

- [ ] All prerequisites installed correctly
- [ ] Running in correct directory
- [ ] Sufficient disk space
- [ ] No port conflicts during build
- [ ] C++ compiler in system PATH
- [ ] Using correct terminal (CMD, not PowerShell for some commands)

### Runtime Issues

- [ ] Ports 3000 and 8080 available
- [ ] Windows Firewall allows applications
- [ ] Write permissions in application directory
- [ ] No antivirus blocking executables
- [ ] Whisper models present (if using transcription)

### Distribution Issues

- [ ] All files included in package
- [ ] File paths are relative (not absolute)
- [ ] Batch scripts use correct paths
- [ ] No hardcoded developer paths
- [ ] ZIP extraction doesn't corrupt files

---

## Sign-Off

Before deploying to production, ensure:

- [ ] **All critical tests passed**
- [ ] **Documentation complete and accurate**
- [ ] **Distribution package tested on clean Windows system**
- [ ] **Offline functionality verified**
- [ ] **User installation guide tested by non-technical user**
- [ ] **Support resources in place**

**Deployment Date**: _______________

**Tested By**: _______________

**Approved By**: _______________

**Notes**:
```
_____________________________________________________
_____________________________________________________
_____________________________________________________
```

---

## Quick Reference

### Essential Commands

**Check prerequisites**:
```cmd
check-build-prerequisites.bat
```

**Build everything**:
```cmd
build-all-windows.bat
```

**Create distribution**:
```cmd
dist-windows.bat
```

**Test installation**:
```cmd
cd dist
verify-installation.bat
```

**Test launch**:
```cmd
cd dist
start-dastyar-ai.bat
```

**Create ZIP**:
```cmd
powershell Compress-Archive -Path dist\* -DestinationPath dastyar-ai-windows.zip
```

---

## Support Resources

- **Deployment Guide**: WINDOWS-DEPLOYMENT-GUIDE.md
- **User Guide**: WINDOWS-README.md
- **Build Guide**: WINDOWS-BUILD.md
- **Quick Start**: WINDOWS-QUICK-START.txt

**Last Updated**: 2025
**Checklist Version**: 1.0
