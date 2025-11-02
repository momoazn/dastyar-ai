"""Configuration settings for the Whisper Server."""

import os
import sys
from pathlib import Path
from typing import List

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _get_base_dir() -> Path:
    """Get the base directory path, accounting for PyInstaller bundle."""
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS)  # type: ignore
    return Path(__file__).parent


class Settings(BaseSettings):
    """Application settings with environment variable overrides."""

    # Base directories
    BASE_DIR: Path = Field(default_factory=_get_base_dir)
    CACHE_DIR: Path = Field(default_factory=lambda: _get_base_dir() / ".whisper-cache")
    MODELS_DIR: Path = Field(default_factory=lambda: _get_base_dir() / "whisper-models")

    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    WORKERS: int = 1
    RELOAD: bool = False
    LOG_LEVEL: str = "info"

    # Whisper settings
    WHISPER_DEVICE: str = "cpu"
    WHISPER_DEFAULT_MODEL: str = "tiny"

    # Upload settings
    MAX_UPLOAD_MB: int = 50
    MAX_UPLOAD_BYTES: int = 50 * 1024 * 1024  # 50MB default

    # CORS settings
    CORS_ORIGINS: List[str] = ["*"]
    CORS_METHODS: List[str] = ["*"]
    CORS_HEADERS: List[str] = ["*"]

    # Pydantic v2 Settings config
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    @field_validator("CACHE_DIR", "MODELS_DIR", mode="before")
    def ensure_directories_exist(cls, v: Path) -> Path:
        """Ensure cache and model directories exist.

        Args:
            v: Path to the directory

        Returns:
            The validated directory path
        """
        v.mkdir(parents=True, exist_ok=True)
        return v

    @field_validator("WHISPER_DEVICE")
    def validate_device(cls, v: str) -> str:
        """Validate Whisper device setting."""
        v = v.lower()
        if v not in ("cpu", "cuda"):
            raise ValueError("WHISPER_DEVICE must be either 'cpu' or 'cuda'")
        return v

    # Derive MAX_UPLOAD_BYTES from MAX_UPLOAD_MB after model initialization
    @model_validator(mode="after")
    def set_upload_bytes(self):  # type: ignore[no-untyped-def]
        self.MAX_UPLOAD_BYTES = self.MAX_UPLOAD_MB * 1024 * 1024
        return self


# Initialize settings
settings = Settings()

# Set environment variables for dependent libraries
os.environ["XDG_CACHE_HOME"] = str(settings.CACHE_DIR)
