#!/usr/bin/env bun

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "../..");
const DIST = join(ROOT, "dist");
const isWindows = process.platform === "win32";

export function packageDist(): void {
  console.log("📦 Packaging distribution...");

  // Ensure dist directory exists
  mkdirSync(DIST, { recursive: true });

  // Copy web assets
  const webSrc = join(ROOT, "apps/web/dist");
  const webDest = join(DIST, "web");
  if (existsSync(webSrc)) {
    console.log("  → Copying web assets...");
    cpSync(webSrc, webDest, { recursive: true, force: true });
  }

  // Copy server binary
  const serverSrc = join(ROOT, "apps/server/dist");
  if (existsSync(serverSrc)) {
    console.log("  → Copying server binary...");
    cpSync(serverSrc, DIST, { recursive: true, force: true });
  }

  // Copy whisper binary
  const whisperBinName = isWindows ? "whisper.exe" : "whisper";
  const whisperSrc = join(ROOT, `apps/whisper/${whisperBinName}`);
  const whisperDest = join(DIST, whisperBinName);
  if (existsSync(whisperSrc)) {
    console.log("  → Copying whisper binary...");
    cpSync(whisperSrc, whisperDest);
  }

  // Copy whisper models
  const modelsSrc = join(ROOT, "apps/whisper/models");
  const modelsDest = join(DIST, "models");
  if (existsSync(modelsSrc)) {
    console.log("  → Copying whisper models...");
    cpSync(modelsSrc, modelsDest, { recursive: true, force: true });
  } else {
    mkdirSync(modelsDest, { recursive: true });
  }

  // Copy FFmpeg
  const ffmpegBinDir = join(ROOT, "apps/whisper/ffmpeg-binaries");
  const ffmpegName = isWindows
    ? "ffmpeg-windows-amd64.exe"
    : process.arch === "arm64"
      ? `ffmpeg-${process.platform}-arm64`
      : `ffmpeg-${process.platform}-amd64`;
  const ffmpegSrc = join(ffmpegBinDir, ffmpegName);
  const ffmpegDest = join(DIST, isWindows ? "ffmpeg.exe" : "ffmpeg");

  if (existsSync(ffmpegSrc)) {
    console.log("  → Copying FFmpeg...");
    cpSync(ffmpegSrc, ffmpegDest);
  }

  // Create default config
  const configPath = join(DIST, "config.json");
  if (!existsSync(configPath)) {
    console.log("  → Creating default config...");
    createDefaultConfig(configPath);
  }

  // Create README
  const readmePath = join(DIST, "README.md");
  console.log("  → Creating README...");
  createReadme(readmePath);

  console.log("✅ Distribution packaged successfully\n");
}

function createDefaultConfig(path: string): void {
  const config = {
    PORT: 3000,
    HOST: "127.0.0.1",
    CORS_ORIGIN: "http://localhost:3000,http://localhost:5173",
    JWT_SECRET:
      "your-super-secret-jwt-key-change-this-in-production-min-32-chars",
    JWT_EXPIRES_IN: 86_400,
    DATABASE_FILE: "./data.db",
    WHISPER_SERVER_URL: "http://127.0.0.1:8080",
    WHISPER_TIMEOUT_MS: 120_000,
    WHISPER_MODELS: "tiny",
    OLLAMA_BASE_URL: "http://localhost:11434",
    OLLAMA_ENABLED: true,
    LMSTUDIO_BASE_URL: "http://localhost:1234/v1",
    LMSTUDIO_ENABLED: true,
    GROQ_API_KEY: "",
    GROQ_ENABLED: false,
    GEMINI_API_KEY: "",
    GEMINI_ENABLED: false,
    STABLE_DIFFUSION_URL: "http://localhost:7860",
    STABLE_DIFFUSION_ENABLED: true,
    IMAGES_DIR: "./generated-images",
    DOCUMENTS_DIR: "./uploaded-documents",
    EMBEDDING_MODEL: "nomic-embed-text",
    WEB_DIST_DIR: "./web",
  };

  writeFileSync(path, JSON.stringify(config, null, 2));
}

function createReadme(path: string): void {
  const serverBin = isWindows ? "dastyar-ai.exe" : "./dastyar-ai";
  const whisperBin = isWindows ? "whisper.exe" : "./whisper";

  const readme = `# Dastyar AI - Distribution

This folder contains standalone executable binaries for Dastyar AI.

## Quick Start

### 1. Start Whisper API (Terminal 1)
\`\`\`bash
${whisperBin}
\`\`\`

### 2. Start Main Server (Terminal 2)
\`\`\`bash
${serverBin}
\`\`\`

### 3. Open in Browser
Open http://localhost:3000

## Configuration

Edit \`config.json\` to customize settings. Important:
- Change \`JWT_SECRET\` for production
- Configure external services (Ollama, LM Studio, etc.)

## Requirements

All binaries are self-contained. Optional external services:
- Ollama (for local LLM): https://ollama.ai
- Stable Diffusion WebUI: https://github.com/AUTOMATIC1111/stable-diffusion-webui

See config.json to enable/disable services.
`;

  writeFileSync(path, readme);
}

// Run if executed directly
if (import.meta.main) {
  packageDist();
}
