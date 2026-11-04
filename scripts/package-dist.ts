#!/usr/bin/env bun

import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_CONFIG } from "../apps/server/src/config-schema";
import { withTag } from "./build-log";
import {
  DIST_DIR,
  REPO_ROOT,
  SERVER_APP_DIR,
  WHISPER_APP_DIR,
} from "./project-paths";

const ROOT = REPO_ROOT;
const DIST = DIST_DIR;
const SERVER_DIST = join(SERVER_APP_DIR, "dist");
const WHISPER_DIR = WHISPER_APP_DIR;

type PackageDistOptions = {
  appVersion: string;
  platform?: "current" | "windows" | "all";
  release?: boolean;
};

export type PackageDistResult = {
  artifacts: string[];
  warnings: string[];
};

const resolveTargetWindows = (
  platform?: PackageDistOptions["platform"]
): boolean => {
  if (platform === "windows") {
    return true;
  }
  return process.platform === "win32";
};

export async function packageDist(
  options: PackageDistOptions
): Promise<PackageDistResult> {
  const isWindowsTarget = resolveTargetWindows(options.platform);
  const warnings: string[] = [];
  const artifacts: string[] = [];

  console.log(withTag("step", "Packaging distribution..."));

  resetDistDirectory();
  if (copyWebAssets()) {
    artifacts.push("web/");
  }
  artifacts.push(
    ...copyServerBinaries(options.platform, isWindowsTarget, options, warnings)
  );
  const whisperBinary = copyWhisperBinary(isWindowsTarget, warnings);
  if (whisperBinary) {
    artifacts.push(whisperBinary);
  }
  if (copyWhisperModels()) {
    artifacts.push("models/");
  }
  const ffmpegBinary = copyFfmpegBinary(isWindowsTarget, warnings);
  if (ffmpegBinary) {
    artifacts.push(ffmpegBinary);
  }
  await copyConfigFile();
  artifacts.push("config.json");
  await copyBuildInfoFile(options.appVersion, options.release ?? false);
  artifacts.push("build-info.json");
  await createDistReadme(isWindowsTarget, options);
  artifacts.push("README.md");
  await verifyDistribution(options);

  console.log(`${withTag("ok", "Distribution packaged successfully")}\n`);
  return { artifacts, warnings };
}

function resetDistDirectory(): void {
  // Always package from a clean output directory to avoid stale binaries.
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
}

