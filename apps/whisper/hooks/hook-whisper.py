"""
PyInstaller hook for openai-whisper
"""

from PyInstaller.utils.hooks import collect_data_files, collect_submodules

# Collect all whisper submodules
hiddenimports = collect_submodules("whisper")

# Add specific whisper modules that might be missed
hiddenimports += [
    "whisper.normalizers.english",
    "whisper.normalizers.basic",
    "whisper.tokenizer",
    "whisper.model",
    "whisper.audio",
    "whisper.decoding",
    "whisper.transcribe",
]

# Collect data files (model assets, etc.)
datas = collect_data_files("whisper")
