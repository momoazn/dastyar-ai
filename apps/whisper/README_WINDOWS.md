# Whisper API - Windows Quick Start

🎤 **OpenAI Whisper transcription service as a single Windows executable**

## Quick Build (Windows)

### Prerequisites
1. **Python 3.13+**: Download from [python.org](https://python.org)
2. **uv package manager**: Install with PowerShell:
   ```powershell
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```

### Build Steps
```batch
REM Double-click build.bat or run in Command Prompt:
build.bat

REM Or use PowerShell:
uv run python build.py
```

### Test the Executable
```batch
REM Run the executable
dist\whisper-api.exe

REM Open browser to: http://localhost:40002
REM Or test with curl:
curl http://localhost:40002/api/health
```

## File Structure After Build

```
whisper\
├── dist\
│   └── whisper-api.exe    (206MB - Complete standalone executable)
├── models\                (Optional - for additional models)
│   ├── base.pt
│   ├── small.pt
│   └── medium.pt
└── build files...
```

## Deployment

### Option 1: Tiny Model Only (206MB)
```batch
REM Copy just the executable
copy dist\whisper-api.exe C:\whisper\
C:\whisper\whisper-api.exe
```

### Option 2: Multiple Models
```batch
REM Copy executable and models
xcopy dist\whisper-api.exe C:\whisper\
xcopy models\ C:\whisper\models\ /E
C:\whisper\whisper-api.exe
```

## Windows-Specific Notes

### Security Warnings
- **Windows Defender SmartScreen**: Click "More info" → "Run anyway"
- **Antivirus Software**: May flag as suspicious - add to exclusions
- **Firewall**: Allow access to port 40002

### Performance
- **CPU Usage**: Uses all available CPU cores for transcription
- **Memory**: 500MB-2GB depending on model size
- **GPU Support**: Automatic CUDA detection if available

### Troubleshooting

**Build Issues:**
```batch
REM Install Visual C++ Build Tools if needed
winget install Microsoft.VisualStudio.2022.BuildTools

REM Clean and rebuild
rmdir /s dist build
uv run python build.py
```

**Runtime Issues:**
```batch
REM Check if port is available
netstat -an | findstr :40002

REM Allow through firewall
netsh advfirewall firewall add rule name="Whisper API" dir=in action=allow protocol=TCP localport=40002
```

## Features

✅ **Single Executable** - No Python or dependencies needed on target machine  
✅ **Web Interface** - Upload files via browser at `http://localhost:40002`  
✅ **REST API** - Programmatic access with JSON responses  
✅ **Multiple Models** - Tiny (fastest) to Large (most accurate)  
✅ **GPU Acceleration** - Automatic CUDA support when available  
✅ **Multi-format Support** - MP3, WAV, MP4, M4A, FLAC, OGG  

## API Usage Examples

### PowerShell
```powershell
# Health check
Invoke-RestMethod http://localhost:40002/api/health

# Transcribe audio file
$uri = "http://localhost:40002/api/transcribe"
$form = @{
    file = Get-Item "audio.mp3"
    model = "tiny"
    response_format = "json"
}
Invoke-RestMethod -Uri $uri -Method Post -Form $form
```

### Command Line (with curl)
```batch
REM Health check
curl http://localhost:40002/api/health

REM Transcribe
curl -X POST "http://localhost:40002/api/transcribe" ^
  -F "file=@audio.mp3" ^
  -F "model=tiny"
```

For detailed build instructions, see [WINDOWS_BUILD.md](WINDOWS_BUILD.md).