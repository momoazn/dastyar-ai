#!/bin/bash

set -e

echo "========================================="
echo "Building Whisper Server with whisper.cpp"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check for required tools
echo "Checking for required tools..."

# Check for Go
if ! command -v go &> /dev/null; then
    echo -e "${RED}Error: Go not found${NC}"
    echo "Please install Go 1.23 or later from https://go.dev/dl/"
    exit 1
fi
echo -e "${GREEN}✓ Go $(go version | awk '{print $3}')${NC}"

# Check for C++ compiler
if ! command -v g++ &> /dev/null && ! command -v clang++ &> /dev/null; then
    echo -e "${RED}Error: C++ compiler (g++ or clang++) not found${NC}"
    echo "Please install build-essential (Ubuntu/Debian) or Xcode Command Line Tools (macOS)"
    exit 1
fi
echo -e "${GREEN}✓ C++ compiler found${NC}"

# Check for cmake
if ! command -v cmake &> /dev/null; then
    echo -e "${RED}Error: cmake is required to build whisper.cpp${NC}"
    echo "You can install it with:"
    echo "  Ubuntu/Debian: sudo apt-get install cmake"
    echo "  macOS: brew install cmake"
    echo "  Fedora/RHEL: sudo dnf install cmake"
    exit 1
fi
echo -e "${GREEN}✓ cmake $(cmake --version | head -n1 | awk '{print $3}')${NC}"

# Check for git
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git not found${NC}"
    echo "Please install git"
    exit 1
fi
echo -e "${GREEN}✓ git found${NC}"

# Check for ffmpeg (for audio conversion)
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}Warning: ffmpeg not found${NC}"
    echo "ffmpeg is required for automatic audio format conversion"
    echo "You can install it with:"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  macOS: brew install ffmpeg"
    echo "  Fedora/RHEL: sudo dnf install ffmpeg"
    echo ""
else
    echo -e "${GREEN}✓ ffmpeg found${NC}"
fi

# Check/clone whisper.cpp
echo ""
echo "Checking whisper.cpp..."
if [ ! -d "whisper.cpp" ]; then
    echo -e "${BLUE}Cloning whisper.cpp repository...${NC}"
    git clone https://github.com/ggerganov/whisper.cpp.git
    echo -e "${GREEN}✓ whisper.cpp cloned${NC}"
else
    echo -e "${GREEN}✓ whisper.cpp directory exists${NC}"
fi

# Ensure models and temp directories exist
echo ""
echo "Checking required directories..."
if [ ! -d "models" ]; then
    echo -e "${BLUE}Creating models directory...${NC}"
    mkdir -p models
    echo -e "${GREEN}✓ models directory created${NC}"
else
    echo -e "${GREEN}✓ models directory exists${NC}"
fi

if [ ! -d "temp" ]; then
    echo -e "${BLUE}Creating temp directory...${NC}"
    mkdir -p temp
    echo -e "${GREEN}✓ temp directory created${NC}"
else
    echo -e "${GREEN}✓ temp directory exists${NC}"
fi

# Download ffmpeg binaries for embedding
echo ""
echo "Checking embedded ffmpeg binaries..."
if [ ! -d "internal/ffmpeg/bin" ] || [ -z "$(ls -A internal/ffmpeg/bin 2>/dev/null)" ]; then
    echo -e "${BLUE}Downloading ffmpeg binaries for embedding...${NC}"
    ./download-ffmpeg.sh
else
    echo -e "${GREEN}✓ ffmpeg binaries already downloaded${NC}"
    echo -e "${YELLOW}  Run './download-ffmpeg.sh' to re-download if needed${NC}"
fi

