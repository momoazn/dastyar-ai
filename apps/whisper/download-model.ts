#!/usr/bin/env bun

import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const MODEL_DIR = "./models";
const MODEL_NAME = process.argv[2] || "ggml-base.bin";

const MODEL_URLS: Record<string, string> = {
  "ggml-tiny.bin":
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin",
  "ggml-tiny-q5_1.bin":
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny-q5_1.bin",
  "ggml-base.bin":
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin",
  "ggml-base-q5_1.bin":
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin",
  "ggml-small.bin":
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin",
  "ggml-small-q5_1.bin":
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small-q5_1.bin",
  "ggml-medium.bin":
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin",
  "ggml-medium-q5_0.bin":
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium-q5_0.bin",
  "ggml-large-v3.bin":
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin",
  "ggml-large-v3-q5_0.bin":
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-q5_0.bin",
};

// Create models directory if it doesn't exist
if (!existsSync(MODEL_DIR)) {
  mkdirSync(MODEL_DIR, { recursive: true });
}

// Check if model name is valid
if (!MODEL_URLS[MODEL_NAME]) {
  console.error(`Error: Unknown model '${MODEL_NAME}'`);
  console.error("");
  console.error("Available models:");
  for (const model of Object.keys(MODEL_URLS)) {
    console.error(`  - ${model}`);
  }
  process.exit(1);
}

const MODEL_PATH = join(MODEL_DIR, MODEL_NAME);
const MODEL_URL = MODEL_URLS[MODEL_NAME];

// Check if model already exists
if (existsSync(MODEL_PATH)) {
  console.log(`Model already exists at ${MODEL_PATH}`);
  console.log("Use --force to re-download");

  if (!process.argv.includes("--force")) {
    console.log("Skipping download.");
    process.exit(0);
  }

  console.log("Re-downloading model...");
}

console.log(`Downloading ${MODEL_NAME} from HuggingFace...`);
console.log(`URL: ${MODEL_URL}`);
console.log(`Destination: ${MODEL_PATH}`);
console.log("");

// Download the model
const response = await fetch(MODEL_URL);

if (!response.ok) {
  console.error(
    `Failed to download: ${response.status} ${response.statusText}`
  );
  process.exit(1);
}

const reader = response.body?.getReader();
if (!reader) {
  console.error("Failed to get response body reader");
  process.exit(1);
}

const total = Number(response.headers.get("content-length")) || 0;
let received = 0;

const file = Bun.file(MODEL_PATH).writer();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  received += value.length;
  file.write(value);

  if (total > 0) {
    const percent = ((received / total) * 100).toFixed(1);
    const mb = (received / 1024 / 1024).toFixed(1);
    const totalMb = (total / 1024 / 1024).toFixed(1);
    process.stdout.write(`\r  → Downloaded ${percent}% (${mb}/${totalMb} MB)`);
  }
}

console.log("");
console.log("");
console.log("Download complete!");
console.log(`Model saved to: ${MODEL_PATH}`);
console.log("");
console.log("You can now start the server with:");
console.log(`  MODEL_NAME=${MODEL_NAME} ./whisper`);
console.log("");
console.log("Or simply run:");
console.log("  ./whisper");
console.log("");
