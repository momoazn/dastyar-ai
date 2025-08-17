import asyncio
import logging
import os
import sys
import tempfile
import time
from contextlib import asynccontextmanager
from enum import Enum
from functools import lru_cache
from typing import Dict, Optional

import torch
import whisper
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

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

openai_model_cache: Dict[str, whisper.Whisper] = {}


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
        load_openai_model("tiny")
        logger.info("Tiny model pre-loaded successfully")
    except Exception as e:
        logger.warning(f"Failed to pre-load tiny model: {str(e)}")
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


@app.get("/")
@app.get("/api")
async def index():
    return {
        "message": "Whisper Transcription API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    device = get_device_cached()
    return {
        "status": "healthy",
        "device": device,
        "cuda_available": torch.cuda.is_available(),
        "loaded_models": list(openai_model_cache.keys()),
    }


@app.get("/api/models")
async def list_models():
    """List available models"""
    return {
        "available_models": [model.value for model in ModelSize],
        "loaded_models": list(openai_model_cache.keys()),
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


@lru_cache(maxsize=1)
def _get_device_cached() -> str:
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def get_models_directory() -> str:
    """
    Get the models directory path. Checks for local models directory next to executable,
    falls back to bundled models directory, or creates local one.
    """
    if hasattr(sys, "_MEIPASS"):
        base_dir = os.path.dirname(sys.executable)
        bundled_models = os.path.join(sys._MEIPASS, "models")
    else:
        base_dir = os.path.dirname(os.path.dirname(__file__))
        bundled_models = os.path.join(base_dir, "models")

    local_models = os.path.join(base_dir, "models")

    if os.path.exists(local_models):
        logger.info(f"Using local models directory: {local_models}")
        return local_models
    elif hasattr(sys, "_MEIPASS") and os.path.exists(bundled_models):
        logger.info(f"Using bundled models directory: {bundled_models}")
        return bundled_models
    else:
        os.makedirs(local_models, exist_ok=True)
        logger.info(f"Created local models directory: {local_models}")
        return local_models


def load_openai_model(model_name: str):
    if model_name not in openai_model_cache:
        try:
            device = _get_device_cached()
            models_dir = get_models_directory()
            logger.info(
                f"Loading openai-whisper model '{model_name}' on '{device}' from '{models_dir}'"
            )
            os.environ["WHISPER_CACHE_DIR"] = models_dir
            model = whisper.load_model(model_name, device=device)
            openai_model_cache[model_name] = model
            logger.info(f"openai-whisper model '{model_name}' loaded")
        except Exception as e:
            logger.error(f"Failed to load openai-whisper model '{model_name}': {e}")
            raise
    return openai_model_cache[model_name]


async def transcribe_openai_async(
    model, audio_path: str, language: Optional[str] = None
):
    loop = asyncio.get_event_loop()

    def transcribe():
        transcribe_options = {}
        if language:
            transcribe_options["language"] = language
        result = model.transcribe(audio_path, **transcribe_options)

        segments = []
        for seg in result.get("segments", []) or []:
            segments.append(
                {
                    "start": seg.get("start"),
                    "end": seg.get("end"),
                    "text": (seg.get("text") or "").strip(),
                }
            )

        return {
            "text": (result.get("text") or "").strip(),
            "language": result.get("language") or language,
            "segments": segments,
        }

    return await loop.run_in_executor(None, transcribe)


@app.post("/api/transcribe")
async def transcribe_audio(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    model: ModelSize = Form(ModelSize.tiny, description="Whisper model size"),
    language: Optional[str] = Form(
        None, description="2-letter language code or omit for auto-detect"
    ),
    response_format: str = Form("json", description="json | text | verbose"),
    include_timestamps: bool = Form(True, description="Include segment timestamps"),
):
    """
    Transcribe an audio file using OpenAI Whisper

    Send as multipart/form-data with fields:
    - file: Audio file (mp3, wav, m4a, flac, ogg, etc.)
    - model: Whisper model size (tiny, base, small, medium, large, large-v2, large-v3)
    - language: Language code for the audio (optional, auto-detected if not provided)
    - response_format: Format of the response (json, text, verbose)
    - include_timestamps: Whether to include timestamps in the response
    """

    # Validate file type
    if file.content_type not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Supported formats: {', '.join(SUPPORTED_FORMATS)}",
        )

    # Validate language code if provided
    if language and len(language) != 2:
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

        # Load the specified model
        whisper_model = load_openai_model(model.value)

        # Transcribe audio
        logger.info(
            f"Transcribing file '{file.filename}' with model '{model.value}', language: {language or 'auto-detect'}"
        )
        start_time = time.perf_counter()
        result = await transcribe_openai_async(whisper_model, temp_file_path, language)
        processing_ms = int((time.perf_counter() - start_time) * 1000)

        # Format response based on requested format
        if response_format == "text":
            return {"text": result["text"].strip()}

        elif response_format == "verbose":
            response = {
                "text": result["text"].strip(),
                "language": result["language"],
                "duration": result.get("segments", [{}])[-1].get("end", 0)
                if result.get("segments")
                else 0,
                "model_used": model.value,
                "processing_ms": processing_ms,
                "segments": [],
            }

            if include_timestamps and "segments" in result:
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
                "model_used": model.value,
                "processing_ms": processing_ms,
            }

            if include_timestamps and "segments" in result:
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


# Get port from environment variable at module level
PORT = int(os.getenv("WHISPER_PORT", "40002"))

if __name__ == "__main__":
    import uvicorn

    print("🎤 Starting Whisper Transcription Service...")
    print(f"📱 Web UI: http://localhost:{PORT}")
    print(f"📚 API Docs: http://localhost:{PORT}/docs")
    print(f"🏥 Health Check: http://localhost:{PORT}/api/health")
    uvicorn.run(app, host="0.0.0.0", port=PORT)
