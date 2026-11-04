#!/usr/bin/env bun

import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import JSZip from "jszip";
import { runCommand } from "./run-command";

type TargetOS = "linux" | "darwin" | "win32";
type TargetArch = "amd64" | "arm64";

type FfmpegTarget = {
  arch: TargetArch;
  os: TargetOS;
};

type FfmpegPlatform = {
  arch: TargetArch;
  extractCmd: "tar" | "zip";
  fileName: string;
  name: string;
  os: TargetOS;
  url: string;
};

type EnsureFfmpegOptions = {
  binDir: string;
  force?: boolean;
  preferLocalMacBinary?: boolean;
  target?: FfmpegTarget;
};

type DownloadFfmpegOptions = {
  all: boolean;
  binDir: string;
  force?: boolean;
  preferLocalMacBinary?: boolean;
};

type EnsureModelOptions = {
  force?: boolean;
  modelDir: string;
  modelName: string;
};

const FFMPEG_PLATFORMS: FfmpegPlatform[] = [
  {
    name: "Linux AMD64",
    os: "linux",
    arch: "amd64",
    url: "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz",
    fileName: "ffmpeg-linux-amd64",
    extractCmd: "tar",
  },
  {
    name: "Linux ARM64",
    os: "linux",
    arch: "arm64",
    url: "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz",
    fileName: "ffmpeg-linux-arm64",
    extractCmd: "tar",
  },
  {
    name: "macOS AMD64",
    os: "darwin",
    arch: "amd64",
    url: "https://evermeet.cx/ffmpeg/ffmpeg-6.1.1.zip",
    fileName: "ffmpeg-darwin-amd64",
    extractCmd: "zip",
  },
  {
    name: "macOS ARM64",
    os: "darwin",
    arch: "arm64",
    url: "https://evermeet.cx/ffmpeg/ffmpeg-6.1.1.zip",
    fileName: "ffmpeg-darwin-arm64",
    extractCmd: "zip",
  },
  {
    name: "Windows AMD64",
    os: "win32",
    arch: "amd64",
    url: "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip",
    fileName: "ffmpeg-windows-amd64.exe",
    extractCmd: "zip",
  },
];

export const WHISPER_MODEL_URLS = {
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
} as const;

export const WHISPER_MODEL_NAMES = Object.keys(WHISPER_MODEL_URLS) as Array<
  keyof typeof WHISPER_MODEL_URLS
>;

function normalizeArch(arch: string): TargetArch {
  if (arch === "x64") {
    return "amd64";
  }
  if (arch === "arm64") {
    return "arm64";
  }
  return "amd64";
}

export function getCurrentFfmpegTarget(): FfmpegTarget {
  return {
    os: process.platform as TargetOS,
    arch: normalizeArch(process.arch),
  };
}

function getFfmpegPlatform(target: FfmpegTarget): FfmpegPlatform {
  const platform = FFMPEG_PLATFORMS.find(
    (item) => item.os === target.os && item.arch === target.arch
  );
  if (!platform) {
    throw new Error(`Unsupported FFmpeg target: ${target.os}-${target.arch}`);
  }
  return platform;
}

function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function formatFileSize(path: string): string {
  return `${(statSync(path).size / 1024 / 1024).toFixed(1)}MB`;
}

function findExtractedBinary(dir: string): string | undefined {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const fromChild = findExtractedBinary(fullPath);
      if (fromChild) {
        return fromChild;
      }
      continue;
    }
    if (entry.name === "ffmpeg" || entry.name === "ffmpeg.exe") {
      return fullPath;
    }
  }
}

