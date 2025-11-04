"""Data models and Whisper model management."""

from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from .config import settings


class ModelInfo(BaseModel):
    """Information about an available Whisper model."""

    id: str = Field(..., description="Model identifier")
    name: str = Field(..., description="Human-readable model name")


# Model name aliases and pretty names
_MODEL_ALIASES: Dict[str, str] = {
    # Normalize incoming names to whisper.load_model() names
    "tiny": "tiny",
    "base": "base",
    "small": "small",
    "medium": "medium",
    "large": "large",
    "large-v2": "large-v2",
    "large-v3": "large-v3",
}


def get_available_models() -> List[ModelInfo]:
    """Get a list of available Whisper models."""
    return [
        ModelInfo(
            id=model_id,
            name=f"Whisper {model_id.replace('-', ' ').title()}",
        )
        for model_id in _MODEL_ALIASES
    ]


def resolve_model_name(name: Optional[str]) -> str:
    """Resolve a model name to a valid Whisper model name."""
    if not name:
        return settings.WHISPER_DEFAULT_MODEL
    return _MODEL_ALIASES.get(name.lower().strip(), name)
