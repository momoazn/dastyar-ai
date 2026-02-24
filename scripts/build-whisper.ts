#!/usr/bin/env bun

import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { hasCommand } from "./command-discovery";
import { WHISPER_APP_DIR } from "./project-paths";
import { runCommand } from "./run-command";
import {
  ensureFfmpegForTarget,
  ensureWhisperModel,
  listWhisperModelsInDir,
} from "./whisper-assets";

const isWindows = process.platform === "win32";
const CMAKE_GENERATOR_REGEX = /CMAKE_GENERATOR:INTERNAL=(.+)/;
const WHISPER_CPP_REPO_URL = "https://github.com/ggerganov/whisper.cpp.git";

function checkWindowsCompiler(): string | null {
  if (hasCommand("gcc") && hasCommand("g++")) {
    console.log("  ✓ Found MinGW compiler");
    return "MinGW Makefiles";
  }

  if (hasCommand("cl")) {
    if (hasCommand("rc")) {
      console.log("  ✓ Found Visual Studio compiler with Windows SDK");
      return "NMake Makefiles";
    }
    console.log("  ⚠️  Found Visual Studio but Windows SDK is missing");
    return null;
  }

  return null;
}

function assertWindowsCompiler(): void {
  if (!isWindows) {
    return;
  }
  const generator = checkWindowsCompiler();
  if (generator) {
    return;
  }

  throw new Error(
    "No supported Windows C++ compiler found. Install MinGW-w64 or Visual Studio Build Tools with Windows SDK."
  );
}

async function ensureWhisperCppRepo(): Promise<string> {
  const whisperCppDir = join(WHISPER_APP_DIR, "whisper.cpp");
  if (!existsSync(whisperCppDir)) {
    console.log("  → Cloning whisper.cpp...");
    await runCommand("git", ["clone", WHISPER_CPP_REPO_URL], {
      cwd: WHISPER_APP_DIR,
    });
  }
  return whisperCppDir;
}

async function ensureRuntimeAssets(): Promise<void> {
  const ffmpegDir = join(WHISPER_APP_DIR, "ffmpeg-binaries");
  const modelsDir = join(WHISPER_APP_DIR, "models");

  await ensureFfmpegForTarget({
    binDir: ffmpegDir,
    preferLocalMacBinary: true,
  });
  console.log("  ✓ FFmpeg ready");

  const models = listWhisperModelsInDir(modelsDir);
  if (models.length > 0) {
    console.log(`  ✓ Found ${models.length} Whisper model(s)`);
    return;
  }

  console.log("  → Downloading default model (ggml-base.bin)...");
  await ensureWhisperModel({
    modelDir: modelsDir,
    modelName: "ggml-base.bin",
  });
  console.log("  ✓ Whisper model ready");
}

async function cleanBuildDirIfGeneratorChanged(
  whisperCppDir: string,
  generator: string | null
): Promise<void> {
  if (!generator) {
    return;
  }

  const buildDir = join(whisperCppDir, "build_go");
  const cachePath = join(buildDir, "CMakeCache.txt");
  if (!(await Bun.file(cachePath).exists())) {
    return;
  }

  try {
    const cacheContent = await Bun.file(cachePath).text();
    const current = cacheContent.match(CMAKE_GENERATOR_REGEX)?.[1];
    if (current && current !== generator) {
      console.log(`  → Recreating build dir (generator changed: ${current})`);
      rmSync(buildDir, { recursive: true, force: true });
    }
  } catch {
    rmSync(buildDir, { recursive: true, force: true });
  }
}

