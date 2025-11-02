"""OpenAI Whisper (python) engine: simple transcribe function.

This module provides a minimal API to run transcription with the official
OpenAI Whisper python package (https://github.com/openai/whisper).
It keeps the interface straightforward and avoids external framework coupling.

Usage:
  from .whisper_engine import transcribe
  text = transcribe("/path/to/audio.wav", model_name="small", language="fa", device="cpu")
"""

from __future__ import annotations

from typing import Any, Dict, Optional, Tuple
import threading
from ..text_normalize import normalize_persian

try:
    import torch  # type: ignore
except Exception as e:  # pragma: no cover - environment dependent
    raise ImportError(
        "PyTorch is required for OpenAI Whisper. Please install 'torch'."
    ) from e

try:
    import whisper  # type: ignore
except Exception as e:  # pragma: no cover - environment dependent
    raise ImportError(
        "OpenAI Whisper package not found. Please install 'openai-whisper'."
    ) from e


# Simple in-memory cache for loaded models keyed by (model_name, device)
_MODEL_CACHE: Dict[Tuple[str, str], Any] = {}
_CACHE_LOCK = threading.Lock()


def _normalize_device(device: Optional[str]) -> str:
    """Normalize device string to 'cpu' or 'cuda' depending on availability."""
    dev = (device or "cpu").strip().lower()
    if dev == "cuda" and torch.cuda.is_available():
        return "cuda"
    return "cpu"


def _get_or_load_model(model_name: str, device: str) -> Any:
    """Get a cached Whisper model or load it if missing."""
    key = (model_name, device)
    with _CACHE_LOCK:
        model = _MODEL_CACHE.get(key)
        if model is not None:
            return model

    # Load outside the lock to avoid blocking other threads during model load
    model = whisper.load_model(model_name, device=device)

    with _CACHE_LOCK:
        _MODEL_CACHE[key] = model
    return model


def transcribe(
    file_path: str,
    model_name: str = "tiny",
    language: Optional[str] = None,
    device: Optional[str] = None,
    initial_prompt: Optional[str] = None,
) -> str:
    """Transcribe an audio file with OpenAI Whisper (python) and return plain text.

    Args:
      file_path: Path to an audio file (e.g., .wav, .mp3, .m4a, .webm).
      model_name: Whisper model size (tiny, base, small, medium, large, large-v2, large-v3).
      language: Optional ISO 639-1 language code (e.g., 'fa', 'en'). If None, Whisper auto-detects.
      device: 'cpu' or 'cuda'. If 'cuda' requested but unavailable, it falls back to 'cpu'.
      initial_prompt: Optional text to guide transcription style and vocabulary. Particularly useful
                      for domain-specific terms, proper nouns, and technical vocabulary.

    Returns:
      A single string containing the transcribed text.

    Raises:
      ValueError: If transcription fails for any reason.
    """
    try:
        norm_device = _normalize_device(device)
        model = _get_or_load_model(model_name, norm_device)

        # fp16 is beneficial on CUDA, disable on CPU to avoid errors
        fp16 = norm_device == "cuda"

        # Build transcription parameters
        transcribe_params = {
            "language": language,
            "fp16": fp16,
            "temperature": 0.0,  # stable outputs for deterministic transcription
        }

        # Add initial_prompt if provided (helps with domain-specific vocabulary)
        if initial_prompt:
            transcribe_params["initial_prompt"] = initial_prompt

        result = model.transcribe(file_path, **transcribe_params)

        text = (result.get("text") or "").strip()

        # Light Persian-specific normalization
        if (language or "").lower().startswith("fa") and text:
            text = normalize_persian(text)

        return text
    except Exception as e:
        raise ValueError(f"Whisper transcription failed: {e}") from e


__all__ = ["transcribe"]
