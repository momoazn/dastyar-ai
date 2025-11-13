#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_DIR="$SCRIPT_DIR/internal/ffmpeg/bin"

echo "========================================="
echo "Downloading ffmpeg binaries for embedding"
echo "========================================="
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

# Linux AMD64
if [ ! -f "$BIN_DIR/ffmpeg-linux-amd64" ] || [ ! -s "$BIN_DIR/ffmpeg-linux-amd64" ]; then
    download_ffmpeg \
        "Linux AMD64" \
        "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz" \
        "ffmpeg-linux-amd64" \
        "tar -xJf ffmpeg.archive"
else
    echo "✓ Linux AMD64 already exists"
fi

# Linux ARM64
if [ ! -f "$BIN_DIR/ffmpeg-linux-arm64" ] || [ ! -s "$BIN_DIR/ffmpeg-linux-arm64" ]; then
    download_ffmpeg \
        "Linux ARM64" \
        "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz" \
        "ffmpeg-linux-arm64" \
        "tar -xJf ffmpeg.archive"
else
    echo "✓ Linux ARM64 already exists"
fi

# macOS AMD64
if [ ! -f "$BIN_DIR/ffmpeg-darwin-amd64" ] || [ ! -s "$BIN_DIR/ffmpeg-darwin-amd64" ]; then
    download_ffmpeg \
        "macOS AMD64" \
        "https://evermeet.cx/ffmpeg/ffmpeg-6.1.1.zip" \
        "ffmpeg-darwin-amd64" \
        "unzip -q ffmpeg.archive"
else
    echo "✓ macOS AMD64 already exists"
fi

# macOS ARM64 (Apple Silicon)
if [ ! -f "$BIN_DIR/ffmpeg-darwin-arm64" ] || [ ! -s "$BIN_DIR/ffmpeg-darwin-arm64" ]; then
    # For now, use the same as AMD64 (universal binary or Rosetta 2)
    # In the future, we can get a proper ARM64 build
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
else
    echo "✓ macOS ARM64 already exists"
fi

# Windows AMD64
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

echo ""
echo "========================================="
echo "✅ All ffmpeg binaries downloaded"
echo "========================================="
echo ""
echo "Downloaded binaries:"
ls -lh "$BIN_DIR"
echo ""
echo "Total size:"
du -sh "$BIN_DIR"
echo ""
echo "These binaries will be embedded in the Go binary during build."
