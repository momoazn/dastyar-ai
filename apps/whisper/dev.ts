#!/usr/bin/env bun

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const WHISPER_DIR = import.meta.dir;
const WHISPER_CPP_DIR = join(WHISPER_DIR, "whisper.cpp");
const BUILD_DIR = join(WHISPER_CPP_DIR, "build_go");
const GGML_SRC = join(BUILD_DIR, "ggml", "src");

const isWindows = process.platform === "win32";

// Check if whisper.cpp is built
if (!existsSync(BUILD_DIR)) {
  console.error(
    "whisper.cpp not built yet. Run: bun scripts/build.ts --skip-web --skip-server --skip-package"
  );
  process.exit(1);
}

// Set up CGo environment variables
const pathSeparator = isWindows ? ";" : ":";
const libraryPaths = [join(BUILD_DIR, "src"), GGML_SRC];
const ldFlagPaths = [`-L${join(BUILD_DIR, "src")}`, `-L${GGML_SRC}`];

// Add BLAS and Metal paths only on macOS (darwin)
if (process.platform === "darwin") {
  const ggmlBlasPath = join(GGML_SRC, "ggml-blas");
  const ggmlMetalPath = join(GGML_SRC, "ggml-metal");
  libraryPaths.push(ggmlBlasPath, ggmlMetalPath);
  ldFlagPaths.push(`-L${ggmlBlasPath}`, `-L${ggmlMetalPath}`);
}

// OpenMP flags
let openmpFlags = "";
if (isWindows) {
  openmpFlags = " -lgomp";
} else if (process.platform === "linux") {
  openmpFlags = " -fopenmp";
}

const env = {
  ...process.env,
  C_INCLUDE_PATH: `${join(WHISPER_CPP_DIR, "include")}${pathSeparator}${join(WHISPER_CPP_DIR, "ggml", "include")}`,
  LIBRARY_PATH: libraryPaths.join(pathSeparator),
  CGO_LDFLAGS: ldFlagPaths.join(" ") + openmpFlags,
};

console.log("Starting Whisper server in development mode...");
console.log("");

try {
  execSync("go run .", {
    cwd: WHISPER_DIR,
    stdio: "inherit",
    env,
  });
} catch (_error) {
  process.exit(1);
}
