#!/usr/bin/env bun

const API_URL = process.env.API_URL || "http://localhost:8080";
const AUDIO_FILE = process.argv[2];

console.log("===========================================");
console.log("Whisper Server API Test Script");
console.log("===========================================");
console.log("");

// Test 1: List Models (OpenAI-compatible)
console.log("1. Testing models endpoint (OpenAI-compatible)...");
try {
  const modelsResponse = await fetch(`${API_URL}/v1/models`);
  const modelsData = await modelsResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(modelsData, null, 2));

  if (modelsData.data || modelsData.id) {
    console.log("✓ Models endpoint passed");
  } else {
    console.log("✗ Models endpoint failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Models endpoint failed:", error);
  process.exit(1);
}

console.log("");

// Test 2: Transcription
if (AUDIO_FILE) {
  if (!Bun.file(AUDIO_FILE).size) {
    console.log(`✗ Audio file not found: ${AUDIO_FILE}`);
    process.exit(1);
  }

  console.log("2. Testing transcription (OpenAI-compatible endpoint)...");
  console.log(`Audio file: ${AUDIO_FILE}`);
  console.log("");

  try {
    console.log("Sending request...");

    const formData = new FormData();
    const audioBlob = Bun.file(AUDIO_FILE);
    formData.append("file", audioBlob);

    const transcribeResponse = await fetch(
      `${API_URL}/v1/audio/transcriptions`,
      {
        method: "POST",
        body: formData,
      }
    );

    const transcribeData = await transcribeResponse.json();

    console.log("Response:");
    console.log(JSON.stringify(transcribeData, null, 2));

    if (transcribeData.text) {
      console.log("");
      console.log("✓ OpenAI-compatible transcription passed");
    } else {
      console.log("");
      console.log("✗ OpenAI-compatible transcription failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("✗ Transcription test failed:", error);
    process.exit(1);
  }
} else {
  console.log("2. Skipping transcription tests (no audio file provided)");
  console.log("");
  console.log(`Usage: bun ${import.meta.file} <audio-file>`);
  console.log("Example: bun test-api.ts sample.wav");
  console.log("         bun test-api.ts sample.mp3  # Auto-converts to WAV");
}

console.log("");
console.log("===========================================");
console.log("All tests completed successfully!");
console.log("===========================================");
