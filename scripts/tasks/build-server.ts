#!/usr/bin/env bun

import { execSync } from "node:child_process";
import { closeSync, existsSync, openSync, readSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "../..");
const SERVER_DIR = join(ROOT, "apps/server");

export type ServerBuildOptions = {
  platform?: "current" | "windows" | "all";
};

function ensureFileExists(path: string): void {
  if (!existsSync(path)) {
    throw new Error(`Expected server artifact was not produced: ${path}`);
  }
}

function ensureWindowsExecutable(path: string): void {
  ensureFileExists(path);

  const fd = openSync(path, "r");
  const signature = Buffer.alloc(2);
  try {
    readSync(fd, signature, 0, 2, 0);
  } finally {
    closeSync(fd);
  }

  if (signature[0] !== 0x4d || signature[1] !== 0x5a) {
    throw new Error(`Invalid Windows executable header in ${path}`);
  }
}

export function buildServer(options: ServerBuildOptions = {}): void {
  const { platform = "current" } = options;

  console.log("📦 Building server binary...");

  const isWindowsHost = process.platform === "win32";
  const serverDist = join(SERVER_DIR, "dist");
  const windowsBinary = join(serverDist, "dastyar-ai.exe");
  const currentBinary = join(
    serverDist,
    isWindowsHost ? "dastyar-ai.exe" : "dastyar-ai"
  );

  if (platform === "windows" || (platform === "current" && isWindowsHost)) {
    console.log("  → Building for Windows...");
    execSync("bun run build:windows", {
      cwd: SERVER_DIR,
      stdio: "inherit",
    });
    ensureWindowsExecutable(windowsBinary);
  } else if (platform === "all") {
    console.log("  → Building for current platform...");
    execSync("bun run build", {
      cwd: SERVER_DIR,
      stdio: "inherit",
    });
    ensureFileExists(currentBinary);

    if (!isWindowsHost) {
      try {
        console.log("  → Cross-compiling for Windows...");
        execSync("bun run build:windows", {
          cwd: SERVER_DIR,
          stdio: "inherit",
        });
        ensureWindowsExecutable(windowsBinary);
      } catch {
        console.warn("  ⚠️  Windows cross-compile failed, skipping");
      }
    }
  } else {
    console.log("  → Building for current platform...");
    execSync("bun run build", {
      cwd: SERVER_DIR,
      stdio: "inherit",
    });
    ensureFileExists(currentBinary);
  }

  console.log("✅ Server binary built successfully\n");
}

// Run if executed directly
if (import.meta.main) {
  const platform = process.argv[2] as ServerBuildOptions["platform"];
  buildServer({ platform });
}
