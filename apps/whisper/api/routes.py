"""API routes for the WhisperX server."""

import logging
import tempfile
from pathlib import Path
import whisperx
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import HTMLResponse

from . import schemas
from .models import load_model, resolve_model_name
from .config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get(
    "/health",
    response_model=schemas.HealthResponse,
    summary="Health check",
    description="Check if the server is running",
)
async def health() -> schemas.HealthResponse:
    """Health check endpoint."""
    return schemas.HealthResponse(status="ok")


@router.get(
    "/",
    response_class=HTMLResponse,
    summary="Index page",
    description="Simple HTML test page for the whisper API",
)
async def index_page() -> HTMLResponse:
    """Serve the HTML index page."""
    html_content = Path(__file__).parent / "index.html"
    return HTMLResponse(content=html_content.read_text(encoding="utf-8"))


@router.get(
    "/models",
    response_model=list[schemas.ModelInfo],
    summary="List models",
    description="List available WhisperX-compatible models",
)
async def list_models() -> list[schemas.ModelInfo]:
    """List available WhisperX-compatible models."""
    from .models import get_available_models

    return get_available_models()


@router.post(
    "/transcribe",
    response_model=schemas.TranscribeResponse,
    summary="Transcribe audio",
    description="Transcribe an audio file using WhisperX",
    responses={
        400: {"model": schemas.ErrorResponse},
        413: {"model": schemas.ErrorResponse},
        500: {"model": schemas.ErrorResponse},
    },
)
async def transcribe(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    model: Optional[str] = Form(None, description="Model name (default: tiny)"),
    language: Optional[str] = Form(
        None, description="ISO 639-1 language code (e.g., 'en', 'fa')"
    ),
) -> schemas.TranscribeResponse:
    """Transcribe an audio file using WhisperX."""
    # Check file size
    file.file.seek(0, 2)  # Seek to end of file
    file_size = file.file.tell()
    file.file.seek(0)  # Reset file pointer

    if file_size > settings.MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_MB}MB",
        )

    # Resolve model name
    model_name = resolve_model_name(model)

    try:
        # Save the uploaded file to a temporary file
        suffix = Path(file.filename).suffix if getattr(file, "filename", None) else ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        try:
            # Load the model
            model, model_name = load_model(model_name)

            # Load audio and transcribe via WhisperX
            audio = whisperx.load_audio(temp_path)
            # On CPU keep small batch size; allow language override if provided
            result = model.transcribe(
                audio,
                batch_size=8 if settings.WHISPER_DEVICE == "cpu" else 16,
                language=language,
            )

            # WhisperX returns segments; build a single text for backward compatibility
            segments = result.get("segments") or []
            joined_text = " ".join(
                (s.get("text") or "").strip() for s in segments
            ).strip()

            return schemas.TranscribeResponse(
                text=joined_text,
            )

        finally:
            # Clean up the temporary file
            try:
                Path(temp_path).unlink(missing_ok=True)
            except Exception as e:
                logger.warning(f"Failed to delete temporary file {temp_path}: {e}")

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.exception("Transcription failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}",
        )


def setup_routes(app):
    """Set up API routes without a versioned prefix to preserve original paths."""
    app.include_router(router)
