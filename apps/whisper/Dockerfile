# Build stage
FROM golang:1.23-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    git \
    make \
    cmake \
    g++ \
    gcc \
    musl-dev \
    pkgconfig

WORKDIR /build

# Clone and build whisper.cpp
RUN git clone https://github.com/ggerganov/whisper.cpp.git && \
    cd whisper.cpp && \
    cmake -S . -B build_go \
        -DCMAKE_BUILD_TYPE=Release \
        -DBUILD_SHARED_LIBS=OFF \
        -DWHISPER_BUILD_TESTS=OFF \
        -DWHISPER_BUILD_EXAMPLES=OFF && \
    cmake --build build_go --target whisper --config Release -j$(nproc)

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the Go application
RUN export C_INCLUDE_PATH="/build/whisper.cpp/include:/build/whisper.cpp/ggml/include" && \
    export LIBRARY_PATH="/build/whisper.cpp/build_go/src:/build/whisper.cpp/build_go/ggml/src" && \
    export CGO_LDFLAGS="-L/build/whisper.cpp/build_go/src -L/build/whisper.cpp/build_go/ggml/src" && \
    CGO_ENABLED=1 go build -o whisper .

# Runtime stage
FROM alpine:latest

# Install runtime dependencies including ffmpeg for audio conversion
RUN apk add --no-cache \
    ffmpeg \
    libstdc++

# Copy binary from builder
COPY --from=builder /build/whisper /usr/local/bin/whisper
COPY --from=builder /build/web /app/web

# Create models and temp directories
RUN mkdir -p /app/models /app/temp

WORKDIR /app

# Set environment variables
ENV PORT=8080
ENV MODEL_PATH=/app/models
ENV MODEL_NAME=ggml-base.bin

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the application
CMD ["/usr/local/bin/whisper"]
