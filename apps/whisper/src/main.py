import logging
import os
import tempfile
import time
from contextlib import asynccontextmanager
from enum import Enum
from functools import lru_cache
from typing import Optional

import torch
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel

from faster_whisper_engine import (
    faster_model_cache,
)
from faster_whisper_engine import (
    load_model as load_faster_model,
)
from faster_whisper_engine import (
    transcribe_audio_async as transcribe_faster_async,
)
from openai_whisper_engine import (
    load_model as load_openai_model,
)
from openai_whisper_engine import (
    openai_model_cache,
)
from openai_whisper_engine import (
    transcribe_audio_async as transcribe_openai_async,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Reduce noise from dependent libraries (Whisper/transformers/tqdm)
os.environ.setdefault("TQDM_DISABLE", "1")
logging.getLogger("whisper").setLevel(logging.ERROR)
logging.getLogger("transformers").setLevel(logging.ERROR)


class ModelSize(str, Enum):
    tiny = "tiny"
    base = "base"
    small = "small"
    medium = "medium"
    large = "large"
    large_v2 = "large-v2"
    large_v3 = "large-v3"


# Supported audio formats
SUPPORTED_FORMATS = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/m4a",
    "audio/mp4",
    "audio/flac",
    "audio/ogg",
    "audio/webm",
    "video/mp4",
    "video/webm",
}

# Caches live in engine modules; keep references for health/models endpoints


def get_device():
    """Get the best available device for inference"""
    if torch.cuda.is_available():
        return "cuda"
    else:
        return "cpu"


@lru_cache(maxsize=1)
def get_device_cached():
    return get_device()


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        load_faster_model("base")
        logger.info("Base model pre-loaded successfully")
    except Exception as e:
        logger.warning(f"Failed to pre-load base model: {str(e)}")
    yield


app = FastAPI(
    title="Whisper Transcription API",
    description="OpenAI Whisper-powered audio transcription service",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware to allow web interface
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_class=HTMLResponse)
async def serve_ui():
    return HTMLResponse(content=open("index.html").read())


@app.get("/api")
async def root():
    return {
        "message": "Whisper Transcription API",
        "docs": "/docs",
        "health": "/health",
        "ui": "/",
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    device = get_device_cached()
    return {
        "status": "healthy",
        "device": device,
        "cuda_available": torch.cuda.is_available(),
        "loaded_models": {
            "faster_whisper": list(faster_model_cache.keys()),
            "openai_whisper": list(openai_model_cache.keys()),
        },
    }


@app.get("/api/models")
async def list_models():
    """List available models"""
    return {
        "available_models": [model.value for model in ModelSize],
        "loaded_models": {
            "faster_whisper": list(faster_model_cache.keys()),
            "openai_whisper": list(openai_model_cache.keys()),
        },
        "model_info": {
            "tiny": {"size": "~39 MB", "speed": "fastest", "accuracy": "lowest"},
            "base": {"size": "~74 MB", "speed": "fast", "accuracy": "good"},
            "small": {"size": "~244 MB", "speed": "medium", "accuracy": "better"},
            "medium": {"size": "~769 MB", "speed": "slow", "accuracy": "high"},
            "large": {"size": "~1550 MB", "speed": "slowest", "accuracy": "best"},
            "large-v2": {
                "size": "~1550 MB",
                "speed": "slowest",
                "accuracy": "best (improved)",
            },
            "large-v3": {
                "size": "~1550 MB",
                "speed": "slowest",
                "accuracy": "best (latest)",
            },
        },
    }


class TranscribeRequest(BaseModel):
    """Request model for transcription parameters"""
    model: ModelSize = ModelSize.base
    language: Optional[str] = None
    response_format: str = "json"
    include_timestamps: bool = True
    engine: str = "faster"


@app.post("/api/transcribe")
async def transcribe_audio(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    request: TranscribeRequest = None,
):
    """
    Transcribe an audio file using OpenAI Whisper

    - **file**: Audio file (mp3, wav, m4a, flac, ogg, etc.)
    - **request**: Transcription parameters in JSON format
        - **model**: Whisper model size (tiny, base, small, medium, large, large-v2, large-v3)
        - **language**: Language code for the audio (optional, auto-detected if not provided)
        - **response_format**: Format of the response (json, text, verbose)
        - **include_timestamps**: Whether to include timestamps in the response
        - **engine**: Transcription engine: 'faster' or 'openai'
    """

    # Use default values if no request body is provided
    if request is None:
        request = TranscribeRequest()

    # Validate file type
    if file.content_type not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Supported formats: {', '.join(SUPPORTED_FORMATS)}",
        )

    # Validate language code if provided
    if request.language and len(request.language) != 2:
        raise HTTPException(
            status_code=400,
            detail="Language code must be 2 characters (e.g., 'en', 'es', 'fr')",
        )

    # Create temporary file
    temp_file = None
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=f".{file.filename.split('.')[-1]}"
        ) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Load the specified model based on engine
        if request.engine not in {"faster", "openai"}:
            raise HTTPException(
                status_code=400,
                detail="Invalid engine. Use 'faster' or 'openai'",
            )

        if request.engine == "faster":
            whisper_model = load_faster_model(request.model.value)
        else:
            whisper_model = load_openai_model(request.model.value)

        # Transcribe audio
        logger.info(
            f"Transcribing file '{file.filename}' with model '{request.model.value}', language: {request.language or 'auto-detect'}"
        )
        start_time = time.perf_counter()
        if request.engine == "faster":
            result = await transcribe_faster_async(
                whisper_model, temp_file_path, request.language
            )
        else:
            result = await transcribe_openai_async(
                whisper_model, temp_file_path, request.language
            )
        processing_ms = int((time.perf_counter() - start_time) * 1000)

        # Format response based on requested format
        if request.response_format == "text":
            return {"text": result["text"].strip()}

        elif request.response_format == "verbose":
            response = {
                "text": result["text"].strip(),
                "language": result["language"],
                "duration": result.get("segments", [{}])[-1].get("end", 0)
                if result.get("segments")
                else 0,
                "model_used": request.model.value,
                "processing_ms": processing_ms,
                "segments": [],
            }

            if request.include_timestamps and "segments" in result:
                for segment in result["segments"]:
                    response["segments"].append(
                        {
                            "start": segment["start"],
                            "end": segment["end"],
                            "text": segment["text"].strip(),
                        }
                    )

            return response

        else:  # json format (default)
            response = {
                "text": result["text"].strip(),
                "language": result["language"],
                "model_used": request.model.value,
                "processing_ms": processing_ms,
            }

            if request.include_timestamps and "segments" in result:
                response["segments"] = [
                    {
                        "start": segment["start"],
                        "end": segment["end"],
                        "text": segment["text"].strip(),
                    }
                    for segment in result["segments"]
                ]

            return response

    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    finally:
        # Clean up temporary file
        if temp_file and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)


@app.get("/api/languages")
async def supported_languages():
    """Get list of supported languages"""
    # Common language codes supported by Whisper
    languages = {
        "en": "English",
        "fa": "Persian",
    }

    return {
        "supported_languages": languages,
        "note": "Use the 2-letter language code as the 'language' parameter",
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("WHISPER_PORT", "40002"))
    print("🎤 Starting Whisper Transcription Service...")
    print(f"📱 Web UI: http://localhost:{port}")
    print(f"📚 API Docs: http://localhost:{port}/docs")
    print(f"🏥 Health Check: http://localhost:{port}/api/health")
    uvicorn.run(app, host="0.0.0.0", port=port)
