"""Persian (Farsi) text normalization utilities.

The goal is to make raw ASR output more readable and consistent for Persian
without requiring external dependencies. This module intentionally keeps
transformations conservative and reversible:

- Map Arabic Yeh/Kaf to Persian forms (ی/ک)
- Remove tatweel (ـ)
- Convert common Latin punctuation to Persian equivalents (، ؛ ؟)
- Normalize spacing around punctuation

These steps avoid aggressive linguistic changes (e.g., inserting ZWNJ) and
do not change digits. Callers should apply this only for Persian output.
"""

from __future__ import annotations

import re

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

    Args:
        text: Arbitrary input text (UTF-8).

    Returns:
        Normalized text, suitable for display/storage.
    """
    if not text:
        return text

    # Character-level replacements
    out = text
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
