# Multi-stage Dockerfile for building Whisper API executable
# Supports Linux x86_64 builds in containerized environment

# ============================================================================
# Stage 1: Build Environment
# ============================================================================
FROM python:3.13-slim as builder

# Set build arguments
ARG TARGET_PLATFORM=linux
ARG DEBIAN_FRONTEND=noninteractive

# Install system dependencies required for building
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    pkg-config \
    libssl-dev \
    libffi-dev \
    libc6-dev \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.cargo/bin:$PATH"

# Set working directory
WORKDIR /build

# Copy project files
COPY pyproject.toml ./
COPY src/ ./src/
COPY hooks/ ./hooks/
COPY whisper-api.spec ./
COPY build.py ./

# Copy models directory if it exists (for bundling tiny model)
COPY models* ./models/

# Install dependencies and build executable
RUN . /root/.cargo/env && \
    uv sync --group build && \
    uv run python build.py

# ============================================================================
# Stage 2: Extract Executable
# ============================================================================
FROM scratch as exporter

# Copy the built executable
COPY --from=builder /build/dist/whisper-api /whisper-api

# ============================================================================
# Stage 3: Runtime Environment (Optional - for testing)
# ============================================================================
FROM python:3.13-slim as runtime

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd --create-home --shell /bin/bash app

# Set working directory
WORKDIR /app

# Copy the built executable
COPY --from=builder /build/dist/whisper-api ./whisper-api

# Copy models directory if available
COPY --from=builder /build/models* ./models/

# Set ownership and permissions
RUN chown -R app:app /app && \
    chmod +x /app/whisper-api

# Switch to app user
USER app

# Expose port
EXPOSE 40002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:40002/api/health || exit 1

# Default command
CMD ["./whisper-api"]

# ============================================================================
# Stage 4: Development Environment (Optional)
# ============================================================================
FROM python:3.13-slim as development

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.cargo/bin:$PATH"

# Set working directory
WORKDIR /workspace

# Copy project files
COPY . .

# Install dependencies
RUN . /root/.cargo/env && uv sync --group build --group dev

# Expose port
EXPOSE 40002

# Default command for development
CMD ["/bin/bash"]