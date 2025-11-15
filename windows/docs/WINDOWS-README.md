# Dastyar AI - Windows User Guide

This guide covers using Dastyar AI on Windows as a standalone, offline-capable application.

**For Developers**: See [WINDOWS-DEPLOYMENT-GUIDE.md](WINDOWS-DEPLOYMENT-GUIDE.md) for complete build and deployment instructions.

## 📦 What's Included

- `dastyar-ai.exe` - Main server with embedded Bun runtime
- `whisper.exe` - Whisper transcription API server (Go binary with embedded FFmpeg)
- `web/` - Static web frontend assets
- `start-dastyar-ai.bat` - Launcher script
- `stop-dastyar-ai.bat` - Stop services script
- `download-whisper-models.bat` - Download Whisper models
- `check-health.bat` - Health check script
- `configure.bat` - Configuration helper

## 🚀 Quick Start

### 1. First-Time Setup

1. **Download Whisper Models** (required for transcription):
   ```cmd
   download-whisper-models.bat
   ```
   Select a model (recommended: `base` for balanced speed/accuracy)

2. **Configure** (optional):
   ```cmd
   configure.bat
   ```
   Or manually edit `config.json`

### 2. Start the Application

```cmd
start-dastyar-ai.bat
```

This will:
- Start the Whisper API server on port 8080
- Start the main server on port 3000
- Open the web interface automatically

### 3. Access the Application

Open your browser and navigate to: **http://localhost:3000**

## 📋 System Requirements

- **Windows 10/11** (64-bit)
- **No internet connection required** after initial setup
- **No additional dependencies** - all binaries are self-contained

### Optional Services (for full functionality)

For complete AI features, you may want to install:

- **Ollama** (local LLM): https://ollama.ai
  - Default URL: `http://localhost:11434`
  - Can be configured in `config.json`

- **Stable Diffusion WebUI** (image generation): https://github.com/AUTOMATIC1111/stable-diffusion-webui
  - Default URL: `http://localhost:7860`
  - Can be configured in `config.json`

- **LM Studio** (alternative local LLM): https://lmstudio.ai
  - Default URL: `http://localhost:1234/v1`
  - Can be configured in `config.json`

These are **optional** - the app will work without them, but some features will be unavailable.

## 📁 Directory Structure

```
dastyar-ai/
├── dastyar-ai.exe          # Main server binary
├── whisper.exe             # Whisper API server
├── config.json             # Configuration file
├── data.db                 # SQLite database (created on first run)
├── models/                 # Whisper model files (.bin)
│   ├── ggml-base.bin
│   └── ...
├── web/                    # Web frontend assets
│   ├── index.html
│   └── assets/
├── generated-images/       # AI-generated images (created automatically)
├── uploaded-documents/     # Uploaded documents for RAG (created automatically)
├── start-dastyar-ai.bat    # Launcher
├── stop-dastyar-ai.bat     # Stop services
├── download-whisper-models.bat
├── check-health.bat
└── configure.bat
```

## ⚙️ Configuration

### Using the Configuration Helper

```cmd
configure.bat
```

This interactive script helps you configure:
- Server port and host
- JWT secret (for production)
- Whisper server URL
- Optional AI services (Ollama, LM Studio, Stable Diffusion)

### Manual Configuration

Edit `config.json` directly. Key settings:

```json
{
  "PORT": 3000,                    // Main server port
  "HOST": "127.0.0.1",            // Server host (use 0.0.0.0 for network access)
  "JWT_SECRET": "...",            // Change this for production!
  "WHISPER_SERVER_URL": "http://127.0.0.1:8080",
  "OLLAMA_BASE_URL": "http://localhost:11434",
  "OLLAMA_ENABLED": true,
  "STABLE_DIFFUSION_URL": "http://localhost:7860",
  "STABLE_DIFFUSION_ENABLED": true
}
```

## 🔧 Available Scripts

### `start-dastyar-ai.bat`
Starts both Whisper and main server. The main server runs in the foreground - closing the window stops both services.

### `stop-dastyar-ai.bat`
Stops both services if they're running.

### `download-whisper-models.bat`
Interactive script to download Whisper models from HuggingFace. Requires internet connection.

### `check-health.bat`
Checks if both services are running and responding correctly.

### `configure.bat`
Interactive configuration helper for `config.json`.

## 🏥 Health Checks

Check if services are running:

```cmd
check-health.bat
```

Or manually check:
- Whisper API: http://localhost:8080/health
- Main server: http://localhost:3000/health

## 🔒 Security Considerations

### For Production Use

1. **Change JWT_SECRET**: Use a strong random string (minimum 32 characters)
   ```json
   "JWT_SECRET": "your-very-long-random-secret-key-here-min-32-chars"
   ```

2. **Update CORS_ORIGIN**: Restrict to your domain
   ```json
   "CORS_ORIGIN": "https://yourdomain.com"
   ```

3. **Use a reverse proxy**: For HTTPS, use nginx, Caddy, or IIS as a reverse proxy

4. **Firewall**: Only expose necessary ports (3000, 8080)

5. **Run as non-admin**: Don't run the application as Administrator

## 🐛 Troubleshooting

### Services Won't Start

1. **Check if ports are in use**:
   ```cmd
   netstat -ano | findstr :3000
   netstat -ano | findstr :8080
   ```

2. **Check Windows Firewall**: Ensure ports 3000 and 8080 are allowed

3. **Check logs**: Look for error messages in the console

### Whisper Not Working

1. **Check if models exist**: Ensure `.bin` files are in the `models/` directory
2. **Check Whisper server**: Visit http://localhost:8080/health
3. **Verify config**: Check `WHISPER_SERVER_URL` in `config.json`

### Database Errors

1. **Reset database**: Delete `data.db` (⚠️ this deletes all data)
2. **Check permissions**: Ensure write permissions in the application directory

### Can't Connect to Optional Services

1. **Check if service is running**: Verify Ollama/Stable Diffusion/LM Studio is running
2. **Check URLs**: Verify URLs in `config.json` match your service URLs
3. **Disable if not needed**: Set `*_ENABLED: false` in `config.json`

## 📦 Offline Deployment

This application is designed for **offline use**:

✅ **No internet required** after initial setup:
- All binaries are self-contained
- FFmpeg is embedded in whisper.exe
- Web assets are static files
- SQLite database is local

⚠️ **Internet required only for**:
- Initial Whisper model download (one-time)
- Optional: Downloading Ollama models (if using Ollama)

### Creating an Offline Distribution

1. Build the application (see BUILD.md)
2. Download Whisper models using `download-whisper-models.bat`
3. Bundle everything in a folder:
   - All `.exe` files
   - `web/` directory
   - `models/` directory (with model files)
   - All `.bat` scripts
   - `config.json`
4. Distribute the entire folder

## 🔄 Running as a Windows Service

To run as a Windows service (optional), use a service wrapper like NSSM:

1. Download NSSM: https://nssm.cc/download
2. Install Whisper as a service:
   ```cmd
   nssm install DastyarWhisper "C:\path\to\whisper.exe"
   ```
3. Install main server as a service:
   ```cmd
   nssm install DastyarAI "C:\path\to\dastyar-ai.exe"
   ```
4. Start services:
   ```cmd
   nssm start DastyarWhisper
   nssm start DastyarAI
   ```

## 📝 Ports Used

- **3000** - Main server + Web UI
- **8080** - Whisper API server

These can be changed in `config.json`.

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review logs in the console
3. Check the main project repository

## 📄 License

See the main project repository for license information.

