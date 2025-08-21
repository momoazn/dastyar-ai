# Windows Build Guide for Whisper API

This guide explains how to build the Whisper API executable on Windows x86_64.

## Prerequisites

### Required Software

1. **Python 3.13+**

   ```powershell
   # Download from python.org or use winget
   winget install Python.Python.3.13
   ```

2. **uv Package Manager**

   ```powershell
   # Install uv
   powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
   ```

3. **Git** (if cloning repository)

   ```powershell
   winget install Git.Git
   ```

4. **Microsoft Visual C++ Build Tools** (for PyTorch compilation)

   ```powershell
   # Option 1: Visual Studio Community (recommended)
   winget install Microsoft.VisualStudio.2022.Community

   # Option 2: Build Tools only
   winget install Microsoft.VisualStudio.2022.BuildTools
   ```

### System Requirements

- **OS**: Windows 10/11 x86_64
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 5GB free space for build process
- **Internet**: Required for downloading dependencies

## Build Process

### 1. Prepare Environment

```powershell
# Clone or copy the repository
git clone <repository-url>
cd dastyar-ai\apps\whisper

# Or if you have the source code
cd path\to\whisper
```

### 2. Install Dependencies

```powershell
# Install Python dependencies
uv sync --group build

# Verify installation
uv run python --version
uv run python -c "import torch; print('PyTorch:', torch.__version__)"
```

### 3. Build Executable

```powershell
# Run the build script
uv run python build.py

# Alternative: Use npm/bun scripts if available
bun run build
```

### 4. Expected Output

```
🏗️  Building Whisper API Executable
==================================================
🧹 Cleaning previous build artifacts...
🔄 Installing build dependencies...
✅ Installing build dependencies completed
🔄 Creating executable...
✅ Creating executable completed
✅ Executable created successfully!
📁 Location: D:\path\to\whisper\dist\whisper-api.exe
📊 Size: 206.0 MB
🖥️  Platform: Windows AMD64

🎉 Build completed successfully!

📋 Next steps:
   1. Test the executable: .\dist\whisper-api.exe
   2. Copy models\ directory alongside the executable if needed
   3. Deploy the executable to your target environment

💡 Windows Notes:
   - Antivirus software may flag the executable - add to exclusions
   - Windows Defender SmartScreen may show a warning - click 'More info' → 'Run anyway'
   - Ensure Windows firewall allows the application on port 40002
```

## Testing the Executable

### 1. Quick Test

```powershell
# Run the executable
.\dist\whisper-api.exe

# Test in another terminal/PowerShell window
curl http://localhost:40002/api/health
```

### 2. Web Interface Test

1. Open browser to `http://localhost:40002`
2. You should see the Whisper Transcription API interface
3. Try uploading a small audio file

### 3. API Test

```powershell
# Test with curl (if available)
curl -X POST "http://localhost:40002/api/transcribe" -F "file=@test.mp3" -F "model=tiny"

# Or use Invoke-RestMethod
$uri = "http://localhost:40002/api/transcribe"
$form = @{
    file = Get-Item "test.mp3"
    model = "tiny"
}
Invoke-RestMethod -Uri $uri -Method Post -Form $form
```

## Deployment Structure

### Basic Deployment (Tiny Model Only)

```
C:\whisper\
└── whisper-api.exe    (206MB)
```

### Extended Deployment (Multiple Models)

```
C:\whisper\
├── whisper-api.exe    (206MB)
└── models\
    ├── base.pt        (74MB)
    ├── small.pt       (244MB)
    ├── medium.pt      (769MB)
    └── large.pt       (1550MB)
```

## Common Issues and Solutions

### 1. PyTorch Installation Issues

**Error**: `Could not find a version that satisfies the requirement torch`

**Solution**:

```powershell
# Install PyTorch separately first
uv add torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

### 2. Visual C++ Build Tools Missing

**Error**: `Microsoft Visual C++ 14.0 is required`

**Solution**: Install Visual Studio Build Tools

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
```

### 3. PyInstaller Hook Errors

**Error**: `ImportError: No module named 'win32api'`

**Solution**: Install additional Windows dependencies

```powershell
uv add pywin32
```

### 4. Antivirus False Positives

**Issue**: Antivirus deletes or quarantines the executable

**Solution**:

- Add the build directory to antivirus exclusions
- Temporarily disable real-time protection during build
- Submit executable to antivirus vendor for whitelisting

### 5. Windows Defender SmartScreen

**Issue**: "Windows protected your PC" message

**Solution**:

- Click "More info"
- Click "Run anyway"
- For deployment: Code sign the executable

### 6. Firewall Blocking

**Issue**: Cannot access `http://localhost:40002`

**Solution**:

```powershell
# Allow through Windows Firewall
netsh advfirewall firewall add rule name="Whisper API" dir=in action=allow protocol=TCP localport=40002
```

## Performance Optimization

### 1. CPU-Only Build (Smaller Size)

```powershell
# Install CPU-only PyTorch
uv add torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

### 2. GPU Support (CUDA)

```powershell
# Install CUDA-enabled PyTorch (larger size)
uv add torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

## Windows Service Installation

To run as a Windows service, create `whisper-service.py`:

```python
import win32serviceutil
import win32service
import win32event
import subprocess
import os

class WhisperService(win32serviceutil.ServiceFramework):
    _svc_name_ = "WhisperAPI"
    _svc_display_name_ = "Whisper Transcription API"
    _svc_description_ = "OpenAI Whisper audio transcription service"

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
        self.process = None

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        if self.process:
            self.process.terminate()
        win32event.SetEvent(self.hWaitStop)

    def SvcDoRun(self):
        self.process = subprocess.Popen([r"C:\whisper\whisper-api.exe"])
        win32event.WaitForSingleObject(self.hWaitStop, win32event.INFINITE)

if __name__ == '__main__':
    win32serviceutil.HandleCommandLine(WhisperService)
```

Install the service:

```powershell
python whisper-service.py install
python whisper-service.py start
```

## Security Considerations

1. **Code Signing**: Sign the executable to avoid SmartScreen warnings
2. **Firewall Rules**: Restrict access to necessary ports only
3. **User Permissions**: Run with minimal required privileges
4. **SSL/TLS**: Consider adding HTTPS support for production
5. **Input Validation**: Limit file upload sizes and types

## Troubleshooting

### Enable Debug Mode

```powershell
# Build with debug information
uv run pyinstaller whisper-api.spec --clean --debug=all
```

### Check Dependencies

```powershell
# List all dependencies
uv run python -c "import pkg_resources; [print(d) for d in pkg_resources.working_set]"
```

### System Information

```powershell
# Get system info for troubleshooting
systeminfo | findstr /C:"OS Name" /C:"OS Version" /C:"System Type"
python --version
uv --version
```
