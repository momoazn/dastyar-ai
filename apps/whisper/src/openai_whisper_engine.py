import asyncio
import logging
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


def load_model(model_name: str):
    if model_name not in openai_model_cache:
        try:
            device = _get_device_cached()
            logger.info(f"Loading openai-whisper model '{model_name}' on '{device}'")
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
