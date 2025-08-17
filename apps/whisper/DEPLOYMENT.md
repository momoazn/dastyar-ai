# Whisper API Deployment Guide

## Executable Overview

The `whisper-api` executable is a self-contained binary that includes:
- ✅ Python interpreter
- ✅ All dependencies (FastAPI, PyTorch, etc.)
- ✅ Tiny Whisper model (built-in)
- ✅ Web UI

## Deployment Options

### Option 1: Tiny Model Only (250MB)

For basic transcription needs with fastest startup:

```bash
# Copy executable to target
scp dist/whisper-api user@server:/opt/
chmod +x /opt/whisper-api

# Run directly
/opt/whisper-api
```

**Features:**
- Tiny model only (~39MB, fastest speed, lowest accuracy)
- No additional setup required
- Smallest deployment footprint

### Option 2: Multiple Models (250MB + models)

For better accuracy with multiple model options:

```bash
# Copy executable and models
scp dist/whisper-api user@server:/opt/whisper/
scp -r models/ user@server:/opt/whisper/

# Deployment structure
/opt/whisper/
├── whisper-api          # 250MB executable
└── models/              # Additional models
    ├── base.pt         # ~74MB
    ├── small.pt        # ~244MB  
    ├── medium.pt       # ~769MB
    └── large.pt        # ~1550MB
```

**Features:**
- All model sizes available via API
- Models loaded on-demand from local directory
- Users can select model size for speed/accuracy tradeoff

## Model Loading Behavior

The executable uses this priority order:

1. **Local models directory** - `./models/` next to executable
2. **Bundled tiny model** - Fallback if no local models
3. **Download on demand** - Creates `./models/` and downloads if needed

## Example API Usage

```bash
# Start the service
./whisper-api

# Use tiny model (bundled)
curl -X POST "http://localhost:40002/api/transcribe" \
  -F "file=@audio.mp3" \
  -F 'request={"model":"tiny"}'

# Use base model (from local models directory)
curl -X POST "http://localhost:40002/api/transcribe" \
  -F "file=@audio.mp3" \
  -F 'request={"model":"base"}'
```

## Production Deployment

### Systemd Service

Create `/etc/systemd/system/whisper-api.service`:

```ini
[Unit]
Description=Whisper Transcription API
After=network.target

[Service]
Type=simple
User=whisper
WorkingDirectory=/opt/whisper
ExecStart=/opt/whisper/whisper-api
Environment=WHISPER_PORT=40002
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable whisper-api
sudo systemctl start whisper-api
```

### Docker Deployment

```dockerfile
FROM scratch
COPY dist/whisper-api /whisper-api
COPY models/ /models/
EXPOSE 40002
ENTRYPOINT ["/whisper-api"]
```

### Reverse Proxy (Nginx)

```nginx
location /whisper/ {
    proxy_pass http://localhost:40002/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    client_max_body_size 100M;  # Allow large audio files
}
```

## Resource Requirements

### Minimum Requirements
- **CPU**: 1 core (tiny model)
- **RAM**: 512MB (tiny model)
- **Disk**: 300MB (executable + tiny model)

### Recommended for Multiple Models
- **CPU**: 2+ cores
- **RAM**: 2GB+ (larger models need more memory)
- **Disk**: 3GB+ (executable + all models)
- **GPU**: Optional (CUDA support for faster inference)

## Security Considerations

- Run as non-root user
- Limit file upload sizes
- Use firewall to restrict access
- Consider authentication for production use
- Monitor resource usage to prevent abuse

## Monitoring

Check service status:
```bash
# Service health
curl http://localhost:40002/api/health

# Available models
curl http://localhost:40002/api/models

# System resources
ps aux | grep whisper-api
```