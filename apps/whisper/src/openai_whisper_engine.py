import asyncio
import logging
import os
import sys
from functools import lru_cache
from typing import Dict, Optional

import torch
import whisper

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _get_device_cached() -> str:
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


# Cache for openai-whisper models
openai_model_cache: Dict[str, whisper.Whisper] = {}


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


def load_model(model_name: str):
    if model_name not in openai_model_cache:
        try:
            device = _get_device_cached()
            models_dir = get_models_directory()
            logger.info(f"Loading openai-whisper model '{model_name}' on '{device}' from '{models_dir}'")
            
            # Set environment variable for whisper model cache
            os.environ['WHISPER_CACHE_DIR'] = models_dir
            
            model = whisper.load_model(model_name, device=device)
            openai_model_cache[model_name] = model
            logger.info(f"openai-whisper model '{model_name}' loaded")
        except Exception as e:
            logger.error(f"Failed to load openai-whisper model '{model_name}': {e}")
            raise
    return openai_model_cache[model_name]


async def transcribe_audio_async(
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
