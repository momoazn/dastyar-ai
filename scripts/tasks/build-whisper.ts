#!/usr/bin/env bun

import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import JSZip from "jszip";

const ROOT = join(import.meta.dir, "../..");
const WHISPER_DIR = join(ROOT, "apps/whisper");
const DIST_DIR = join(ROOT, "dist");

const isWindows = process.platform === "win32";
const CMAKE_GENERATOR_REGEX = /CMAKE_GENERATOR:INTERNAL=(.+)/;

function hasCommand(cmd: string): boolean {
  try {
    execSync(isWindows ? `where ${cmd}` : `which ${cmd}`, {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function checkWindowsCompiler(): string | null {
  // Check for MinGW (preferred for simpler setup)
  if (hasCommand("gcc") && hasCommand("g++")) {
    console.log("  ✓ Found MinGW compiler");
    return "MinGW Makefiles";
  }

  // Check for Visual Studio and Windows SDK
  if (hasCommand("cl")) {
    // Check if rc.exe (Resource Compiler from Windows SDK) is available
    if (hasCommand("rc")) {
      console.log("  ✓ Found Visual Studio compiler with Windows SDK");
      return "NMake Makefiles";
    }
    console.log("  ⚠️  Found Visual Studio but Windows SDK is missing");
    console.log("     Windows SDK is required for rc.exe (Resource Compiler)");
    console.log("");
    console.log("     Options:");
    console.log("     1. Install Windows SDK from Visual Studio Installer");
    console.log("     2. Or install MinGW-w64 (recommended):");
    console.log("        winget install -e --id=MSYS2.MSYS2");
    console.log("        Then in MSYS2: pacman -S mingw-w64-x86_64-gcc");
    console.log("");
    return null;
  }

  return null;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Go
export async function buildWhisper(): Promise<void> {
  console.log("📦 Building Whisper Go binary...");

  // Check for C++ compiler on Windows
  if (isWindows) {
    const generator = checkWindowsCompiler();
    if (!generator) {
      console.error("");
      console.error("❌ No suitable C++ compiler found!");
      console.error("");
      console.error("You need to install one of the following:");
      console.error("");
      console.error("Option 1: MinGW-w64 (Recommended - Simpler)");
      console.error("  Install: winget install -e --id=MSYS2.MSYS2");
      console.error("  Then in MSYS2 terminal:");
      console.error("    pacman -S mingw-w64-x86_64-gcc");
      console.error("    pacman -S mingw-w64-x86_64-cmake");
      console.error("  Add to PATH: C:\\msys64\\mingw64\\bin");
      console.error("");
      console.error("Option 2: Visual Studio Build Tools");
      console.error(
        "  Download: https://visualstudio.microsoft.com/downloads/"
      );
      console.error("  Install components:");
      console.error("    - Desktop development with C++");
      console.error("    - Windows SDK (includes rc.exe)");
      console.error("");
      throw new Error("C++ compiler required for building Whisper");
    }
  }

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

  let ffmpegFileName: string;
  if (isWindows) {
    ffmpegFileName = "ffmpeg-windows-amd64.exe";
  } else if (process.arch === "arm64") {
    ffmpegFileName = `ffmpeg-${process.platform}-arm64`;
  } else {
    ffmpegFileName = `ffmpeg-${process.platform}-amd64`;
  }

  const ffmpegPath = join(ffmpegBinDir, ffmpegFileName);
  const ffmpegDistPath = join(DIST_DIR, isWindows ? "ffmpeg.exe" : "ffmpeg");

  // Check if FFmpeg exists in whisper dir or dist dir
  if (existsSync(ffmpegPath)) {
    console.log("  ✓ FFmpeg found in whisper directory");
  } else if (existsSync(ffmpegDistPath)) {
    console.log("  ✓ FFmpeg found in dist directory, copying to whisper...");
    cpSync(ffmpegDistPath, ffmpegPath);
  } else {
    console.log("  → Downloading FFmpeg...");
    await downloadFFmpeg(ffmpegBinDir, ffmpegFileName);
  }

  // Download base model if no models exist
  const modelsDir = join(WHISPER_DIR, "models");
  const distModelsDir = join(DIST_DIR, "models");
  mkdirSync(modelsDir, { recursive: true });

  // Check for models in whisper directory
  const modelFiles = existsSync(modelsDir)
    ? readdirSync(modelsDir).filter((f) => f.endsWith(".bin"))
    : [];

  // Check for models in dist directory
  const distModelFiles = existsSync(distModelsDir)
    ? readdirSync(distModelsDir).filter((f) => f.endsWith(".bin"))
    : [];

  if (modelFiles.length === 0 && distModelFiles.length === 0) {
    console.log("  → Downloading base model...");
    await downloadModel(modelsDir, "ggml-base.bin");
  } else if (modelFiles.length === 0 && distModelFiles.length > 0) {
    console.log(
      `  ✓ Found ${distModelFiles.length} model(s) in dist, copying to whisper...`
    );
    cpSync(distModelsDir, modelsDir, { recursive: true });
  } else {
    console.log(`  ✓ Found ${modelFiles.length} model(s) in whisper directory`);
  }

  // Build whisper.cpp with cmake
  console.log("  → Building whisper.cpp library...");

  // Determine CMake generator for Windows
  let generator: string | null = null;
  if (isWindows) {
    generator = checkWindowsCompiler();
  }

  // Clean build directory if generator has changed
  const buildDir = join(whisperCppDir, "build_go");
  const cmakeCachePath = join(buildDir, "CMakeCache.txt");

  if (existsSync(cmakeCachePath) && generator) {
    try {
      const cacheContent = await Bun.file(cmakeCachePath).text();
      const generatorMatch = cacheContent.match(CMAKE_GENERATOR_REGEX);

      if (generatorMatch && generatorMatch[1] !== generator) {
        console.log(
          `  → Cleaning old build (generator changed: ${generatorMatch[1]} → ${generator})...`
        );
        rmSync(buildDir, { recursive: true, force: true });
      }
    } catch {
      // If we can't read the cache, clean it to be safe
      console.log("  → Cleaning build directory...");
      rmSync(buildDir, { recursive: true, force: true });
    }
  }

  let cmakeConfigCmd =
    "cmake -S . -B build_go -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DWHISPER_BUILD_TESTS=OFF -DWHISPER_BUILD_EXAMPLES=OFF";

  if (generator) {
    cmakeConfigCmd += ` -G "${generator}"`;
  }

  // Add MinGW compiler paths for Windows
  if (isWindows && generator === "MinGW Makefiles") {
    // Try to detect MinGW path from environment or use default
    const mingwPath =
      process.env.MINGW_PREFIX ||
      process.env.MSYSTEM_PREFIX ||
      "C:\\msys64\\mingw64";
    const binPath = `${mingwPath}\\bin`;
    cmakeConfigCmd += ` -DCMAKE_C_COMPILER=${binPath}\\gcc.exe -DCMAKE_CXX_COMPILER=${binPath}\\g++.exe`;
  }

  execSync(cmakeConfigCmd, {
    cwd: whisperCppDir,
    stdio: "inherit",
  });

  execSync("cmake --build build_go --target whisper --config Release", {
    cwd: whisperCppDir,
    stdio: "inherit",
  });

  // Build Go application
  console.log("  → Building Go whisper server...");
  const ggmlSrc = join(buildDir, "ggml", "src");

  const goWorkDir = join(WHISPER_DIR, ".go-work");
  mkdirSync(join(goWorkDir, "build-cache"), { recursive: true });
  mkdirSync(join(goWorkDir, "pkg/mod"), { recursive: true });

  // Determine OpenMP flags based on platform
  // On macOS, clang doesn't support -fopenmp by default and OpenMP is often not available
  // On Windows with MinGW, use -lgomp
  // On Linux, use -fopenmp if available
  let openmpFlags = "";
  if (isWindows) {
    openmpFlags = " -lgomp";
  } else if (process.platform === "linux") {
    // On Linux, try to use OpenMP if available
    openmpFlags = " -fopenmp";
  }
  // On macOS (darwin), don't add OpenMP flags since it's not supported by default clang

  // Build library paths - include platform-specific subdirectories
  const pathSeparator = isWindows ? ";" : ":";
  const libraryPaths = [join(buildDir, "src"), ggmlSrc];
  const ldFlagPaths = [`-L${join(buildDir, "src")}`, `-L${ggmlSrc}`];

  // Add BLAS and Metal paths only on macOS (darwin)
  if (process.platform === "darwin") {
    const ggmlBlasPath = join(ggmlSrc, "ggml-blas");
    const ggmlMetalPath = join(ggmlSrc, "ggml-metal");
    libraryPaths.push(ggmlBlasPath, ggmlMetalPath);
    ldFlagPaths.push(`-L${ggmlBlasPath}`, `-L${ggmlMetalPath}`);
  }

  const libraryPath = libraryPaths.join(pathSeparator);
  const ldFlags = ldFlagPaths.join(" ") + openmpFlags;

  const buildEnv = {
    ...process.env,
    GOPATH: goWorkDir,
    GOCACHE: join(goWorkDir, "build-cache"),
    GOMODCACHE: join(goWorkDir, "pkg/mod"),
    C_INCLUDE_PATH: `${join(whisperCppDir, "include")}${isWindows ? ";" : ":"}${join(whisperCppDir, "ggml", "include")}`,
    LIBRARY_PATH: libraryPath,
    CGO_LDFLAGS: ldFlags,
  };

  const outputName = isWindows ? "whisper.exe" : "whisper";
  execSync(`go build -o ${outputName} .`, {
    cwd: WHISPER_DIR,
    stdio: "inherit",
    env: buildEnv,
  });

  console.log("✅ Whisper binary built successfully\n");
}

async function downloadFFmpeg(binDir: string, fileName: string): Promise<void> {
  let url: string;
  if (process.platform === "win32") {
    url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip";
  } else if (process.platform === "darwin") {
    url = "https://evermeet.cx/ffmpeg/ffmpeg-6.1.1.zip";
  } else if (process.arch === "arm64") {
    url =
      "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz";
  } else {
    url =
      "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz";
  }

  const archivePath = join(binDir, "ffmpeg-archive");
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download FFmpeg: ${response.statusText}`);
  }

  await Bun.write(archivePath, response);

  if (url.endsWith(".zip")) {
    const zipData = await Bun.file(archivePath).arrayBuffer();
    const zip = await new JSZip().loadAsync(zipData);

    let ffmpegEntry: JSZip.JSZipObject | null = null;
    for (const entryName of Object.keys(zip.files)) {
      if (entryName.endsWith("ffmpeg.exe") || entryName.endsWith("ffmpeg")) {
        ffmpegEntry = zip.files[entryName];
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

async function downloadModel(
  modelsDir: string,
  modelName: string
): Promise<void> {
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
