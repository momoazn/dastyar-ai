#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="$SCRIPT_DIR/internal/ffmpeg/bin"

# Detect current platform
CURRENT_OS=$(uname -s | tr '[:upper:]' '[:lower:]')
CURRENT_ARCH=$(uname -m)

# Normalize architecture names
case "$CURRENT_ARCH" in
    x86_64) CURRENT_ARCH="amd64" ;;
    aarch64|arm64) CURRENT_ARCH="arm64" ;;
esac

# Check if user wants to download all platforms
DOWNLOAD_ALL=false
if [[ "$1" == "--all" ]]; then
    DOWNLOAD_ALL=true
    echo "========================================="
    echo "Downloading ffmpeg for ALL platforms"
    echo "========================================="
else
    echo "========================================="
    echo "Downloading ffmpeg for current platform"
    echo "Platform: $CURRENT_OS-$CURRENT_ARCH"
    echo "========================================="
    echo ""
    echo "Tip: Use --all to download for all platforms"
fi
echo ""

mkdir -p "$BIN_DIR"

# Function to download and extract ffmpeg
download_ffmpeg() {
    local platform=$1
    local url=$2
    local output_name=$3
    local extract_cmd=$4

    echo "📥 Downloading ffmpeg for $platform..."

    local tmp_dir=$(mktemp -d)
    local archive="$tmp_dir/ffmpeg.archive"

    curl -fsSL "$url" -o "$archive"

    echo "📦 Extracting ffmpeg..."
    cd "$tmp_dir"
    eval "$extract_cmd"

    # Find the ffmpeg binary
    local ffmpeg_bin=$(find . -type f -name "ffmpeg*" -perm -u+x | head -n1)

    if [ -z "$ffmpeg_bin" ]; then
        echo "❌ Error: ffmpeg binary not found in archive"
        rm -rf "$tmp_dir"
        return 1
    fi

    # Copy to bin directory
    cp "$ffmpeg_bin" "$BIN_DIR/$output_name"
    chmod +x "$BIN_DIR/$output_name"

    # Cleanup
    rm -rf "$tmp_dir"

    local size=$(du -h "$BIN_DIR/$output_name" | cut -f1)
    echo "✅ $platform: $output_name ($size)"
    echo ""
}

# Helper function to check if platform should be downloaded
should_download_platform() {
    local os=$1
    local arch=$2

    if [ "$DOWNLOAD_ALL" = true ]; then
        return 0
    fi

    if [[ "$CURRENT_OS" == "$os" ]] && [[ "$CURRENT_ARCH" == "$arch" ]]; then
        return 0
    fi

    return 1
}

# Try to use local ffmpeg if available (for macOS)
try_local_ffmpeg() {
    local platform=$1
    local output_name=$2

    if command -v ffmpeg &> /dev/null && [[ "$platform" == "macOS"* ]]; then
        echo "📋 Found local ffmpeg, using it for $platform..."
        cp "$(which ffmpeg)" "$BIN_DIR/$output_name"
        chmod +x "$BIN_DIR/$output_name"
        size=$(du -h "$BIN_DIR/$output_name" | cut -f1)
        echo "✅ $platform: $output_name ($size)"
        echo ""
        return 0
    fi
    return 1
}

# Linux AMD64
if should_download_platform "linux" "amd64"; then
    if [ ! -f "$BIN_DIR/ffmpeg-linux-amd64" ] || [ ! -s "$BIN_DIR/ffmpeg-linux-amd64" ]; then
        download_ffmpeg \
            "Linux AMD64" \
            "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz" \
            "ffmpeg-linux-amd64" \
            "tar -xJf ffmpeg.archive"
    else
        echo "✓ Linux AMD64 already exists"
    fi
fi

# Linux ARM64
if should_download_platform "linux" "arm64"; then
    if [ ! -f "$BIN_DIR/ffmpeg-linux-arm64" ] || [ ! -s "$BIN_DIR/ffmpeg-linux-arm64" ]; then
        download_ffmpeg \
            "Linux ARM64" \
            "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz" \
            "ffmpeg-linux-arm64" \
            "tar -xJf ffmpeg.archive"
    else
        echo "✓ Linux ARM64 already exists"
    fi