function copyWebAssets(): boolean {
  const webSrc = join(ROOT, "apps/web/dist");
  const webDest = join(DIST, "web");
  if (!existsSync(webSrc)) {
    return false;
  }

  console.log(`  ${withTag("info", "Copying web assets...")}`);
  cpSync(webSrc, webDest, { recursive: true, force: true });
  return true;
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

function getDistServerBinaryName(
  sourceBinaryName: string,
  options: PackageDistOptions
): string {
  if (!options.release) {
    return sourceBinaryName;
  }

  const versionTag = `v${options.appVersion}`;
  if (sourceBinaryName.endsWith(".exe")) {
    return `dastyar-ai-${versionTag}.exe`;
  }
  return `dastyar-ai-${versionTag}`;
}

function copyServerBinaries(
  platform: PackageDistOptions["platform"],
  isWindowsTarget: boolean,
  options: PackageDistOptions,
  warnings: string[]
): string[] {
  const allowMissing = platform === "all";
  const serverBinaries = getServerBinaryNames(platform, isWindowsTarget);
  const copiedBinaries: string[] = [];

  console.log(`  ${withTag("info", "Copying server binary...")}`);

  let copiedServerBinary = false;
  for (const binaryName of serverBinaries) {
    const serverSrc = join(SERVER_DIST, binaryName);
    const distName = getDistServerBinaryName(binaryName, options);
    const serverDest = join(DIST, distName);

    if (existsSync(serverSrc)) {
      cpSync(serverSrc, serverDest, { force: true });
      copiedServerBinary = true;
      copiedBinaries.push(distName);
      continue;
    }

    if (allowMissing) {
      warnings.push(`Server binary not found: ${serverSrc}`);
      continue;
    }

    throw new Error(`Expected server binary was not found: ${serverSrc}`);
  }

  if (!copiedServerBinary) {
    throw new Error("No server binary was copied into dist/");
  }
  return copiedBinaries;
}

function copyWhisperBinary(
  isWindowsTarget: boolean,
  warnings: string[]
): string | undefined {
  const whisperBinName = isWindowsTarget ? "whisper.exe" : "whisper";
  const whisperSrc = join(WHISPER_DIR, whisperBinName);
  const whisperDest = join(DIST, whisperBinName);
  if (!existsSync(whisperSrc)) {
    warnings.push(`Whisper binary not found for target: ${whisperSrc}`);
    return;
  }

  console.log(`  ${withTag("info", "Copying whisper binary...")}`);
  cpSync(whisperSrc, whisperDest);
  return whisperBinName;
}

function copyWhisperModels(): boolean {
  const modelsSrc = join(WHISPER_DIR, "models");
  const modelsDest = join(DIST, "models");
  if (!existsSync(modelsSrc)) {
    mkdirSync(modelsDest, { recursive: true });
    return false;
  }

  console.log(`  ${withTag("info", "Copying whisper models...")}`);
  cpSync(modelsSrc, modelsDest, { recursive: true, force: true });
  return true;
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

function copyFfmpegBinary(
  isWindowsTarget: boolean,
  warnings: string[]
): string | undefined {
  const ffmpegName = getFfmpegFileName(isWindowsTarget);
  const ffmpegSrc = join(WHISPER_DIR, "ffmpeg-binaries", ffmpegName);
  const ffmpegDest = join(DIST, isWindowsTarget ? "ffmpeg.exe" : "ffmpeg");
  if (!existsSync(ffmpegSrc)) {
    warnings.push(`FFmpeg binary not found for target: ${ffmpegSrc}`);
    return;
  }

  console.log(`  ${withTag("info", "Copying FFmpeg...")}`);
  cpSync(ffmpegSrc, ffmpegDest);
  return isWindowsTarget ? "ffmpeg.exe" : "ffmpeg";
}

async function copyConfigFile(): Promise<void> {
  const configPath = join(DIST, "config.json");
  const defaults = getDefaultConfig();
  console.log(
    `  ${withTag("info", "Writing default config from app defaults...")}`
  );
  await Bun.write(configPath, `${JSON.stringify(defaults, null, 2)}\n`);
}

async function copyBuildInfoFile(
  appVersion: string,
  release: boolean
): Promise<void> {
  const buildInfoPath = join(DIST, "build-info.json");
  const buildInfo = {
    version: appVersion,
    release,
    builtAt: new Date().toISOString(),
  };
  await Bun.write(buildInfoPath, `${JSON.stringify(buildInfo, null, 2)}\n`);
}

async function createDistReadme(
  isWindowsTarget: boolean,
  options: PackageDistOptions
): Promise<void> {
  const readmePath = join(DIST, "README.md");
  console.log(`  ${withTag("info", "Creating README...")}`);
  await createReadme(readmePath, isWindowsTarget, options);
}

function getDefaultConfig(): Record<string, unknown> {
  return { ...DEFAULT_CONFIG };
}

async function createReadme(
  path: string,
  isWindowsTarget: boolean,
  options: PackageDistOptions
): Promise<void> {
  let serverBin: string;
  if (options.release) {
    serverBin = isWindowsTarget
      ? `dastyar-ai-v${options.appVersion}.exe`
      : `./dastyar-ai-v${options.appVersion}`;
  } else {
    serverBin = isWindowsTarget ? "dastyar-ai.exe" : "./dastyar-ai";
  }
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
- The server replaces the placeholder \`JWT_SECRET\` with a random value on first start
- Configure Ollama endpoint if needed

## Requirements

All binaries are self-contained. Optional external services:
- Ollama (for local LLM): https://ollama.ai

See config.json to enable/disable services.
`;

  await Bun.write(path, readme);
}

async function verifyExists(path: string): Promise<void> {
  if (!(await Bun.file(path).exists())) {
    throw new Error(`Expected dist artifact is missing: ${path}`);
  }
}

export async function verifyDistribution(
  options: PackageDistOptions
): Promise<void> {
  const isWindowsTarget = resolveTargetWindows(options.platform);
  const serverBinary =
    options.platform === "all"
      ? undefined
      : join(
          DIST,
          getDistServerBinaryName(
            isWindowsTarget ? "dastyar-ai.exe" : "dastyar-ai",
            options
          )
        );
  const whisperBinary = join(DIST, isWindowsTarget ? "whisper.exe" : "whisper");

  await verifyExists(join(DIST, "config.json"));
  await verifyExists(join(DIST, "build-info.json"));
  await verifyExists(join(DIST, "README.md"));

  if (serverBinary) {
    await verifyExists(serverBinary);
  } else {
    const linuxOrMacServer = join(
      DIST,
      getDistServerBinaryName("dastyar-ai", options)
    );
    const windowsServer = join(
      DIST,
      getDistServerBinaryName("dastyar-ai.exe", options)
    );
    if (!(existsSync(linuxOrMacServer) || existsSync(windowsServer))) {
      throw new Error(
        "Expected at least one server binary in dist/ for platform=all"
      );
    }
  }

  if (
    existsSync(join(WHISPER_DIR, isWindowsTarget ? "whisper.exe" : "whisper"))
  ) {
    await verifyExists(whisperBinary);
  }
}

// Run if executed directly
if (import.meta.main) {
  await packageDist({
    appVersion: "0.0.0",
    platform: "current",
    release: false,
  });
}
