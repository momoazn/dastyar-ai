import asyncio
import logging
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


def load_model(model_name: str) -> WhisperModel:
    if model_name not in faster_model_cache:
        try:
            device = _get_device_cached()
            logger.info(f"Loading faster-whisper model '{model_name}' on '{device}'")
            model = WhisperModel(model_name, device=device, download_root="models")
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
