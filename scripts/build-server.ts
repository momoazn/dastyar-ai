#!/usr/bin/env bun

import { join } from "node:path";
import { SERVER_APP_DIR } from "./project-paths";
import { runCommand } from "./run-command";

const SERVER_DIR = SERVER_APP_DIR;

export type ServerBuildOptions = {
  platform?: "current" | "windows" | "all";
};

async function ensureFileExists(path: string): Promise<void> {
  if (!(await Bun.file(path).exists())) {
    throw new Error(`Expected server artifact was not produced: ${path}`);
  }
}

async function ensureWindowsExecutable(path: string): Promise<void> {
  await ensureFileExists(path);
  const signature = new Uint8Array(
    await Bun.file(path).slice(0, 2).arrayBuffer()
  );

  if (signature[0] !== 0x4d || signature[1] !== 0x5a) {
    throw new Error(`Invalid Windows executable header in ${path}`);
  }
}

async function bundleMigrations(): Promise<void> {
  await runCommand("bun", ["run", "db:bundle"], { cwd: SERVER_DIR });
}

async function buildCurrentPlatformBinary(): Promise<void> {
  await runCommand(
    "bun",
    [
      "build",
      "src/index.ts",
      "--compile",
      "--minify",
      "--target",
      "bun",
      "--outfile",
      "./dist/dastyar-ai",
    ],
    { cwd: SERVER_DIR }
  );
}

async function buildWindowsBinary(): Promise<void> {
  const args = [
    "build",
    "src/index.ts",
    "--compile",
    "--minify",
    "--target",
    "bun-windows-x64",
    "--outfile",
    "./dist/dastyar-ai.exe",
  ];

  if (process.platform === "win32") {
    args.push("--windows-icon=./assets/app.ico");
  }

  await runCommand("bun", args, { cwd: SERVER_DIR });
}

export async function buildServer(
  options: ServerBuildOptions = {}
): Promise<void> {
  const { platform = "current" } = options;

  console.log("📦 Building server binary...");

  const isWindowsHost = process.platform === "win32";
  const serverDist = join(SERVER_DIR, "dist");
  const windowsBinary = join(serverDist, "dastyar-ai.exe");
  const currentBinary = join(
    serverDist,
    isWindowsHost ? "dastyar-ai.exe" : "dastyar-ai"
  );

  await bundleMigrations();

  if (platform === "windows" || (platform === "current" && isWindowsHost)) {
    console.log("  → Building for Windows...");
    await buildWindowsBinary();
    await ensureWindowsExecutable(windowsBinary);
  } else if (platform === "all") {
    console.log("  → Building for current platform...");
    await buildCurrentPlatformBinary();
    await ensureFileExists(currentBinary);

    if (!isWindowsHost) {
      try {
        console.log("  → Cross-compiling for Windows...");
        await buildWindowsBinary();
        await ensureWindowsExecutable(windowsBinary);
      } catch {
        console.warn("  ⚠️  Windows cross-compile failed, skipping");
      }
    }
  } else {
    console.log("  → Building for current platform...");
    await buildCurrentPlatformBinary();
    await ensureFileExists(currentBinary);
  }

  console.log("✅ Server binary built successfully\n");
}

// Run if executed directly
if (import.meta.main) {
  const platform = process.argv[2] as ServerBuildOptions["platform"];
  await buildServer({ platform });
}
