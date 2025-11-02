WhisperX Server (FastAPI)

Offline transcription server using WhisperX, served by FastAPI. Intended to be called by the Bun backend instead of using transformers.js.

Requirements
- Python 3.9+
- ffmpeg installed and on PATH (required by WhisperX)
- uv (https://docs.astral.sh/uv/)

Quick start

Development mode (with hot reload):
1) Change to apps/whisper directory and start the server:
   cd apps/whisper
   uv run fastapi dev api/main.py --port 8001

   Alternative from repo root:
   cd apps/whisper && uv run fastapi dev api/main.py --port 8001

Production mode:
1) Change to apps/whisper directory and start the server:
   cd apps/whisper
   uv run fastapi run api/main:app --port 8001 --host 0.0.0.0

   Alternative from repo root:
   cd apps/whisper && uv run fastapi run api/main:app --port 8001 --host 0.0.0.0

2) Health check:
   curl http://127.0.0.1:8001/health

3) Test the API:
   - Open http://127.0.0.1:8001/ in your browser for the interactive test page
   - Or transcribe via curl:
     curl -F "file=@./sample.wav" -F "model=tiny" -F "language=fa" http://127.0.0.1:8001/transcribe

Config (env)
- WHISPER_DEVICE: cpu|cuda (default cpu)
- WHISPER_DEFAULT_MODEL: tiny|base|small|medium|large|large-v2|large-v3 (default tiny)
- MAX_UPLOAD_MB: maximum upload size enforced for /transcribe (default 50)

Endpoints
- GET / -> Interactive HTML test page (upload or record audio)
- GET /health -> { status: "ok" }
- GET /models -> [{ id, name }]
- POST /transcribe (multipart/form-data):
  - file: audio file (webm/mp4/wav)
  - model: optional whisper model name (default tiny)
  - language: optional ISO 639-1 language code (e.g., fa, en)
  Returns: { text: "..." }

Docker (contained, no host deps)
- Build and run with Docker (CPU-only):
  - docker build -t whisperx-server -f apps/whisper/Dockerfile .
  - docker run -p 8001:8001 whisperx-server
  - Health: curl http://127.0.0.1:8001/health
  - Test page: http://127.0.0.1:8001/
  - Transcribe: curl -F "file=@./sample.wav" -F "model=tiny" -F "language=fa" http://127.0.0.1:8001/transcribe

Notes
- The container includes ffmpeg, PyTorch CPU, and whisperx; no host Python is required.
- Override defaults via environment variables: WHISPER_DEVICE, WHISPER_DEFAULT_MODEL, MAX_UPLOAD_MB.

Single binary build (no Docker)
- One-command builder (cross-platform):
  - bun run build:all
  - Result binaries in dist/: whisper[.exe]
- Run:
  - ./dist/whisper --host 0.0.0.0 --port 8001
- ffmpeg:
  - The unified builder auto-downloads a static ffmpeg per platform (disable with FF_SKIP_FFMPEG_DOWNLOAD=1).
  - To bundle a custom ffmpeg, place it at apps/whisper/bin/ before building.
- Models and cache:
  - WhisperX downloads and caches models via Hugging Face cache by default.
  - Cache is colocated in ./.whisper-cache (via XDG_CACHE_HOME).
  - Override with env: XDG_CACHE_HOME
