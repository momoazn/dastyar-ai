"""Main application module for the Whisper Server.

This module initializes the FastAPI application and sets up middleware, routes,
and other configurations.
"""

import logging
from contextlib import asynccontextmanager
from typing import Callable
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .config import settings
from .routes import setup_routes

setup_routes: Callable[[FastAPI], None]

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        FastAPI: The configured FastAPI application instance.
    """

    # Initialize FastAPI app with lifespan
    @asynccontextmanager
    async def lifespan(_app: FastAPI):
        # Log application startup
        logger.info("Starting Whisper Transcription Server")
        logger.info(
            "Environment: %s", "development" if settings.RELOAD else "production"
        )
        logger.info("Device: %s", settings.WHISPER_DEVICE)
        logger.info("Default model: %s", settings.WHISPER_DEFAULT_MODEL)
        logger.info("Models directory: %s", settings.MODELS_DIR)
        logger.info("Cache directory: %s", settings.CACHE_DIR)
        yield

    app = FastAPI(
        title="Whisper Transcription Server",
        description="FastAPI server for offline speech-to-text transcription using OpenAI Whisper",
        version=__version__,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=settings.CORS_METHODS,
        allow_headers=settings.CORS_HEADERS,
    )

    # Setup API routes
    setup_routes(app)

    return app


# Create the application instance
app = create_app()
