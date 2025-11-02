"""API routes for the WhisperX server."""

import logging
import tempfile
from pathlib import Path

from typing import Annotated

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status, FastAPI
from fastapi.responses import HTMLResponse

from . import schemas
from .models import resolve_model_name
from .config import settings
from .engines.whisper_engine import transcribe as whisper_transcribe
from .engines.whisperx_engine import transcribe as whisperx_transcribe

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

    models = get_available_models()
    return [schemas.ModelInfo(id=m.id, name=m.name) for m in models]


@router.post(
    "/transcribe",
    response_model=schemas.TranscribeResponse,
    summary="Transcribe audio",
    description="Transcribe an audio file using WhisperX or OpenAI Whisper (selectable via 'engine')",
    responses={
        400: {"model": schemas.ErrorResponse},
        413: {"model": schemas.ErrorResponse},
        500: {"model": schemas.ErrorResponse},
    },
)
async def transcribe(
    file: Annotated[UploadFile, File(description="Audio file to transcribe")],
    model: Annotated[str | None, Form(description="Model name (default: tiny)")] = None,
    language: Annotated[
        str | None, Form(description="ISO 639-1 language code (e.g., 'en', 'fa')")
    ] = None,
    engine: Annotated[
        str | None,
        Form(description="Transcription engine: 'whisperx' (default) or 'whisper'"),
    ] = None,
) -> schemas.TranscribeResponse:
    """Transcribe an audio file using WhisperX."""
    # Check file size
    _ = file.file.seek(0, 2)  # Seek to end of file
    file_size = file.file.tell()
    _ = file.file.seek(0)  # Reset file pointer

    if file_size > settings.MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size: {settings.MAX_UPLOAD_MB}MB",
        )

    # Resolve model name
    model_name = resolve_model_name(model)

    temp_path: str | None = None
    try:
        # Save the uploaded file to a temporary file
        fname = file.filename or ""
        suffix = Path(fname).suffix if fname else ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await file.read()
            _ = temp_file.write(content)
            temp_path = temp_file.name

        try:
            # Select engine and transcribe
            selected_engine = (engine or "whisperx").lower().strip()
            device = "cuda" if settings.WHISPER_DEVICE == "cuda" else "cpu"

            if selected_engine == "whisper":
                text = whisper_transcribe(
                    temp_path,
                    model_name=model_name,
                    language=language,
                    device=device,
                )
            else:
                text = whisperx_transcribe(
                    temp_path,
                    model_name=model_name,
                    language=language,
                    device=device,
                )

            return schemas.TranscribeResponse(text=text)

        finally:
            # Clean up the temporary file
            try:
                if temp_path:
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


def setup_routes(app: FastAPI) -> None:
    """Set up API routes without a versioned prefix to preserve original paths."""
    app.include_router(router)
