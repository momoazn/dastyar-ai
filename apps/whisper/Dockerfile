# Containerized Whisper FastAPI server (CPU-only)
# Uses PyTorch CPU base to avoid manual torch builds and ensures ffmpeg availability.

FROM pytorch/pytorch:2.3.0-cpu

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# System deps: ffmpeg required by openai-whisper
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first for better layer caching
RUN pip install --no-cache-dir \
      fastapi==0.115.0 \
      "uvicorn[standard]"==0.30.0 \
      openai-whisper==20231117

# Copy application code
COPY apps/whisper-server/whisper /app/whisper

# Default environment (can be overridden at runtime)
ENV WHISPER_DEVICE=cpu \
    WHISPER_DEFAULT_MODEL=tiny \
    MAX_UPLOAD_MB=50

EXPOSE 8001

# Start the API server
CMD ["uvicorn", "whisper.main:app", "--host", "0.0.0.0", "--port", "8001"]

