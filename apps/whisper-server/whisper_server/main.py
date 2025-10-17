from __future__ import annotations

import os
import tempfile
from string import ascii_letters
from functools import lru_cache
from typing import Dict, List

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    import whisper  # type: ignore
except Exception as e:  # pragma: no cover
    raise RuntimeError(
        "Failed to import openai-whisper. Make sure dependencies are installed."
    ) from e


WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu").lower()
DEFAULT_MODEL = os.getenv("WHISPER_DEFAULT_MODEL", "tiny")
# Maximum accepted upload size in megabytes (to avoid excessive memory/IO)
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "50"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

APP = FastAPI(title="Whisper Transcription Server", version="0.1.0")

APP.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ModelInfo(BaseModel):
    id: str
    name: str


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


def _pretty_name(name: str) -> str:
    rep = name.replace("-", " ")
    return f"OpenAI Whisper {rep.title()}".strip()


@lru_cache(maxsize=12)
def get_model(name: str):  # type: ignore
    norm = _MODEL_ALIASES.get(name.lower(), name.lower())
    try:
        return whisper.load_model(norm, device=WHISPER_DEVICE)
    except Exception as e:  # pragma: no cover
        raise RuntimeError(f"Failed to load model '{name}': {e}") from e


@APP.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


@APP.get("/models", response_model=List[ModelInfo])
async def list_models() -> List[ModelInfo]:
    ids = list(_MODEL_ALIASES.keys())
    return [ModelInfo(id=i, name=_pretty_name(i)) for i in ids]


class TranscribeResponse(BaseModel):
    text: str


@APP.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(
    file: UploadFile = File(...),
    model: str | None = Form(None),
    language: str | None = Form(None),
):
    # Persist the upload to a temp file for ffmpeg/whisper
    try:
        suffix = os.path.splitext(file.filename or "audio")[1] or ".bin"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp_path = tmp.name
            total = 0
            # Stream to disk to avoid loading entire file into memory
            while True:
                chunk = await file.read(1 << 20)  # 1MB chunks
                if not chunk:
                    break
                total += len(chunk)
                if total > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File too large. Max {MAX_UPLOAD_MB}MB allowed.",
                    )
                tmp.write(chunk)
    except HTTPException:
        raise
    except Exception as e:  # pragma: no cover
        raise HTTPException(status_code=400, detail=f"Failed to read file: {e}")

    try:
        model_name = (model or DEFAULT_MODEL).strip()
        asr = get_model(model_name)
        # OpenAI whisper accepts language=.. and will auto-detect if None
        lang: str | None
        if language:
            # Accept simple 2-letter language codes; anything else -> None (auto)
            raw = language.strip().lower()
            if len(raw) == 2 and all(ch in ascii_letters for ch in raw):
                lang = raw
            else:
                lang = None
        else:
            lang = None

        result = asr.transcribe(tmp_path, language=lang, task="transcribe")
        text = (result.get("text") or "").strip()
        return TranscribeResponse(text=text)
    except Exception as e:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass


# Entry point for `uv run uvicorn whisper_server.main:app`
app = APP
