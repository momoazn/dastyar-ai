Whisper Server (FastAPI)

Simple offline transcription server using OpenAI Whisper, served by FastAPI. Intended to be called by the Bun backend instead of using transformers.js.

Requirements
- Python 3.9+
- ffmpeg installed and on PATH (required by Whisper)
- uv (https://docs.astral.sh/uv/)

Quick start
1) From repo root, start the server (uv will create a virtual environment automatically):
   uv run --directory apps/whisper-server uvicorn whisper_server.main:app --host 127.0.0.1 --port 8001

2) Health check:
   curl http://127.0.0.1:8001/health

3) Transcribe a wav file:
   curl -F "file=@./sample.wav" -F "model=tiny" -F "language=fa" http://127.0.0.1:8001/transcribe

Config (env)
- WHISPER_DEVICE: cpu|cuda (default cpu)
- WHISPER_DEFAULT_MODEL: tiny|base|small|medium|large|large-v2|large-v3 (default tiny)

Endpoints
- GET /health -> { status: "ok" }
- GET /models -> [{ id, name }]
- POST /transcribe (multipart/form-data):
  - file: audio file (webm/mp4/wav)
  - model: optional whisper model name (default tiny)
  - language: optional ISO 639-1 language code (e.g., fa, en)
  Returns: { text: "..." }