async function extractTarArchive(
  archivePath: string,
  outputPath: string,
  workDir: string
): Promise<void> {
  const tmpDir = join(workDir, ".tmp-ffmpeg-extract");
  rmSync(tmpDir, { recursive: true, force: true });
  ensureDir(tmpDir);

  try {
    await runCommand("tar", ["-xJf", archivePath, "-C", tmpDir]);

    const extracted = findExtractedBinary(tmpDir);
    if (!extracted) {
      throw new Error("ffmpeg binary not found in tar archive");
    }

    copyFileSync(extracted, outputPath);
    if (!outputPath.endsWith(".exe")) {
      chmodSync(outputPath, 0o755);
    }
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

async function extractZipArchive(
  archivePath: string,
  outputPath: string
): Promise<void> {
  const zipData = await Bun.file(archivePath).arrayBuffer();
  const zip = await new JSZip().loadAsync(zipData);

  const entry = Object.values(zip.files).find((file) => {
    if (file.dir) {
      return false;
    }
    const baseName = file.name.split("/").at(-1) ?? "";
    return baseName === "ffmpeg" || baseName === "ffmpeg.exe";
  });

  if (!entry) {
    throw new Error("ffmpeg binary not found in zip archive");
  }

  const data = await entry.async("arraybuffer");
  await Bun.write(outputPath, data);
  if (!outputPath.endsWith(".exe")) {
    chmodSync(outputPath, 0o755);
  }
}

// ponytail: one total time limit per download. Upgrade path: a stall timer
// that resets on each chunk.
const DOWNLOAD_TIMEOUT_MS = 60 * 60 * 1000;

async function downloadToFile(url: string, outputPath: string): Promise<void> {
  // Write to a temp file and rename at the end. A failed or cut download
  // must not leave a file that later runs treat as complete.
  const partPath = `${outputPath}.part`;
  rmSync(partPath, { force: true });

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(
        `Failed to download ${url}: ${response.status} ${response.statusText}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error(`Failed to read response body for ${url}`);
    }

    const expected = Number(response.headers.get("content-length") ?? 0);
    let received = 0;
    const writer = Bun.file(partPath).writer();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        received += value.byteLength;
        writer.write(value);
      }
    } finally {
      await writer.end();
    }

    if (expected > 0 && received !== expected) {
      throw new Error(
        `Incomplete download of ${url}: got ${received} of ${expected} bytes`
      );
    }
    renameSync(partPath, outputPath);
  } catch (error) {
    rmSync(partPath, { force: true });
    throw error;
  }
}

function tryUseLocalMacFfmpeg(outputPath: string): boolean {
  if (process.platform !== "darwin") {
    return false;
  }

  const ffmpegPath = Bun.which("ffmpeg");
  if (!ffmpegPath) {
    return false;
  }

  copyFileSync(ffmpegPath, outputPath);
  chmodSync(outputPath, 0o755);
  return true;
}

async function downloadPlatformFfmpeg(
  platform: FfmpegPlatform,
  binDir: string,
  force = false,
  preferLocalMacBinary = true
): Promise<string> {
  ensureDir(binDir);
  const outputPath = join(binDir, platform.fileName);
  if (!force && existsSync(outputPath)) {
    return outputPath;
  }

  if (!force && preferLocalMacBinary && platform.os === "darwin") {
    const usedLocal = tryUseLocalMacFfmpeg(outputPath);
    if (usedLocal) {
      return outputPath;
    }
  }

  const archivePath = join(
    binDir,
    `ffmpeg-${platform.os}-${platform.arch}.archive`
  );
  if (force || !existsSync(archivePath)) {
    await downloadToFile(platform.url, archivePath);
  }

  if (platform.extractCmd === "tar") {
    await extractTarArchive(archivePath, outputPath, binDir);
  } else {
    await extractZipArchive(archivePath, outputPath);
  }

  return outputPath;
}

export async function ensureFfmpegForTarget(
  options: EnsureFfmpegOptions
): Promise<string> {
  const target = options.target ?? getCurrentFfmpegTarget();
  const platform = getFfmpegPlatform(target);
  return await downloadPlatformFfmpeg(
    platform,
    options.binDir,
    options.force ?? false,
    options.preferLocalMacBinary ?? true
  );
}

export async function downloadFfmpegBinaries(
  options: DownloadFfmpegOptions
): Promise<string[]> {
  const selected = options.all
    ? FFMPEG_PLATFORMS
    : [getFfmpegPlatform(getCurrentFfmpegTarget())];
  const binaries: string[] = [];

  for (const platform of selected) {
    const binaryPath = await downloadPlatformFfmpeg(
      platform,
      options.binDir,
      options.force ?? false,
      options.preferLocalMacBinary ?? true
    );
    binaries.push(binaryPath);
  }

  return binaries;
}

export async function ensureWhisperModel(
  options: EnsureModelOptions
): Promise<string> {
  ensureDir(options.modelDir);
  const modelUrl = WHISPER_MODEL_URLS[options.modelName];
  if (!modelUrl) {
    throw new Error(`Unknown Whisper model: ${options.modelName}`);
  }

  const outputPath = join(options.modelDir, options.modelName);
  if (existsSync(outputPath) && !options.force) {
    return outputPath;
  }

  await downloadToFile(modelUrl, outputPath);
  return outputPath;
}

export function listWhisperModelsInDir(modelDir: string): string[] {
  if (!existsSync(modelDir)) {
    return [];
  }
  return readdirSync(modelDir).filter((name) => name.endsWith(".bin"));
}

export function getFormattedAssetList(paths: string[]): string[] {
  return paths.map((path) => `${path} (${formatFileSize(path)})`);
}
