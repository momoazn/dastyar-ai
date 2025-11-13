#!/bin/bash

# Script to download Whisper models

set -e

# Default values
MODEL_DIR="./models"
MODEL_NAME="${1:-ggml-base.bin}"

# Model URLs from whisper.cpp repository
declare -A MODEL_URLS=(
    ["ggml-tiny.bin"]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin"
    ["ggml-tiny-q5_1.bin"]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-q5_1.bin"
    ["ggml-base.bin"]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin"
    ["ggml-base-q5_1.bin"]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin"
    ["ggml-small.bin"]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin"
    ["ggml-small-q5_1.bin"]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q5_1.bin"
    ["ggml-medium.bin"]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin"
    ["ggml-medium-q5_0.bin"]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium-q5_0.bin"
    ["ggml-large-v3.bin"]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin"
    ["ggml-large-v3-q5_0.bin"]="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-q5_0.bin"
)

# Create models directory if it doesn't exist
mkdir -p "$MODEL_DIR"

# Check if model name is valid
if [[ ! -v MODEL_URLS[$MODEL_NAME] ]]; then
    echo "Error: Unknown model '$MODEL_NAME'"
    echo ""
    echo "Available models:"
    for model in "${!MODEL_URLS[@]}"; do
        echo "  - $model"
    done
    exit 1
fi

MODEL_PATH="${MODEL_DIR}/${MODEL_NAME}"
MODEL_URL="${MODEL_URLS[$MODEL_NAME]}"

# Check if model already exists
if [ -f "$MODEL_PATH" ]; then
    echo "Model already exists at $MODEL_PATH"
    read -p "Do you want to re-download? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping download."
        exit 0
    fi
fi

echo "Downloading $MODEL_NAME from HuggingFace..."
echo "URL: $MODEL_URL"
echo "Destination: $MODEL_PATH"
echo ""

# Download the model
curl -L --progress-bar "$MODEL_URL" -o "$MODEL_PATH"

echo ""
echo "Download complete!"
echo "Model saved to: $MODEL_PATH"
echo ""
echo "You can now start the server with:"
echo "  MODEL_NAME=$MODEL_NAME ./whisper"
echo ""
echo "Or simply run:"
echo "  ./whisper"
