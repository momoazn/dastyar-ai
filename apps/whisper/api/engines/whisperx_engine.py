"""WhisperX engine: simple transcribe function.

This module provides a minimal, straightforward API to run transcription
with WhisperX. It intentionally keeps concerns local and avoids coupling
to FastAPI or external configuration. Callers should pass basic options
explicitly.
"""

from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

import threading

import torch
import whisperx

# Default batch sizes tuned lightly for CPU vs CUDA
_DEFAULT_BATCH_SIZE_CPU = 8
_DEFAULT_BATCH_SIZE_CUDA = 16

# Simple in-memory cache for loaded models keyed by (model_name, device, compute_type)
_MODEL_CACHE: Dict[Tuple[str, str, str], Any] = {}
_CACHE_LOCK = threading.Lock()


def _normalize_device(device: Optional[str]) -> str:
  """Normalize device string to 'cpu' or 'cuda' depending on availability."""
  dev = (device or "cpu").strip().lower()
  if dev == "cuda" and not torch.cuda.is_available():
    # Fallback to CPU if CUDA requested but not available
    return "cpu"
  return "cuda" if dev == "cuda" else "cpu"


def _compute_type_for_device(device: str) -> str:
  """Choose a safe compute type per device."""
  return "float16" if device == "cuda" else "int8"


def _get_or_load_model(model_name: str, device: str, compute_type: str) -> Any:
  """Get a cached WhisperX model or load it if missing."""
  key = (model_name, device, compute_type)
  with _CACHE_LOCK:
    model = _MODEL_CACHE.get(key)
    if model is not None:
      return model

  # Load outside the lock to avoid blocking other readers during download/load
  model = whisperx.load_model(model_name, device=device, compute_type=compute_type)

  with _CACHE_LOCK:
    _MODEL_CACHE[key] = model
  return model


def transcribe(
  file_path: str,
  model_name: str = "tiny",
  language: Optional[str] = None,
  device: Optional[str] = None,
) -> str:
  """Transcribe an audio file with WhisperX and return plain text.

  Args:
    file_path: Path to an audio file (e.g., .wav, .mp3, .m4a, .webm).
    model_name: WhisperX-compatible model name (e.g., tiny, base, small, medium, large, large-v2, large-v3).
    language: Optional ISO 639-1 language code (e.g., 'fa', 'en'). If None, WhisperX will auto-detect.
    device: 'cpu' or 'cuda'. If 'cuda' is requested but not available, it falls back to 'cpu'.

  Returns:
    A single string containing the transcribed text.

  Raises:
    ValueError: If transcription fails for any reason.
  """
  try:
    norm_device = _normalize_device(device)
    compute_type = _compute_type_for_device(norm_device)
    model = _get_or_load_model(model_name, norm_device, compute_type)

    audio = whisperx.load_audio(file_path)
    batch_size = _DEFAULT_BATCH_SIZE_CPU if norm_device == "cpu" else _DEFAULT_BATCH_SIZE_CUDA

    result = model.transcribe(
      audio,
      batch_size=batch_size,
      language=language,
    )

    segments = result.get("segments") or []
    text = " ".join((s.get("text") or "").strip() for s in segments).strip()
    return text
  except Exception as e:
    raise ValueError(f"WhisperX transcription failed: {e}") from e


__all__ = ["transcribe"]
