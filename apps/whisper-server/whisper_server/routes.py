"""API routes for the Whisper server."""

import logging
import tempfile
from pathlib import Path
import torch
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

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
    "/models",
    response_model=list[schemas.ModelInfo],
    summary="List models",
    description="List available Whisper models",
)
async def list_models() -> list[schemas.ModelInfo]:
    """List available Whisper models."""
    from .models import get_available_models

    return get_available_models()


@router.post(
    "/transcribe",
    response_model=schemas.TranscribeResponse,
    summary="Transcribe audio",
    description="Transcribe an audio file using Whisper",
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
    """Transcribe an audio file using Whisper."""
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

            # Transcribe the audio
            result = model.transcribe(
                temp_path,
                language=language,
                fp16=torch.cuda.is_available() and settings.WHISPER_DEVICE == "cuda",
            )

            return schemas.TranscribeResponse(
                text=result["text"].strip(),
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