# Check if at least one model exists
MODEL_COUNT=$(find models -name "*.bin" 2>/dev/null | wc -l)
if [ "$MODEL_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}Warning: No models found in models/ directory${NC}"
    echo ""
    echo "You need to download at least one Whisper model to use the server."
    echo "Run one of these commands to download a model:"
    echo ""
    echo "  ${GREEN}./download-model.sh ggml-base.bin${NC}       # Recommended (142 MB)"
    echo "  ${GREEN}./download-model.sh ggml-tiny.bin${NC}       # Fastest (75 MB)"
    echo "  ${GREEN}./download-model.sh ggml-large-v3.bin${NC}   # Most accurate (2.9 GB)"
    echo ""
    echo -e "${YELLOW}Continuing build anyway...${NC}"
else
    echo -e "${GREEN}✓ Found $MODEL_COUNT model(s) in models/ directory${NC}"
fi

# Build whisper.cpp
echo ""
echo "Building whisper.cpp library..."
cd whisper.cpp

# Determine number of CPU cores for parallel build
if command -v nproc &> /dev/null; then
    NCPU=$(nproc)
elif command -v sysctl &> /dev/null; then
    NCPU=$(sysctl -n hw.ncpu 2>/dev/null || echo 4)
else
    NCPU=4
fi

# Check for stale CMake cache
if [ -f "build_go/CMakeCache.txt" ]; then
    CACHED_SOURCE=$(grep "CMAKE_HOME_DIRECTORY:" build_go/CMakeCache.txt | cut -d'=' -f2)
    CURRENT_SOURCE=$(pwd)
    if [ "$CACHED_SOURCE" != "$CURRENT_SOURCE" ]; then
        echo -e "${YELLOW}Detected stale CMake cache (from $CACHED_SOURCE)${NC}"
        echo -e "${BLUE}Cleaning build directory...${NC}"
        rm -rf build_go
        echo -e "${GREEN}✓ Build directory cleaned${NC}"
    fi
fi

# Build with cmake
echo "Using cmake build system with $NCPU cores..."
cmake -S . -B build_go \
    -DCMAKE_BUILD_TYPE=Release \
    -DBUILD_SHARED_LIBS=OFF \
    -DWHISPER_BUILD_TESTS=OFF \
    -DWHISPER_BUILD_EXAMPLES=OFF

cmake --build build_go --target whisper --config Release -j$NCPU

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ whisper.cpp built successfully${NC}"
else
    echo -e "${RED}Error: whisper.cpp build failed${NC}"
    exit 1
fi

cd ..

# Set environment variables for Go build
echo ""
echo "Setting up Go build environment..."

# Base paths
WHISPER_ROOT="$(pwd)/whisper.cpp"
BUILD_DIR="$WHISPER_ROOT/build_go"
GGML_SRC="$BUILD_DIR/ggml/src"

# Include paths for C headers
export C_INCLUDE_PATH="$WHISPER_ROOT/include:$WHISPER_ROOT/ggml/include"

# Library search paths - include main libs and ggml backend subdirectories
export LIBRARY_PATH="$BUILD_DIR/src:$GGML_SRC:$GGML_SRC/ggml-metal:$GGML_SRC/ggml-blas:$GGML_SRC/ggml-cpu"
export CGO_LDFLAGS="-L$BUILD_DIR/src -L$GGML_SRC -L$GGML_SRC/ggml-metal -L$GGML_SRC/ggml-blas -L$GGML_SRC/ggml-cpu"

# On macOS, add Metal framework for GPU acceleration
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Detected macOS - adding Metal framework support"
    export CGO_LDFLAGS="$CGO_LDFLAGS -framework Foundation -framework Metal -framework MetalKit"
fi

# Build Go application
echo ""
echo "Building Go whisper server..."
go build -o whisper .

if [ $? -eq 0 ]; then
    # Make the binary executable
    chmod +x whisper

    echo ""
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}✓ Build successful!${NC}"
    echo -e "${GREEN}=========================================${NC}"
    echo ""
    echo "Binary created: ./whisper"
    echo ""

    if [ "$MODEL_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}Next steps:${NC}"
        echo "  1. Download a model: ${GREEN}./download-model.sh ggml-base.bin${NC}"
        echo "  2. Run the server: ${GREEN}./whisper${NC}"
        echo "  3. Open http://localhost:8080 in your browser"
    else
        echo -e "${GREEN}Ready to run!${NC}"
        echo "  Run the server: ${GREEN}./whisper${NC}"
        echo "  Open http://localhost:8080 in your browser"
    fi
    echo ""
else
    echo ""
    echo -e "${RED}=========================================${NC}"
    echo -e "${RED}✗ Go build failed${NC}"
    echo -e "${RED}=========================================${NC}"
    echo ""
    echo "Please check the error messages above."
    echo "Common issues:"
    echo "  - Missing Go dependencies: run 'go mod tidy'"
    echo "  - CGO compilation errors: ensure whisper.cpp built successfully"
    echo ""
    exit 1
fi
