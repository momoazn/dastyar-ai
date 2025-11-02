"""Persian (Farsi) text normalization utilities.

The goal is to make raw ASR output more readable and consistent for Persian.
This module uses the hazm library for comprehensive Persian text normalization
when available, with a fallback to basic normalization.

Normalization steps include:
- Map Arabic Yeh/Kaf to Persian forms (ی/ک)
- Remove tatweel (ـ)
- Convert common Latin punctuation to Persian equivalents (، ؛ ؟)
- Normalize spacing around punctuation
- Enhanced normalization with hazm (if available): Unicode normalization,
  character variants, and Persian-specific text processing

These steps avoid aggressive linguistic changes (e.g., inserting ZWNJ) and
do not change digits. Callers should apply this only for Persian output.
"""

from __future__ import annotations

import re

# Try to import hazm for enhanced Persian normalization
try:
    from hazm import Normalizer as HazmNormalizer

    _hazm_normalizer = HazmNormalizer()
    _HAZM_AVAILABLE = True
except ImportError:
    _HAZM_AVAILABLE = False
    _hazm_normalizer = None

_CHAR_MAP = {
    "\u064a": "\u06cc",  # ARABIC LETTER YEH → PERSIAN LETTER YE (ي → ی)
    "\u0643": "\u06a9",  # ARABIC LETTER KAF → KEHEH (ك → ک)
    "\u0640": "",  # TATWEEL (ـ) → remove
}

_PUNCT_MAP = {
    ",": "،",
    ";": "؛",
    "?": "؟",
}

_SPACE_BEFORE_PUNCT = re.compile(r"\s+([،؛\?\!\.:])")
_SPACE_AFTER_PUNCT = re.compile(r"([،؛\?\!\.:])\s*")
_MULTI_SPACE = re.compile(r"\s{2,}")


def normalize_persian(text: str) -> str:
    """Normalize common Persian orthography and punctuation.

    Uses hazm library for comprehensive normalization when available,
    with fallback to basic normalization.

    Args:
        text: Arbitrary input text (UTF-8).

    Returns:
        Normalized text, suitable for display/storage.
    """
    if not text:
        return text

    # Use hazm for enhanced normalization if available
    if _HAZM_AVAILABLE and _hazm_normalizer:
        try:
            # hazm's Normalizer handles:
            # - Arabic to Persian character conversion (ي → ی, ك → ک)
            # - Unicode normalization (NFC, NFKC)
            # - Character variant normalization
            # - Extra space removal
            # - Persian-specific text cleaning
            out = _hazm_normalizer.normalize(text)

            # Apply our custom punctuation mapping on top
            for src, dst in _PUNCT_MAP.items():
                out = out.replace(src, dst)

            return out.strip()
        except Exception:
            # Fall back to basic normalization if hazm fails
            pass

    # Fallback: basic normalization without hazm
    out = text

    # Character-level replacements
    for src, dst in _CHAR_MAP.items():
        out = out.replace(src, dst)

    # Punctuation mapping
    for src, dst in _PUNCT_MAP.items():
        out = out.replace(src, dst)

    # Normalize spacing: remove spaces before punctuation, ensure one after
    out = _SPACE_BEFORE_PUNCT.sub(r"\1", out)
    # Preserve trailing punctuation with no extra space at end of line
    out = _SPACE_AFTER_PUNCT.sub(lambda m: f"{m.group(1)} ", out)

    # Collapse multiple spaces
    out = _MULTI_SPACE.sub(" ", out).strip()

    return out


__all__ = ["normalize_persian"]
