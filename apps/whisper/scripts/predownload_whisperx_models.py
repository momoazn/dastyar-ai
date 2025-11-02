#!/usr/bin/env python3
"""
Predownload WhisperX ASR models into the cache used by the Whisper server.

This script loads WhisperX-compatible models once to trigger downloading them into
the HuggingFace cache directory. It aligns with the FastAPI WhisperX server in
apps/whisper by following the same defaults and environment conventions.

Caching behavior:
- The server sets XDG_CACHE_HOME to its ".whisper-cache" directory (see api/config.py).
- WhisperX/faster-whisper download model artifacts into:
    $XDG_CACHE_HOME/huggingface/hub/...
- This script respects XDG_CACHE_HOME, and allows overriding via --cache-dir.

Model names:
- tiny, base, small, medium, large, large-v2, large-v3

Usage examples:
  python predownload_whisperx_models.py --all
  python predownload_whisperx_models.py tiny base large-v3
  python predownload_whisperx_models.py --models tiny,base,large-v3
  python predownload_whisperx_models.py --device cuda --compute-type float16 --all
  python predownload_whisperx_models.py --cache-dir /data/.whisper-cache --all

Environment variables:
- XDG_CACHE_HOME         Path to the cache directory used by HuggingFace (and the server)
- WHISPER_DEVICE         "cpu" or "cuda" (default "cpu" if not set)
- WHISPER_MODELS         Comma-separated list of models (e.g., "tiny,base,large-v3")
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from collections.abc import Iterable
from typing import cast

import torch
import importlib
from typing import Protocol, runtime_checkable


@runtime_checkable
class _WhisperXModule(Protocol):
    def load_model(self, model_name: str, device: str, compute_type: str) -> object: ...


whisperx = cast(_WhisperXModule, cast(object, importlib.import_module("whisperx")))

# Keep aliases consistent with the server (see apps/whisper/api/models.py)
KNOWN_MODELS: list[str] = [
    "tiny",
    "base",
    "small",
    "medium",
    "large",
    "large-v2",
    "large-v3",
]
ALIASES = {m: m for m in KNOWN_MODELS}


def _default_cache_dir() -> Path:
    """
    Default cache directory aligns with the server's default:
    apps/whisper/.whisper-cache (relative to this script location)
    """
    # script path: apps/whisper/scripts/predownload_whisperx_models.py
    scripts_dir = Path(__file__).resolve().parent
    whisper_dir = scripts_dir.parent
    return whisper_dir / ".whisper-cache"


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def _resolve_device(user_device: str | None) -> str:
    device = (user_device or os.environ.get("WHISPER_DEVICE") or "cpu").strip().lower()
    if device not in ("cpu", "cuda"):
        print(f"[warn] Invalid device '{device}' provided. Falling back to 'cpu'.")
        return "cpu"
    if device == "cuda" and not torch.cuda.is_available():
        print("[warn] CUDA requested but not available. Falling back to 'cpu'.")
        return "cpu"
    return device


def _resolve_compute_type(device: str, user_compute: str | None) -> str:
    if user_compute:
        return user_compute
    # Sensible defaults mirroring the server
    return "float16" if device == "cuda" else "int8"


def _normalize_models(models: Iterable[str]) -> list[str]:
    result: list[str] = []
    for m in models:
        name = ALIASES.get(m.lower().strip(), m.lower().strip())
        if name not in KNOWN_MODELS:
            raise ValueError(
                f"Unknown model name: '{m}'. Allowed: {', '.join(KNOWN_MODELS)}"
            )
        result.append(name)
    return result


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Predownload WhisperX models into the HuggingFace cache.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    _ = parser.add_argument(
        "positional_models",
        nargs="*",
        help=f"WhisperX model names: {', '.join(KNOWN_MODELS)}",
    )
    _ = parser.add_argument(
        "--models",
        type=str,
        default=os.environ.get("WHISPER_MODELS"),
        help="Comma-separated list of models (e.g., 'tiny,base,large-v3').",
    )
    _ = parser.add_argument(
        "--all",
        action="store_true",
        help="Download all known models.",
    )
    _ = parser.add_argument(
        "--device",
        type=str,
        choices=["cpu", "cuda"],
        default=os.environ.get("WHISPER_DEVICE", "cpu"),
        help="Compute device to initialize models.",
    )
    _ = parser.add_argument(
        "--compute-type",
        type=str,
        default=None,
        help="Compute type for faster-whisper (e.g., 'int8', 'int8_float16', 'float16', 'auto').",
    )
    _ = parser.add_argument(
        "--cache-dir",
        type=str,
        default=os.environ.get("XDG_CACHE_HOME") or str(_default_cache_dir()),
        help="Cache directory (sets XDG_CACHE_HOME for the process).",
    )
    _ = parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only show what would be downloaded, without loading models.",
    )
    return parser.parse_args(argv)


def _collect_models(args: argparse.Namespace) -> list[str]:
    if cast(bool, args.all):
        return KNOWN_MODELS[:]

    selected: list[str] = []
    if models_opt := cast(str | None, args.models):
        selected.extend([s for s in models_opt.split(",") if s.strip()])
    if positional := cast(list[str], args.positional_models):
        selected.extend(positional)

    if not selected:
        raise SystemExit(
            "No models specified. Use --all, pass names positionally, "
            + "or use --models tiny,base,large-v3"
        )

    return _normalize_models(selected)


def _print_header(
    cache_dir: Path, device: str, compute_type: str, models: list[str], dry_run: bool
) -> None:
    print("WhisperX Model Predownloader")
    print("=" * 60)
    print(f"Cache dir       : {cache_dir}")
    print(f"Device          : {device}")
    print(f"Compute type    : {compute_type}")
    print(f"Models          : {', '.join(models)}")
    print(f"Dry-run         : {dry_run}")
    print("=" * 60)


def _load_once(model_name: str, device: str, compute_type: str) -> None:
    # Load model to trigger downloads; discard immediately.
    model: object = whisperx.load_model(
        model_name, device=device, compute_type=compute_type
    )
    # Release resources
    del model
    if device == "cuda":
        torch.cuda.empty_cache()


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)

    # Resolve cache dir and apply to environment to match server config
    cache_dir = Path(cast(str, args.cache_dir)).expanduser().resolve()
    _ensure_dir(cache_dir)
    os.environ["XDG_CACHE_HOME"] = str(cache_dir)

    device = _resolve_device(cast(str, args.device))
    compute_type = _resolve_compute_type(device, cast(str | None, args.compute_type))
    try:
        models = _collect_models(args)
    except ValueError as e:
        print(f"[error] {e}")
        return 2

    _print_header(cache_dir, device, compute_type, models, cast(bool, args.dry_run))

    if cast(bool, args.dry_run):
        print("Dry-run enabled. Exiting without downloading.")
        return 0

    failures: list[str] = []
    for name in models:
        print(f"⬇️  Downloading '{name}' ...")
        try:
            _load_once(name, device, compute_type)
            print(f"✅ Ready: {name}")
        except Exception as e:
            failures.append(name)
            print(f"❌ Failed: {name} ({e})")

    print("-" * 60)
    if failures:
        print(f"Completed with failures: {', '.join(failures)}")
        print("You can re-run the script to retry failed models.")
        return 1

    print("✨ All requested models are ready in the cache.")
    print(f"📁 Cache root: {cache_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
