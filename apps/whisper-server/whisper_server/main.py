from __future__ import annotations

import os
import sys
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


def _runtime_base_dir() -> str:
    # When bundled with PyInstaller, sys._MEIPASS points to the temp extraction dir
    base = getattr(sys, "_MEIPASS", None)  # type: ignore[attr-defined]
    if isinstance(base, str) and os.path.isdir(base):
        return base
    # Fall back to the package directory
    return os.path.dirname(os.path.abspath(__file__))


_BASE_DIR = _runtime_base_dir()

# Prefer colocated cache/models so the binary is self-contained by default
_DEFAULT_CACHE_DIR = os.path.join(_BASE_DIR, ".whisper-cache")
_DEFAULT_MODELS_DIR = os.path.join(_BASE_DIR, "whisper-models")

# If not set, direct Whisper (and friends) cache into a local folder next to the binary
os.environ.setdefault("XDG_CACHE_HOME", _DEFAULT_CACHE_DIR)

# Optional environment overrides
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cpu").lower()
DEFAULT_MODEL = os.getenv("WHISPER_DEFAULT_MODEL", "tiny")
# Directory to store or load model weights
MODELS_DIR = os.getenv("WHISPER_MODELS_DIR", _DEFAULT_MODELS_DIR)
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
        # Ensure the local models dir exists; Whisper will use it to find or download weights
        try:
            os.makedirs(MODELS_DIR, exist_ok=True)
        except Exception:
            # Best-effort; continue if we can't create the folder
            pass
        return whisper.load_model(norm, device=WHISPER_DEVICE, download_root=MODELS_DIR)
    except Exception as e:  # pragma: no cover
        raise RuntimeError(f"Failed to load model '{name}': {e}") from e


def _maybe_add_bundled_ffmpeg_to_path() -> None:
    # Option 1: a colocated ffmpeg binary packaged under ./bin
    candidates: List[str] = []
    ffmpeg_name = "ffmpeg.exe" if sys.platform.startswith("win") else "ffmpeg"
    candidates.append(os.path.join(_BASE_DIR, "bin", ffmpeg_name))

    # Option 2: imageio-ffmpeg provides a managed ffmpeg path
    try:
        import imageio_ffmpeg  # type: ignore

        try:
            p = imageio_ffmpeg.get_ffmpeg_exe()  # type: ignore[attr-defined]
            if isinstance(p, str) and os.path.isfile(p):
                candidates.append(p)
        except Exception:
            pass
    except Exception:
        # Package not installed or failed — ignore
        pass

    for p in candidates:
        d = os.path.dirname(p)
        if os.path.isfile(p) and d not in os.environ.get("PATH", "").split(os.pathsep):
            os.environ["PATH"] = d + os.pathsep + os.environ.get("PATH", "")
            break


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
    # Make ffmpeg available before any decode/transcode operations
    _maybe_add_bundled_ffmpeg_to_path()
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

def _run_server_from_cli() -> None:
    import argparse
    try:
        import uvicorn  # type: ignore
    except Exception as e:  # pragma: no cover
        raise RuntimeError("uvicorn is required to run the server") from e

    parser = argparse.ArgumentParser(description="Whisper Transcription Server")
    parser.add_argument("--host", default=os.getenv("HOST", "0.0.0.0"))
    parser.add_argument("--port", type=int, default=int(os.getenv("PORT", "8001")))
    args = parser.parse_args()

    uvicorn.run("whisper_server.main:app", host=args.host, port=args.port)


if __name__ == "__main__":  # pragma: no cover
    _run_server_from_cli()
