"""Data models and Whisper model management."""

from typing import Dict, List, Optional, Tuple

import torch
import whisper
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
            name=f"OpenAI Whisper {model_id.replace('-', ' ').title()}",
        )
        for model_id in _MODEL_ALIASES
    ]


def resolve_model_name(name: Optional[str]) -> str:
    """Resolve a model name to a valid Whisper model name."""
    if not name:
        return settings.WHISPER_DEFAULT_MODEL
    return _MODEL_ALIASES.get(name.lower().strip(), name)


def load_model(name: str) -> Tuple[whisper.Whisper, str]:
    """Load a Whisper model with the given name.

    Args:
        name: Model name or alias

    Returns:
        A tuple of (model, model_name) where model_name is the resolved model name

    Raises:
        ValueError: If the model name is invalid or the model cannot be loaded
    """
    model_name = resolve_model_name(name)

    if model_name not in _MODEL_ALIASES:
        raise ValueError(f"Invalid model name: {name}")

    try:
        # Ensure models directory exists
        settings.MODELS_DIR.mkdir(parents=True, exist_ok=True)

        # Load the model
        device = (
            "cuda"
            if torch.cuda.is_available() and settings.WHISPER_DEVICE == "cuda"
            else "cpu"
        )
        model = whisper.load_model(
            name=model_name,
            download_root=str(settings.MODELS_DIR),
            device=device,
        )
        return model, model_name
    except Exception as e:
        raise ValueError(f"Failed to load model {name}: {str(e)}") from e
