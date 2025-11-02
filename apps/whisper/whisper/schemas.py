"""API request and response schemas."""

from typing import Optional

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str = Field(..., example="ok")


class ModelInfo(BaseModel):
    """Model information schema."""

    id: str = Field(..., example="tiny", description="Model identifier")
    name: str = Field(..., example="Tiny", description="Human-readable model name")


class TranscribeRequest(BaseModel):
    """Transcription request schema."""

    model: Optional[str] = Field(
        default=None,
        example="tiny",
        description="Model name (tiny, base, small, medium, large, large-v2, large-v3)",
    )
    language: Optional[str] = Field(
        default=None,
        example="fa",
        description="ISO 639-1 language code (e.g., 'en', 'fa')",
    )


class TranscribeResponse(BaseModel):
    """Transcription response schema (backward-compatible: only text)."""

    text: str = Field(
        ..., example="This is a test transcription.", description="Transcribed text"
    )


class ErrorResponse(BaseModel):
    """Error response schema."""

    detail: str = Field(..., example="Error message")
