# AI App - Complete Suite

This is a complete AI application suite bundled into a single executable.

## What's Included

- 🌐 **Web Frontend** - React-based user interface
- 🖥️ **Backend Server** - Bun-powered API server with database
- 🎤 **Whisper Service** - OpenAI Whisper audio transcription

## Quick Start

### Darwin

1. **Make executable:**
   ```bash
   chmod +x ai-app
   ```

2. **Run the application:**
   ```bash
   ./ai-app
   ```

3. **Or install as service:**
   ```bash
   sudo ./install.sh
   ```

3. **Access the application:**
   - Web Interface: http://localhost:40001
   - Whisper API: http://localhost:40002

## Features

✅ **Single Binary** - No dependencies required
✅ **Self-Contained** - All assets embedded
✅ **Cross-Platform** - Works on Windows, macOS, Linux
✅ **Auto-Setup** - Creates necessary directories and configs
✅ **Process Management** - Manages all services automatically
✅ **Graceful Shutdown** - Ctrl+C stops all services cleanly

## Configuration

The application creates a data directory at:
- macOS: ~/Library/Application Support/ai-app

Directory structure:
```
ai-app/
├── config/          # Configuration files
├── data/            # Database and application data
├── logs/            # Service logs
├── models/          # Whisper models (downloaded on demand)
└── uploads/         # Temporary file uploads
```

## Environment Variables

- `AI_APP_DATA_DIR` - Custom data directory
- `SERVER_PORT` - Web server port (default: 40001)
- `WHISPER_PORT` - Whisper API port (default: 40002)

## Version Information

- Version: 1.0.0
- Platform: darwin/arm64
- Build Date: Built with Go bundler

For support and updates, visit: https://github.com/your-org/ai-app
