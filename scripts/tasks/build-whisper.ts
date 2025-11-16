#!/usr/bin/env bun

import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import JSZip from "jszip";

const ROOT = join(import.meta.dir, "../..");
const WHISPER_DIR = join(ROOT, "apps/whisper");

const isWindows = process.platform === "win32";

export async function buildWhisper(): Promise<void> {
  console.log("📦 Building Whisper Go binary...");

  // Check if whisper.cpp is cloned
  const whisperCppDir = join(WHISPER_DIR, "whisper.cpp");
  if (!existsSync(whisperCppDir)) {
    console.log("  → Cloning whisper.cpp...");
    execSync("git clone https://github.com/ggerganov/whisper.cpp.git", {
      cwd: WHISPER_DIR,
      stdio: "inherit",
    });
  }

  // Download FFmpeg if needed
  const ffmpegBinDir = join(WHISPER_DIR, "ffmpeg-binaries");
  mkdirSync(ffmpegBinDir, { recursive: true });

  const ffmpegFileName = isWindows
    ? "ffmpeg-windows-amd64.exe"
    : process.arch === "arm64"
      ? `ffmpeg-${process.platform}-arm64`
      : `ffmpeg-${process.platform}-amd64`;

  const ffmpegPath = join(ffmpegBinDir, ffmpegFileName);

  if (!existsSync(ffmpegPath)) {
    console.log("  → Downloading FFmpeg...");
    await downloadFFmpeg(ffmpegBinDir, ffmpegFileName);
  } else {
    console.log("  ✓ FFmpeg found");
  }

  // Download base model if no models exist
  const modelsDir = join(WHISPER_DIR, "models");
  mkdirSync(modelsDir, { recursive: true });

  const modelFiles = existsSync(modelsDir)
    ? Bun.file(modelsDir)
        .toString()
        .split("\n")
        .filter((f) => f.endsWith(".bin"))
    : [];

  if (modelFiles.length === 0) {
    console.log("  → Downloading base model...");
    await downloadModel(modelsDir, "ggml-base.bin");
  } else {
    console.log(`  ✓ Found ${modelFiles.length} model(s)`);
  }

  // Build whisper.cpp with cmake
  console.log("  → Building whisper.cpp library...");
  execSync(
    "cmake -S . -B build_go -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DWHISPER_BUILD_TESTS=OFF -DWHISPER_BUILD_EXAMPLES=OFF",
    {
      cwd: whisperCppDir,
      stdio: "inherit",
    }
  );

  execSync("cmake --build build_go --target whisper --config Release", {
    cwd: whisperCppDir,
    stdio: "inherit",
  });

  // Build Go application
  console.log("  → Building Go whisper server...");
  const buildDir = join(whisperCppDir, "build_go");
  const ggmlSrc = join(buildDir, "ggml", "src");

  const goWorkDir = join(WHISPER_DIR, ".go-work");
  mkdirSync(join(goWorkDir, "build-cache"), { recursive: true });
  mkdirSync(join(goWorkDir, "pkg/mod"), { recursive: true });

  const buildEnv = {
    ...process.env,
    GOPATH: goWorkDir,
    GOCACHE: join(goWorkDir, "build-cache"),
    GOMODCACHE: join(goWorkDir, "pkg/mod"),
    C_INCLUDE_PATH: `${join(whisperCppDir, "include")}${isWindows ? ";" : ":"}${join(whisperCppDir, "ggml", "include")}`,
    LIBRARY_PATH: `${join(buildDir, "src")}${isWindows ? ";" : ":"}${ggmlSrc}`,
    CGO_LDFLAGS: `-L${join(buildDir, "src")} -L${ggmlSrc}`,
  };

  const outputName = isWindows ? "whisper.exe" : "whisper";
  execSync(`go build -o ${outputName} .`, {
    cwd: WHISPER_DIR,
    stdio: "inherit",
    env: buildEnv,
  });

  console.log("✅ Whisper binary built successfully\n");
}

async function downloadFFmpeg(
  binDir: string,
  fileName: string
): Promise<void> {
  const url =
    process.platform === "win32"
      ? "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
      : process.platform === "darwin"
        ? "https://evermeet.cx/ffmpeg/ffmpeg-6.1.1.zip"
        : process.arch === "arm64"
          ? "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz"
          : "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz";

  const archivePath = join(binDir, `ffmpeg-archive`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download FFmpeg: ${response.statusText}`);
  }

  await Bun.write(archivePath, response);

  if (url.endsWith(".zip")) {
    const zipData = await Bun.file(archivePath).arrayBuffer();
    const zip = await new JSZip().loadAsync(zipData);

    let ffmpegEntry: JSZip.JSZipObject | null = null;
    for (const fileName of Object.keys(zip.files)) {
      if (
        fileName.endsWith("ffmpeg.exe") ||
        fileName.endsWith("ffmpeg")
      ) {
        ffmpegEntry = zip.files[fileName];
        break;
      }
    }

    if (!ffmpegEntry) {
      throw new Error("ffmpeg not found in ZIP");
    }

    const data = await ffmpegEntry.async("arraybuffer");
    await Bun.write(join(binDir, fileName), data);
  }
}

async function downloadModel(modelsDir: string, modelName: string): Promise<void> {
  const url = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${modelName}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download model: ${response.statusText}`);
  }

  const total = Number(response.headers.get("content-length")) || 0;
  let received = 0;

  const file = Bun.file(join(modelsDir, modelName)).writer();
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("Failed to get response reader");
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    received += value.length;
    file.write(value);

    if (total > 0) {
      const percent = ((received / total) * 100).toFixed(1);
      process.stdout.write(`\r    Downloaded ${percent}%`);
    }
  }

  console.log("");
}

// Run if executed directly
if (import.meta.main) {
  await buildWhisper();
}
