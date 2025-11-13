# Whisper Server - Speech-to-Text API

A high-performance REST API for transcribing audio files using OpenAI's Whisper model, built with Go and the official [whisper.cpp](https://github.com/ggml-org/whisper.cpp) Go bindings.

## Features

- **🎤 Voice Recording** - Record audio directly in your browser and transcribe instantly
- **Web UI** - Beautiful, interactive web interface with tabbed layout
- **Multi-Model Support** - Load and switch between multiple Whisper models dynamically
- **Auto Audio Conversion** - Automatically converts audio files to the required format using ffmpeg
- **Python API Compatibility** - Drop-in replacement for Python whisper-fastapi server
- RESTful API for audio transcription
- Support for multiple audio formats (WAV, MP3, MP4, M4A, OGG, OPUS, WEBM, FLAC, AAC, WMA)
- Automatic language detection
- Drag-and-drop file upload
- Real-time recording with visual feedback
- Audio preview before transcription
- Docker support for easy deployment
- Dynamic model selection per request
- Health check endpoint

## Quick Start with Docker (Recommended)

Docker is the easiest way to get started as it includes all required dependencies.

### 1. Download a Whisper Model

```bash
./download-model.sh ggml-base.bin
```

Available models:
- `ggml-tiny.bin` - Fastest, least accurate (~75 MB)
- `ggml-base.bin` - Good balance (default) (~142 MB)
- `ggml-small.bin` - Better accuracy (~466 MB)
- `ggml-medium.bin` - High accuracy (~1.5 GB)
- `ggml-large-v3.bin` - Best accuracy (~2.9 GB)

Quantized versions (smaller, slightly less accurate):
- `ggml-tiny-q5_1.bin`
- `ggml-base-q5_1.bin`
- `ggml-small-q5_1.bin`
- `ggml-medium-q5_0.bin`
- `ggml-large-v3-q5_0.bin`

### 2. Build the Docker Image

```bash
docker build -t whisper-server .
```

### 3. Run the Container

```bash
docker run -d \
  -p 8080:8080 \
  -v $(pwd)/models:/app/models \
  -e MODEL_NAME=ggml-base.bin \
  --name whisper-server \
  whisper-server
```

Or use docker-compose (recommended):

```bash
docker-compose up -d
```

### 4. Use the Application

**Option A: Web Interface (Recommended)**

Open your browser and visit:
```
http://localhost:8080
```

You'll see a beautiful web interface where you can:
- Drag and drop audio files
- See real-time transcription results
- View detected language and duration
- Check API health status

**Option B: Command Line (cURL)**

```bash
# Health check
curl http://localhost:8080/health

# Transcribe an audio file
curl -X POST \
  -F "audio=@your-audio-file.wav" \
  http://localhost:8080/api/v1/transcribe
```

## Web Interface

The application includes a modern, responsive web UI accessible at the root URL (`/`). Features include:

### 🎤 Record Tab
- **One-Click Recording** - Click the record button to start/stop recording
- **Real-time Timer** - See recording duration as you speak
- **Visual Feedback** - Pulsing animation during recording
- **Audio Preview** - Listen to your recording before transcribing
- **Auto-Conversion** - Automatically converts to 16kHz mono WAV format
- **Browser-Based** - No additional software needed

### 📁 Upload Tab
- **Drag & Drop** - Simply drag audio files onto the upload area
- **File Selection** - Or click to browse and select files
- **Format Support** - Accepts WAV, MP3, M4A, and more

### General Features
- 🎨 **Beautiful Design** - Modern gradient UI with smooth animations
- ⚡ **Real-time Feedback** - Loading indicators and instant results
- 📊 **Detailed Results** - View transcription text, language, and duration
- ✅ **Health Monitoring** - Live API status indicator
- 📱 **Responsive** - Works on desktop, tablet, and mobile devices
- 🔄 **Tabbed Interface** - Easy switching between recording and uploading

## API Endpoints

The server provides two API versions for compatibility:

### Python-Compatible API (Recommended for existing integrations)

These endpoints match the Python whisper-fastapi server API for drop-in replacement.

#### POST /transcribe

