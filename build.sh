#!/bin/bash

set -e

echo "🏗️  Building AI App - Single Binary"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

step() {
    echo -e "${BLUE}🔄 $1...${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Clean previous builds
step "Cleaning previous builds"
rm -rf dist/
success "Cleaned previous builds"

# Install dependencies
step "Installing dependencies"
bun install > /dev/null 2>&1 || error "Failed to install JS dependencies"
cd apps/whisper && uv sync --group build > /dev/null 2>&1 || error "Failed to install Python dependencies"
cd ../..
success "Dependencies installed"

# Build frontend
step "Building React frontend"
bun run build:web > /dev/null 2>&1 || error "Failed to build frontend"
success "Frontend built"

# Build server
step "Building Bun server"
bun run db:generate > /dev/null 2>&1 || true  # Continue if no schema changes
bun run build:server > /dev/null 2>&1 || error "Failed to build server"
success "Server built"

# Build whisper service for target platform
if [[ "$TARGET_OS" == "windows" || "$TARGET_OS" == "win" ]]; then
    step "Building Whisper service for Windows"
    # For Windows cross-compilation, we'd need Docker or a Windows environment
    # For now, build native and warn about cross-compilation
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        bun run build:whisper > /dev/null 2>&1 || error "Failed to build Whisper service"
    else
        echo "⚠️  Cross-compiling Python to Windows from Unix requires Docker"
        echo "    Building native Whisper service instead"
        bun run build:whisper > /dev/null 2>&1 || error "Failed to build Whisper service"
    fi
else
    step "Building Whisper service"
    bun run build:whisper > /dev/null 2>&1 || error "Failed to build Whisper service"
fi
success "Whisper service built"

# Copy assets to dist
step "Organizing assets"
mkdir -p dist/web dist/
cp apps/server/dist/index.js dist/server

# Copy whisper binary with correct name
if [[ "$TARGET_OS" == "windows" || "$TARGET_OS" == "win" ]]; then
    if [ -f apps/whisper/dist/whisper-api.exe ]; then
        cp apps/whisper/dist/whisper-api.exe dist/whisper-api.exe
    elif [ -f apps/whisper/dist/whisper-api ]; then
        # Native build on Unix for Windows target - rename for embedding
        cp apps/whisper/dist/whisper-api dist/whisper-api
    fi
else
    cp apps/whisper/dist/whisper-api dist/whisper-api
fi

cp -r apps/web/dist/* dist/web/
success "Assets organized"

# Initialize Go module if needed
if [ ! -f go.mod ]; then
    step "Initializing Go module"
    go mod init dastyar-ai
    success "Go module initialized"
fi

# Build the final binary
TARGET_OS=${1:-$(uname -s | tr '[:upper:]' '[:lower:]')}
case "$TARGET_OS" in
    "windows"|"win")
        step "Building Windows binary"
        BINARY_NAME="dastyar-ai.exe"
        GOOS=windows GOARCH=amd64 go build -ldflags "-s -w" -o "$BINARY_NAME" main.go || error "Failed to build Windows binary"
        ;;
    "darwin"|"macos")
        step "Building macOS binary"
        BINARY_NAME="dastyar-ai"
        GOOS=darwin GOARCH=amd64 go build -ldflags "-s -w" -o "$BINARY_NAME" main.go || error "Failed to build macOS binary"
        ;;
    "linux")
        step "Building Linux binary"
        BINARY_NAME="dastyar-ai"
        GOOS=linux GOARCH=amd64 go build -ldflags "-s -w" -o "$BINARY_NAME" main.go || error "Failed to build Linux binary"
        ;;
    *)
        step "Building native binary"
        if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
            BINARY_NAME="dastyar-ai.exe"
        else
            BINARY_NAME="dastyar-ai"
        fi
        go build -ldflags "-s -w" -o "$BINARY_NAME" main.go || error "Failed to build final binary"
        ;;
esac

success "Final binary built: $BINARY_NAME"

# Show final size
BINARY_SIZE=$(du -h "$BINARY_NAME" | cut -f1)
echo ""
echo "🎉 Build completed successfully!"
echo "📁 Binary: $BINARY_NAME"
echo "📊 Size: $BINARY_SIZE"
echo ""
echo "📋 Usage:"
if [[ "$TARGET_OS" == "windows" || "$TARGET_OS" == "win" ]]; then
echo "   • Windows: dastyar-ai.exe"
else
echo "   • Unix/Linux: ./dastyar-ai"
fi
echo ""
echo "📋 Cross-compilation examples:"
echo "   • For Windows: ./build.sh windows"
echo "   • For macOS: ./build.sh darwin" 
echo "   • For Linux: ./build.sh linux"
echo ""
echo "🚀 Ready for deployment!"