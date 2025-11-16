#!/usr/bin/env bun

import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import JSZip from "jszip";

const SCRIPT_DIR = import.meta.dir;
const BIN_DIR = join(SCRIPT_DIR, "internal", "ffmpeg", "bin");

type Platform = {
  name: string;
  os: string;
  arch: string;
  url: string;
  fileName: string;
  extractCmd: "tar" | "zip";
};

const PLATFORMS: Platform[] = [
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

// Detect current platform
const CURRENT_OS = process.platform;
const CURRENT_ARCH = process.arch === "x64" ? "amd64" : "arm64";

const DOWNLOAD_ALL = process.argv.includes("--all");

console.log("=========================================");
if (DOWNLOAD_ALL) {
  console.log("Downloading ffmpeg for ALL platforms");
} else {
  console.log("Downloading ffmpeg for current platform");
  console.log(`Platform: ${CURRENT_OS}-${CURRENT_ARCH}`);
  console.log("");
  console.log("Tip: Use --all to download for all platforms");
}
console.log("=========================================");
console.log("");

// Create bin directory
if (!existsSync(BIN_DIR)) {
  mkdirSync(BIN_DIR, { recursive: true });
}

function shouldDownloadPlatform(platform: Platform): boolean {
  if (DOWNLOAD_ALL) return true;
  return platform.os === CURRENT_OS && platform.arch === CURRENT_ARCH;
}

async function extractTarXz(
  archivePath: string,
  outputPath: string
): Promise<void> {
  // Use tar command for .tar.xz files
  const { execSync } = await import("node:child_process");
  const tmpDir = join(BIN_DIR, ".tmp-extract");

  if (!existsSync(tmpDir)) {
    mkdirSync(tmpDir, { recursive: true });
  }

  execSync(`tar -xJf "${archivePath}" -C "${tmpDir}"`, { stdio: "inherit" });

  // Find ffmpeg binary
  const fs = await import("node:fs");

  function findFFmpeg(dir: string): string | null {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const result = findFFmpeg(fullPath);
        if (result) return result;
      } else if (item === "ffmpeg" || item === "ffmpeg.exe") {
        return fullPath;
      }
    }
    return null;
  }

  const ffmpegBin = findFFmpeg(tmpDir);
  if (!ffmpegBin) {
    throw new Error("ffmpeg binary not found in archive");
  }

  fs.copyFileSync(ffmpegBin, outputPath);
  if (process.platform !== "win32") {
    fs.chmodSync(outputPath, 0o755);
  }

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

async function extractZip(
  archivePath: string,
  outputPath: string
): Promise<void> {
  const zipData = await Bun.file(archivePath).arrayBuffer();
  const zip = await new JSZip().loadAsync(zipData);

  // Find ffmpeg binary in the ZIP
  let ffmpegEntry: JSZip.JSZipObject | null = null;

  // Common locations
  const possibleNames = ["ffmpeg", "ffmpeg.exe"];

  for (const fileName of Object.keys(zip.files)) {
    const entry = zip.files[fileName];
    if (entry.dir) continue;

    const baseName = fileName.split("/").pop() || "";
    if (possibleNames.includes(baseName)) {
      ffmpegEntry = entry;
      break;
    }
  }

  if (!ffmpegEntry) {
    throw new Error("ffmpeg binary not found in ZIP archive");
  }

  const binaryData = await ffmpegEntry.async("arraybuffer");
  await Bun.write(outputPath, binaryData);

  if (process.platform !== "win32") {
    const { chmodSync } = await import("node:fs");
    chmodSync(outputPath, 0o755);
  }
}

async function downloadFFmpeg(platform: Platform): Promise<void> {
  const outputPath = join(BIN_DIR, platform.fileName);

  console.log(`📥 Downloading ffmpeg for ${platform.name}...`);

  const archivePath = join(
    BIN_DIR,
    `ffmpeg-${platform.os}-${platform.arch}.archive`
  );

  // Download if not cached
  if (existsSync(archivePath)) {
    console.log("  ✓ Using cached archive");
  } else {
    const response = await fetch(platform.url);
    if (!response.ok) {
      throw new Error(
        `Failed to download: ${response.status} ${response.statusText}`
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Failed to get response body reader");
    }

    const total = Number(response.headers.get("content-length")) || 0;
    let received = 0;

    const file = Bun.file(archivePath).writer();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      received += value.length;
      file.write(value);

      if (total > 0) {
        const percent = ((received / total) * 100).toFixed(1);
        process.stdout.write(`\r  → Downloaded ${percent}%`);
      }
    }

    console.log("");
  }

  console.log("📦 Extracting ffmpeg...");

  if (platform.extractCmd === "tar") {
    await extractTarXz(archivePath, outputPath);
  } else {
    await extractZip(archivePath, outputPath);
  }

  const stat = Bun.file(outputPath);
  const size = ((await stat.size()) / 1024 / 1024).toFixed(1);
  console.log(`✅ ${platform.name}: ${platform.fileName} (${size}MB)`);
  console.log("");
}

async function tryLocalFFmpeg(platform: Platform): Promise<boolean> {
  if (platform.os !== "darwin") return false;

  try {
    const { execSync } = await import("node:child_process");
    const whichFFmpeg = execSync("which ffmpeg", { encoding: "utf8" }).trim();

    if (whichFFmpeg) {
      console.log(`📋 Found local ffmpeg, using it for ${platform.name}...`);
      const { copyFileSync, chmodSync } = await import("node:fs");
      const outputPath = join(BIN_DIR, platform.fileName);
      copyFileSync(whichFFmpeg, outputPath);
      chmodSync(outputPath, 0o755);

      const stat = Bun.file(outputPath);
      const size = ((await stat.size()) / 1024 / 1024).toFixed(1);
      console.log(`✅ ${platform.name}: ${platform.fileName} (${size}MB)`);
      console.log("");
      return true;
    }
  } catch {
    // ffmpeg not found locally
  }

  return false;
}

// Download for each platform
for (const platform of PLATFORMS) {
  if (!shouldDownloadPlatform(platform)) continue;

  const outputPath = join(BIN_DIR, platform.fileName);

  if (existsSync(outputPath)) {
    console.log(`✓ ${platform.name} already exists`);
    continue;
  }

  // Try local ffmpeg for macOS
  if (platform.os === "darwin" && (await tryLocalFFmpeg(platform))) {
    continue;
  }

  await downloadFFmpeg(platform);
}

console.log("");
console.log("=========================================");
if (DOWNLOAD_ALL) {
  console.log("✅ All platform ffmpeg binaries downloaded");
} else {
  console.log("✅ Current platform ffmpeg binary ready");
}
console.log("=========================================");
console.log("");
console.log("Downloaded binaries:");

const { readdirSync, statSync } = await import("node:fs");
const files = readdirSync(BIN_DIR);
const ffmpegFiles = files.filter((f) => f.startsWith("ffmpeg"));

if (ffmpegFiles.length === 0) {
  console.log("  (none yet)");
} else {
  for (const file of ffmpegFiles) {
    const stat = statSync(join(BIN_DIR, file));
    const size = (stat.size / 1024 / 1024).toFixed(1);
    console.log(`  ${file} (${size}MB)`);
  }
}

console.log("");
console.log("These binaries will be embedded in the Go binary during build.");
console.log("");

if (!DOWNLOAD_ALL) {
  console.log(
    "Tip: Run 'bun download-ffmpeg.ts --all' to download for all platforms"
  );
}