Transcribe an audio file to text.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Parameters:
  - `file` (required): Audio file (WAV, MP3, MP4, M4A, OGG, OPUS, WEBM, FLAC, AAC, WMA)
  - `model` (optional): Model name to use (e.g., `ggml-base.bin`, `ggml-large-v3.bin`)
  - `language` (optional): ISO 639-1 language code (e.g., `en`, `fa`) - auto-detected if not provided
  - `initial_prompt` (optional): Accepted for compatibility but not used by whisper.cpp

**Response:**
```json
{
  "text": "Transcribed text from the audio file"
}
```

**Example:**
```bash
curl -X POST \
  -F "file=@sample.mp3" \
  -F "model=ggml-base.bin" \
  http://localhost:8080/transcribe
```

#### GET /models

List available Whisper models.

**Response:**
```json
[
  {
    "id": "ggml-base.bin",
    "name": "Base"
  },
  {
    "id": "ggml-large-v3.bin",
    "name": "Large V3"
  }
]
```

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

### Versioned API (v1)

Enhanced API with additional metadata.

#### POST /api/v1/transcribe

Transcribe an audio file with detailed metadata.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Parameters:
  - `audio` (required): Audio file
  - `model` (optional): Model name to use

**Response:**
```json
{
  "text": "Transcribed text from the audio file",
  "language": "en",
  "duration": 5.2
}
```

**Example:**
```bash
curl -X POST \
  -F "audio=@sample.wav" \
  -F "model=ggml-large-v3.bin" \
  http://localhost:8080/api/v1/transcribe
```

#### GET /api/v1/models

List available models with metadata.

**Response:**
```json
[
  {
    "id": "ggml-base.bin",
    "name": "Base",
    "path": "/app/models/ggml-base.bin"
  }
]
```

### GET /

Serves the web UI for interactive audio transcription.

## Configuration

The application can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `MODEL_PATH` | Directory containing model files | `./models` |
| `MODEL_NAME` | Default model file to load at startup | `ggml-base.bin` |

**Note on Multi-Model Support:**
- The server loads the default model (`MODEL_NAME`) at startup
- Additional models in `MODEL_PATH` are loaded on-demand when requested
- All `.bin` files in the models directory can be selected via the API
- Use the `/models` endpoint to see available models

## Local Development (Without Docker)

Building locally requires several dependencies. **Docker is recommended** for most users.

### Prerequisites

To build and run locally, you need:

1. **Go 1.23+**
2. **C++ compiler** (g++/clang++)
3. **CMake** (required for building whisper.cpp)
4. **Git**
5. **ffmpeg** (required for automatic audio format conversion)

### Install Dependencies

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y build-essential cmake git ffmpeg
```

#### macOS
```bash
brew install cmake git ffmpeg
```

#### Fedora/RHEL
```bash
sudo dnf install gcc-c++ cmake git ffmpeg
```

### Build and Run

```bash
# Run the build script (automatically handles whisper.cpp setup)
./build.sh

# Download a model if you don't have one
./download-model.sh ggml-base.bin

# Run the server
./whisper
```

The build script will automatically:
1. Check for all required dependencies (Go, cmake, C++ compiler, git, ffmpeg)
2. Clone whisper.cpp if not present
3. Create models and temp directories
4. Build whisper.cpp as a static library with optimizations
5. Compile the Go application with CGO
6. Link everything together into the `whisper` binary

You can also use Make:
```bash
# Full build (builds whisper.cpp + Go server)
make build-full

# Quick build (Go only, assumes whisper.cpp is built)
make build

# Run in development mode
make dev
```

### Manual Build (Advanced)

If you prefer to build manually:

```bash
# Clone whisper.cpp if not present
if [ ! -d "whisper.cpp" ]; then
    git clone https://github.com/ggerganov/whisper.cpp.git
fi

# Build whisper.cpp
cd whisper.cpp
cmake -S . -B build_go \
    -DCMAKE_BUILD_TYPE=Release \
    -DBUILD_SHARED_LIBS=OFF \
    -DWHISPER_BUILD_TESTS=OFF \
    -DWHISPER_BUILD_EXAMPLES=OFF
cmake --build build_go --target whisper --config Release -j$(nproc 2>/dev/null || echo 4)
cd ..

# Create necessary directories
mkdir -p models temp

