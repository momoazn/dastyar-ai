#!/bin/bash

# Test script for Whisper Server API

set -e

API_URL="${API_URL:-http://localhost:8080}"
AUDIO_FILE="${1}"

echo "==========================================="
echo "Whisper Server API Test Script"
echo "==========================================="
echo ""

# Test 1: Health Check (Python-compatible)
echo "1. Testing health endpoint (Python-compatible)..."
HEALTH_RESPONSE=$(curl -s "${API_URL}/health")
echo "Response: ${HEALTH_RESPONSE}"

if echo "${HEALTH_RESPONSE}" | grep -q "ok"; then
    echo "✓ Health check passed"
else
    echo "✗ Health check failed"
    exit 1
fi

echo ""

# Test 2: List Models (Python-compatible)
echo "2. Testing models endpoint (Python-compatible)..."
MODELS_RESPONSE=$(curl -s "${API_URL}/models")
echo "Response:"
echo "${MODELS_RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${MODELS_RESPONSE}"

if echo "${MODELS_RESPONSE}" | grep -q "id"; then
    echo "✓ Models endpoint passed"
else
    echo "✗ Models endpoint failed"
    exit 1
fi

echo ""

# Test 3: List Models (v1 API)
echo "3. Testing models endpoint (v1 API)..."
MODELS_V1_RESPONSE=$(curl -s "${API_URL}/api/v1/models")
echo "Response:"
echo "${MODELS_V1_RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${MODELS_V1_RESPONSE}"

if echo "${MODELS_V1_RESPONSE}" | grep -q "id"; then
    echo "✓ Models v1 endpoint passed"
else
    echo "✗ Models v1 endpoint failed"
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

    echo "4a. Testing transcription (Python-compatible endpoint)..."
    echo "Audio file: ${AUDIO_FILE}"
    echo ""

    echo "Sending request..."
    TRANSCRIBE_RESPONSE=$(curl -s -X POST \
        -F "file=@${AUDIO_FILE}" \
        "${API_URL}/transcribe")

    echo "Response:"
    echo "${TRANSCRIBE_RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${TRANSCRIBE_RESPONSE}"

    if echo "${TRANSCRIBE_RESPONSE}" | grep -q "text"; then
        echo ""
        echo "✓ Python-compatible transcription passed"
    else
        echo ""
        echo "✗ Python-compatible transcription failed"
        exit 1
    fi

    echo ""
    echo "4b. Testing transcription (v1 API with metadata)..."

    TRANSCRIBE_V1_RESPONSE=$(curl -s -X POST \
        -F "audio=@${AUDIO_FILE}" \
        "${API_URL}/api/v1/transcribe")

    echo "Response:"
    echo "${TRANSCRIBE_V1_RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${TRANSCRIBE_V1_RESPONSE}"

    if echo "${TRANSCRIBE_V1_RESPONSE}" | grep -q "text"; then
        echo ""
        echo "✓ v1 API transcription passed"
    else
        echo ""
        echo "✗ v1 API transcription failed"
        exit 1
    fi
fi

echo ""
echo "==========================================="
echo "All tests completed successfully!"
echo "==========================================="
