"""
PyInstaller hook for faster-whisper
"""

from PyInstaller.utils.hooks import collect_data_files, collect_submodules

# Collect all faster_whisper submodules
hiddenimports = collect_submodules('faster_whisper')

# Collect data files if any
datas = collect_data_files('faster_whisper')