# Set environment variables
export C_INCLUDE_PATH="$(pwd)/whisper.cpp/include:$(pwd)/whisper.cpp/ggml/include"
export LIBRARY_PATH="$(pwd)/whisper.cpp/build_go/src:$(pwd)/whisper.cpp/build_go/ggml/src"
export CGO_LDFLAGS="-L$(pwd)/whisper.cpp/build_go/src -L$(pwd)/whisper.cpp/build_go/ggml/src"

# On macOS, add Metal framework for GPU acceleration
# export CGO_LDFLAGS="$CGO_LDFLAGS -framework Foundation -framework Metal -framework MetalKit"

# Build Go application
go build -o whisper .
```

## Project Structure

```
apps/whisper/
├── main.go                     # Application entry point
├── internal/
│   ├── audio/
│   │   └── converter.go       # Audio format conversion (ffmpeg)
│   ├── config/
│   │   └── config.go          # Configuration management
│   ├── handler/
│   │   └── transcribe.go      # HTTP handlers (v1 + Python-compatible)
│   └── service/
│       └── whisper.go         # Whisper service with multi-model support
├── web/
│   └── static/
│       └── index.html         # Web UI with recording and upload
├── whisper.cpp/                # Whisper.cpp library (auto-cloned)
├── examples/
│   └── test-api.sh            # API testing script
├── models/                     # Model files directory (.bin files)
├── temp/                       # Temporary uploaded/converted files
├── build.sh                    # Automated build script
├── Dockerfile                  # Docker multi-stage build
├── docker-compose.yml          # Docker Compose configuration
├── Makefile                    # Build commands (make build-full, make dev, etc.)
├── download-model.sh           # Model download script
├── go.mod                      # Go module definition
├── go.sum                      # Go dependencies lock
├── package.json                # NPM scripts for turbo integration
└── README.md                   # This file
```

## Supported Audio Formats

The API supports common audio formats including:
- WAV (recommended for best compatibility)
- MP3
- M4A
- OGG
- FLAC

**Note:** Some formats may require additional processing. WAV files work best with the current implementation.

## Performance Considerations

- **Model Size**: Larger models provide better accuracy but require more memory and CPU time
- **Quantized Models**: Use quantized models (q5_0, q5_1) for faster inference with minimal accuracy loss
- **GPU Acceleration**: The library supports CUDA, Vulkan, and Metal for GPU acceleration (requires additional build configuration)
- **File Size**: Maximum upload size is 100MB (configurable in handler)

## Memory Requirements

Approximate memory usage by model:
- tiny: ~390 MB
- base: ~500 MB
- small: ~1.0 GB
- medium: ~2.6 GB
- large: ~4.7 GB

## Troubleshooting

### Build Errors

**Problem:** `cmake: command not found`

**Solution:** Install cmake:
```bash
# Ubuntu/Debian
sudo apt-get install cmake

# macOS
brew install cmake

# Or use Docker (recommended)
docker-compose up --build
```

**Problem:** `C++ compiler not found`

**Solution:** Install build tools:
```bash
# Ubuntu/Debian
sudo apt-get install build-essential

# macOS
xcode-select --install
```

### Model Not Found

If you see "model not found" errors:

1. Ensure you've downloaded a model using `./download-model.sh`
2. Check that the `MODEL_PATH` points to the correct directory
3. Verify the `MODEL_NAME` matches the downloaded model filename

### Transcription Errors

If transcription fails:

1. Ensure your audio file is in a supported format (WAV recommended)
2. Check that the audio file is not corrupted
3. Try a smaller model first (tiny or base)
4. Check the logs for detailed error messages

## Development

### Running Tests

```bash
make test
```

### Building Examples

```bash
# Build Docker image
make docker-build

# Run with docker-compose
make docker-compose-up

# Download a specific model
make download-model MODEL=ggml-small.bin
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project uses whisper.cpp which is licensed under the MIT License. See the whisper.cpp LICENSE file for more details.

## Acknowledgments

- [OpenAI Whisper](https://github.com/openai/whisper) - Original Whisper model
- [whisper.cpp](https://github.com/ggml-org/whisper.cpp) - C/C++ port of Whisper with official Go bindings
- [GGML](https://github.com/ggerganov/ggml) - Machine learning library powering whisper.cpp

## Support

- For whisper.cpp issues, see: https://github.com/ggml-org/whisper.cpp/issues
- For Go bindings discussion: https://github.com/ggml-org/whisper.cpp/discussions/312