function getCmakeConfigureArgs(generator: string | null): string[] {
  const args = [
    "-S",
    ".",
    "-B",
    "build_go",
    "-DCMAKE_BUILD_TYPE=Release",
    "-DBUILD_SHARED_LIBS=OFF",
    "-DWHISPER_BUILD_TESTS=OFF",
    "-DWHISPER_BUILD_EXAMPLES=OFF",
  ];

  if (generator) {
    args.push("-G", generator);
  }

  if (isWindows && generator === "MinGW Makefiles") {
    const mingwPath =
      process.env.MINGW_PREFIX ||
      process.env.MSYSTEM_PREFIX ||
      "C:\\msys64\\mingw64";
    const binPath = `${mingwPath}\\bin`;
    args.push(
      `-DCMAKE_C_COMPILER=${binPath}\\gcc.exe`,
      `-DCMAKE_CXX_COMPILER=${binPath}\\g++.exe`
    );
  }

  return args;
}

async function buildWhisperCppLibrary(whisperCppDir: string): Promise<void> {
  console.log("  → Building whisper.cpp library...");

  const generator = isWindows ? checkWindowsCompiler() : null;
  await cleanBuildDirIfGeneratorChanged(whisperCppDir, generator);

  await runCommand("cmake", getCmakeConfigureArgs(generator), {
    cwd: whisperCppDir,
  });
  await runCommand(
    "cmake",
    ["--build", "build_go", "--target", "whisper", "--config", "Release"],
    { cwd: whisperCppDir }
  );
}

function createGoBuildEnv(whisperCppDir: string): NodeJS.ProcessEnv {
  const buildDir = join(whisperCppDir, "build_go");
  const ggmlSrc = join(buildDir, "ggml", "src");

  const goWorkDir = join(WHISPER_APP_DIR, ".go-work");
  mkdirSync(join(goWorkDir, "build-cache"), { recursive: true });
  mkdirSync(join(goWorkDir, "pkg/mod"), { recursive: true });

  let openmpFlags = "";
  if (isWindows) {
    openmpFlags = " -static -lgomp -lpthread";
  } else if (process.platform === "linux") {
    openmpFlags = " -fopenmp";
  }

  const pathSeparator = isWindows ? ";" : ":";
  const libraryPaths = [join(buildDir, "src"), ggmlSrc];
  const ldFlagPaths = [`-L${join(buildDir, "src")}`, `-L${ggmlSrc}`];

  if (process.platform === "darwin") {
    const ggmlBlasPath = join(ggmlSrc, "ggml-blas");
    const ggmlMetalPath = join(ggmlSrc, "ggml-metal");
    libraryPaths.push(ggmlBlasPath, ggmlMetalPath);
    ldFlagPaths.push(`-L${ggmlBlasPath}`, `-L${ggmlMetalPath}`);
  }

  return {
    ...process.env,
    GOPATH: goWorkDir,
    GOCACHE: join(goWorkDir, "build-cache"),
    GOMODCACHE: join(goWorkDir, "pkg/mod"),
    C_INCLUDE_PATH: `${join(whisperCppDir, "include")}${pathSeparator}${join(whisperCppDir, "ggml", "include")}`,
    LIBRARY_PATH: libraryPaths.join(pathSeparator),
    CGO_LDFLAGS: `${ldFlagPaths.join(" ")}${openmpFlags}`,
  };
}

async function buildGoWhisperServer(whisperCppDir: string): Promise<void> {
  console.log("  → Building Go whisper server...");
  const outputName = isWindows ? "whisper.exe" : "whisper";
  await runCommand("go", ["build", "-o", outputName, "."], {
    cwd: WHISPER_APP_DIR,
    env: createGoBuildEnv(whisperCppDir),
  });
}

export async function buildWhisper(): Promise<void> {
  console.log("📦 Building Whisper Go binary...");

  assertWindowsCompiler();
  await ensureRuntimeAssets();
  const whisperCppDir = await ensureWhisperCppRepo();
  await buildWhisperCppLibrary(whisperCppDir);
  await buildGoWhisperServer(whisperCppDir);

  console.log("✅ Whisper binary built successfully\n");
}

if (import.meta.main) {
  await buildWhisper();
}
