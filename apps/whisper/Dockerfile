# Containerized Whisper FastAPI server (CPU-only)
# Uses PyTorch CPU base to avoid manual torch builds and ensures ffmpeg availability.

FROM pytorch/pytorch:2.3.0-cpu

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System deps: ffmpeg required by Whisper
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first for better layer caching
# Note: openai-whisper pulls in required libs; base image already provides torch CPU
# fastapi[standard] includes uvicorn and fastapi-cli
RUN pip install --no-cache-dir \
      "fastapi[standard]>=0.115.0" \
      "openai-whisper>=1.1.10" \
      "pydantic-settings>=2.0.0" \
      "imageio-ffmpeg>=0.4.9" \
      "hazm>=0.7.0" \
      "numpy>=1.26.0" \
      "pandas>=2.1.1"

# Copy application code
COPY apps/whisper/api /app/api

# Default environment (can be overridden at runtime)
ENV WHISPER_DEVICE=cpu \
    WHISPER_DEFAULT_MODEL=tiny \
    MAX_UPLOAD_MB=50

EXPOSE 8001

# Start the API server using FastAPI CLI
CMD ["fastapi", "run", "api/main:app", "--host", "0.0.0.0", "--port", "8001"]
