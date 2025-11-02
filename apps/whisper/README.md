Whisper Server (FastAPI)

Simple offline transcription server using OpenAI Whisper, served by FastAPI. Intended to be called by the Bun backend instead of using transformers.js.

Requirements
- Python 3.9+
- ffmpeg installed and on PATH (required by Whisper)
- uv (https://docs.astral.sh/uv/)

Quick start
1) From repo root, start the server (uv will create a virtual environment automatically):
   uv run --directory apps/whisper-server uvicorn whisper.main:app --host 127.0.0.1 --port 8001

2) Health check:
   curl http://127.0.0.1:8001/health

3) Transcribe a wav file:
   curl -F "file=@./sample.wav" -F "model=tiny" -F "language=fa" http://127.0.0.1:8001/transcribe

Config (env)
- WHISPER_DEVICE: cpu|cuda (default cpu)
- WHISPER_DEFAULT_MODEL: tiny|base|small|medium|large|large-v2|large-v3 (default tiny)
- MAX_UPLOAD_MB: maximum upload size enforced for /transcribe (default 50)

Endpoints
- GET /health -> { status: "ok" }
- GET /models -> [{ id, name }]
- POST /transcribe (multipart/form-data):
  - file: audio file (webm/mp4/wav)
  - model: optional whisper model name (default tiny)
  - language: optional ISO 639-1 language code (e.g., fa, en)
  Returns: { text: "..." }

Docker (contained, no host deps)
- Build and run with Docker Compose (CPU-only):
  - docker compose -f docker-compose.whisper.yml up --build
  - Health: curl http://127.0.0.1:8001/health
  - Transcribe: curl -F "file=@./sample.wav" -F "model=tiny" -F "language=fa" http://127.0.0.1:8001/transcribe

Notes
- The container includes ffmpeg, PyTorch CPU, and openai-whisper; no host Python is required.
- Override defaults via environment variables: WHISPER_DEVICE, WHISPER_DEFAULT_MODEL, MAX_UPLOAD_MB.

Single binary build (no Docker)
- One-command builder (cross-platform):
  - bun run build:all
  - Result binaries in dist/: whisper-server[.exe]
- Run:
  - ./dist/whisper-server --host 0.0.0.0 --port 8001
- ffmpeg:
  - The unified builder auto-downloads a static ffmpeg per platform (disable with FF_SKIP_FFMPEG_DOWNLOAD=1).
  - To bundle a custom ffmpeg, place it at apps/whisper-server/bin/ before building.
- Models and cache:
  - By default, models are stored/loaded from a local folder next to the executable: ./whisper-models
  - Cache is colocated in ./.whisper-cache
  - Override with env: WHISPER_MODELS_DIR, XDG_CACHE_HOME
