import asyncio
import logging
import os
import sys
from functools import lru_cache
from typing import Dict, Optional

import torch
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _get_device_cached() -> str:
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


# Cache for faster-whisper models
faster_model_cache: Dict[str, WhisperModel] = {}


def get_models_directory() -> str:
    """
    Get the models directory path. Checks for local models directory next to executable,
    falls back to bundled models directory, or creates local one.
    """
    # Get the directory where the executable/script is located
    if hasattr(sys, '_MEIPASS'):
        # Running as PyInstaller executable
        base_dir = os.path.dirname(sys.executable)
        bundled_models = os.path.join(sys._MEIPASS, 'models')
    else:
        # Running as script
        base_dir = os.path.dirname(os.path.dirname(__file__))  # Go up to app root
        bundled_models = os.path.join(base_dir, 'models')
    
    # Check for local models directory next to executable/script
    local_models = os.path.join(base_dir, 'models')
    
    if os.path.exists(local_models):
        logger.info(f"Using local models directory: {local_models}")
        return local_models
    elif hasattr(sys, '_MEIPASS') and os.path.exists(bundled_models):
        logger.info(f"Using bundled models directory: {bundled_models}")
        return bundled_models
    else:
        # Create local models directory for downloaded models
        os.makedirs(local_models, exist_ok=True)
        logger.info(f"Created local models directory: {local_models}")
        return local_models


def load_model(model_name: str) -> WhisperModel:
    if model_name not in faster_model_cache:
        try:
            device = _get_device_cached()
            models_dir = get_models_directory()
            logger.info(f"Loading faster-whisper model '{model_name}' on '{device}' from '{models_dir}'")
            model = WhisperModel(model_name, device=device, download_root=models_dir)
            faster_model_cache[model_name] = model
            logger.info(f"faster-whisper model '{model_name}' loaded")
        except Exception as e:
            logger.error(f"Failed to load faster-whisper model '{model_name}': {e}")
            raise
    return faster_model_cache[model_name]


async def transcribe_audio_async(
    model: WhisperModel, audio_path: str, language: Optional[str] = None
):
    loop = asyncio.get_event_loop()

    def transcribe():
        transcribe_options = {}
        if language:
            transcribe_options["language"] = language
        segments_generator, info = model.transcribe(audio_path, **transcribe_options)

        segments_list = []
        text_parts = []
        for seg in segments_generator:
            segments_list.append(
                {
                    "start": seg.start,
                    "end": seg.end,
                    "text": seg.text.strip(),
                }
            )
            if seg.text:
                text_parts.append(seg.text.strip())

        full_text = " ".join(text_parts).strip()

        return {
            "text": full_text,
            "language": language or getattr(info, "language", None),
            "segments": segments_list,
        }

    return await loop.run_in_executor(None, transcribe)