fi

# macOS AMD64
if should_download_platform "darwin" "amd64"; then
    if [ ! -f "$BIN_DIR/ffmpeg-darwin-amd64" ] || [ ! -s "$BIN_DIR/ffmpeg-darwin-amd64" ]; then
        if ! try_local_ffmpeg "macOS AMD64" "ffmpeg-darwin-amd64"; then
            download_ffmpeg \
                "macOS AMD64" \
                "https://evermeet.cx/ffmpeg/ffmpeg-6.1.1.zip" \
                "ffmpeg-darwin-amd64" \
                "unzip -q ffmpeg.archive"
        fi
    else
        echo "✓ macOS AMD64 already exists"
    fi
fi

# macOS ARM64 (Apple Silicon)
if should_download_platform "darwin" "arm64"; then
    if [ ! -f "$BIN_DIR/ffmpeg-darwin-arm64" ] || [ ! -s "$BIN_DIR/ffmpeg-darwin-arm64" ]; then
        if ! try_local_ffmpeg "macOS ARM64" "ffmpeg-darwin-arm64"; then
            # Try copying from AMD64 if available
            if [ -f "$BIN_DIR/ffmpeg-darwin-amd64" ] && [ -s "$BIN_DIR/ffmpeg-darwin-amd64" ]; then
                echo "📋 Using AMD64 binary for ARM64 (will run via Rosetta 2)..."
                cp "$BIN_DIR/ffmpeg-darwin-amd64" "$BIN_DIR/ffmpeg-darwin-arm64"
                echo "✅ macOS ARM64: ffmpeg-darwin-arm64 (via AMD64)"
            else
                download_ffmpeg \
                    "macOS ARM64" \
                    "https://evermeet.cx/ffmpeg/ffmpeg-6.1.1.zip" \
                    "ffmpeg-darwin-arm64" \
                    "unzip -q ffmpeg.archive"
            fi
        fi
    else
        echo "✓ macOS ARM64 already exists"
    fi
fi

# Windows AMD64
if should_download_platform "mingw" "amd64" || should_download_platform "msys" "amd64" || should_download_platform "cygwin" "amd64"; then
    if [ ! -f "$BIN_DIR/ffmpeg-windows-amd64.exe" ] || [ ! -s "$BIN_DIR/ffmpeg-windows-amd64.exe" ]; then
        echo "📥 Downloading ffmpeg for Windows AMD64..."

        tmp_dir=$(mktemp -d)
        archive="$tmp_dir/ffmpeg.zip"

        curl -fsSL "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip" -o "$archive"

        echo "📦 Extracting ffmpeg..."
        cd "$tmp_dir"
        unzip -q "$archive"

        # Find ffmpeg.exe
        ffmpeg_exe=$(find . -type f -name "ffmpeg.exe" | head -n1)

        if [ -z "$ffmpeg_exe" ]; then
            echo "❌ Error: ffmpeg.exe not found in archive"
            rm -rf "$tmp_dir"
            exit 1
        fi

        cp "$ffmpeg_exe" "$BIN_DIR/ffmpeg-windows-amd64.exe"

        rm -rf "$tmp_dir"

        size=$(du -h "$BIN_DIR/ffmpeg-windows-amd64.exe" | cut -f1)
        echo "✅ Windows AMD64: ffmpeg-windows-amd64.exe ($size)"
        echo ""
    else
        echo "✓ Windows AMD64 already exists"
    fi
fi

echo ""
echo "========================================="
if [ "$DOWNLOAD_ALL" = true ]; then
    echo "✅ All platform ffmpeg binaries downloaded"
else
    echo "✅ Current platform ffmpeg binary ready"
fi
echo "========================================="
echo ""
echo "Downloaded binaries:"
ls -lh "$BIN_DIR" | grep ffmpeg || echo "  (none yet)"
echo ""
echo "Total size:"
du -sh "$BIN_DIR"
echo ""
echo "These binaries will be embedded in the Go binary during build."
echo ""
if [ "$DOWNLOAD_ALL" = false ]; then
    echo "Tip: Run './download-ffmpeg.sh --all' to download for all platforms"
fi
