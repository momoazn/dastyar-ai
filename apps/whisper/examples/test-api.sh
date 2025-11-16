#!/bin/bash

# Test script for Whisper Server API

set -e

API_URL="${API_URL:-http://localhost:8080}"
AUDIO_FILE="${1}"

echo "==========================================="
echo "Whisper Server API Test Script"
echo "==========================================="
echo ""

# Test 1: List Models (OpenAI-compatible)
echo "1. Testing models endpoint (OpenAI-compatible)..."
MODELS_RESPONSE=$(curl -s "${API_URL}/v1/models")
echo "Response:"
echo "${MODELS_RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${MODELS_RESPONSE}"

if echo "${MODELS_RESPONSE}" | grep -q "id"; then
    echo "✓ Models endpoint passed"
else
    echo "✗ Models endpoint failed"
    exit 1
fi

echo ""

# Test 4: Transcription
if [ -z "${AUDIO_FILE}" ]; then
    echo "4. Skipping transcription tests (no audio file provided)"
    echo ""
    echo "Usage: $0 <audio-file>"
    echo "Example: $0 sample.wav"
    echo "         $0 sample.mp3  # Auto-converts to WAV"
else
    if [ ! -f "${AUDIO_FILE}" ]; then
        echo "✗ Audio file not found: ${AUDIO_FILE}"
        exit 1
    fi

    echo "2. Testing transcription (OpenAI-compatible endpoint)..."
    echo "Audio file: ${AUDIO_FILE}"
    echo ""

    echo "Sending request..."
    TRANSCRIBE_RESPONSE=$(curl -s -X POST \
        -F "file=@${AUDIO_FILE}" \
        "${API_URL}/v1/audio/transcriptions")

    echo "Response:"
    echo "${TRANSCRIBE_RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${TRANSCRIBE_RESPONSE}"

    if echo "${TRANSCRIBE_RESPONSE}" | grep -q "text"; then
        echo ""
        echo "✓ OpenAI-compatible transcription passed"
    else
        echo ""
        echo "✗ OpenAI-compatible transcription failed"
        exit 1
    fi
fi

echo ""
echo "==========================================="
echo "All tests completed successfully!"
echo "==========================================="
