#!/usr/bin/env bun

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "../..");
const DIST = join(ROOT, "dist");
const SERVER_DIST = join(ROOT, "apps/server/dist");
const WHISPER_DIR = join(ROOT, "apps/whisper");

type PackageDistOptions = {
  platform?: "current" | "windows" | "all";
};

const resolveTargetWindows = (
  platform?: PackageDistOptions["platform"]
): boolean => {
  if (platform === "windows") {
    return true;
  }
  return process.platform === "win32";
};

export function packageDist(options: PackageDistOptions = {}): void {
  const isWindowsTarget = resolveTargetWindows(options.platform);

  console.log("📦 Packaging distribution...");

  resetDistDirectory();
  copyWebAssets();
  copyServerBinaries(options.platform, isWindowsTarget);
  copyWhisperBinary(isWindowsTarget);
  copyWhisperModels();
  copyFfmpegBinary(isWindowsTarget);
  copyConfigFile();
  createDistReadme(isWindowsTarget);

  console.log("✅ Distribution packaged successfully\n");
}

function resetDistDirectory(): void {
  // Always package from a clean output directory to avoid stale binaries.
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
}

function copyWebAssets(): void {
  const webSrc = join(ROOT, "apps/web/dist");
  const webDest = join(DIST, "web");
  if (!existsSync(webSrc)) {
    return;
  }

  console.log("  → Copying web assets...");
  cpSync(webSrc, webDest, { recursive: true, force: true });
}

function getServerBinaryNames(
  platform: PackageDistOptions["platform"],
  isWindowsTarget: boolean
): string[] {
  if (platform === "all") {
    return ["dastyar-ai", "dastyar-ai.exe"];
  }
  return [isWindowsTarget ? "dastyar-ai.exe" : "dastyar-ai"];
}

function copyServerBinaries(
  platform: PackageDistOptions["platform"],
  isWindowsTarget: boolean
): void {
  const allowMissing = platform === "all";
  const serverBinaries = getServerBinaryNames(platform, isWindowsTarget);

  console.log("  → Copying server binary...");

  let copiedServerBinary = false;
  for (const binaryName of serverBinaries) {
    const serverSrc = join(SERVER_DIST, binaryName);
    const serverDest = join(DIST, binaryName);

    if (existsSync(serverSrc)) {
      cpSync(serverSrc, serverDest, { force: true });
      copiedServerBinary = true;
      continue;
    }

    if (allowMissing) {
      console.warn(`  ⚠️  Server binary not found: ${serverSrc}`);
      continue;
    }

    throw new Error(`Expected server binary was not found: ${serverSrc}`);
  }

  if (!copiedServerBinary) {
    throw new Error("No server binary was copied into dist/");
  }
}

function copyWhisperBinary(isWindowsTarget: boolean): void {
  const whisperBinName = isWindowsTarget ? "whisper.exe" : "whisper";
  const whisperSrc = join(WHISPER_DIR, whisperBinName);
  const whisperDest = join(DIST, whisperBinName);
  if (!existsSync(whisperSrc)) {
    console.warn(`  ⚠️  Whisper binary not found for target: ${whisperSrc}`);
    return;
  }

  console.log("  → Copying whisper binary...");
  cpSync(whisperSrc, whisperDest);
}

function copyWhisperModels(): void {
  const modelsSrc = join(WHISPER_DIR, "models");
  const modelsDest = join(DIST, "models");
  if (!existsSync(modelsSrc)) {
    mkdirSync(modelsDest, { recursive: true });
    return;
  }

  console.log("  → Copying whisper models...");
  cpSync(modelsSrc, modelsDest, { recursive: true, force: true });
}

function getFfmpegFileName(isWindowsTarget: boolean): string {
  if (isWindowsTarget) {
    return "ffmpeg-windows-amd64.exe";
  }
  if (process.arch === "arm64") {
    return `ffmpeg-${process.platform}-arm64`;
  }
  return `ffmpeg-${process.platform}-amd64`;
}

function copyFfmpegBinary(isWindowsTarget: boolean): void {
  const ffmpegName = getFfmpegFileName(isWindowsTarget);
  const ffmpegSrc = join(WHISPER_DIR, "ffmpeg-binaries", ffmpegName);
  const ffmpegDest = join(DIST, isWindowsTarget ? "ffmpeg.exe" : "ffmpeg");
  if (!existsSync(ffmpegSrc)) {
    console.warn(`  ⚠️  FFmpeg binary not found for target: ${ffmpegSrc}`);
    return;
  }

  console.log("  → Copying FFmpeg...");
  cpSync(ffmpegSrc, ffmpegDest);
}

function copyConfigFile(): void {
  const configSrc = join(ROOT, "config.json");
  const configPath = join(DIST, "config.json");
  if (existsSync(configSrc)) {
    console.log("  → Copying config.json...");
    cpSync(configSrc, configPath, { force: true });
    return;
  }

  if (!existsSync(configPath)) {
    console.log("  → Creating default config...");
    createDefaultConfig(configPath);
  }
}

function createDistReadme(isWindowsTarget: boolean): void {
  const readmePath = join(DIST, "README.md");
  console.log("  → Creating README...");
  createReadme(readmePath, isWindowsTarget);
}

function createDefaultConfig(path: string): void {
  const config = {
    PORT: 3000,
    HOST: "0.0.0.0",
    CORS_ORIGIN: "*",
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

function createReadme(path: string, isWindowsTarget: boolean): void {
  const serverBin = isWindowsTarget ? "dastyar-ai.exe" : "./dastyar-ai";
  const whisperBin = isWindowsTarget ? "whisper.exe" : "./whisper";

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
