#!/usr/bin/env bun

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "../..");
const SERVER_DIR = join(ROOT, "apps/server");

export type ServerBuildOptions = {
  platform?: "current" | "windows" | "all";
};

export function buildServer(options: ServerBuildOptions = {}): void {
  const { platform = "current" } = options;

  console.log("📦 Building server binary...");

  const isWindows = process.platform === "win32";

  if (platform === "windows" || (platform === "current" && isWindows)) {
    console.log("  → Building for Windows...");
    execSync("bun run build:windows", {
      cwd: SERVER_DIR,
      stdio: "inherit",
    });
  } else if (platform === "all") {
    console.log("  → Building for current platform...");
    execSync("bun run build", {
      cwd: SERVER_DIR,
      stdio: "inherit",
    });

    if (!isWindows) {
      try {
        console.log("  → Cross-compiling for Windows...");
        execSync("bun run build:windows", {
          cwd: SERVER_DIR,
          stdio: "inherit",
        });
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
  }

  const serverDist = join(SERVER_DIR, "dist");
  if (!existsSync(serverDist)) {
    throw new Error(`Server build artifacts not found at ${serverDist}`);
  }

  console.log("✅ Server binary built successfully\n");
}

// Run if executed directly
if (import.meta.main) {
  const platform = process.argv[2] as ServerBuildOptions["platform"];
  buildServer({ platform });
}
