#!/usr/bin/env bun

/**
 * Dastyar AI - Main Build Orchestrator
 *
 * This is the single entry point for building the entire application.
 * Works cross-platform on Windows, macOS, and Linux.
 *
 * Usage:
 *   bun scripts/build.ts                    # Build for current platform
 *   bun scripts/build.ts --platform=windows # Build for Windows
 *   bun scripts/build.ts --platform=all     # Build for all platforms
 *   bun scripts/build.ts --skip-deps        # Skip dependency install
 */

import { execSync } from "node:child_process";
import { join } from "node:path";
import { buildServer } from "./tasks/build-server";
import { buildWeb } from "./tasks/build-web";
import { buildWhisper } from "./tasks/build-whisper";
import { checkDependencies } from "./tasks/check-dependencies";
import { packageDist } from "./tasks/package-dist";

const ROOT = join(import.meta.dir, "..");

type BuildOptions = {
  platform?: "current" | "windows" | "all";
  skipDeps?: boolean;
  skipWeb?: boolean;
  skipServer?: boolean;
  skipWhisper?: boolean;
};

function parseArgs(): BuildOptions {
  const args = process.argv.slice(2);
  const options: BuildOptions = {};

  for (const arg of args) {
    if (arg.startsWith("--platform=")) {
      const platform = arg.split("=")[1];
      if (platform === "windows" || platform === "all") {
        options.platform = platform;
      }
    } else if (arg === "--skip-deps") {
      options.skipDeps = true;
    } else if (arg === "--skip-web") {
      options.skipWeb = true;
    } else if (arg === "--skip-server") {
      options.skipServer = true;
    } else if (arg === "--skip-whisper") {
      options.skipWhisper = true;
    }
  }

  return options;
}

async function main() {
  const startTime = Date.now();
  const options = parseArgs();

  console.log("============================================================");
  console.log("🚀 DASTYAR AI - BUILD SYSTEM");
  console.log("============================================================");
  console.log("");
  console.log("Building:");
  console.log("  • Web frontend (React 19 + Vite)");
  console.log("  • Server binary (Bun runtime + Hono API)");
  console.log("  • Whisper server (Go + whisper.cpp)");
  console.log("  • Distribution package");
  console.log("");
  console.log("Platform:", options.platform || "current");
  console.log("============================================================");
  console.log("");

  try {
    // Step 0: Check dependencies
    checkDependencies();

    // Step 1: Install Node dependencies
    if (options.skipDeps) {
      console.log("⏭️  Skipping dependency installation\n");
    } else {
      console.log("📦 Installing dependencies...");
      execSync("bun install", {
        cwd: ROOT,
        stdio: "inherit",
      });
      console.log("✅ Dependencies installed\n");
    }

    // Step 2: Build web frontend
    if (!options.skipWeb) {
      console.log("[1/4] Building Web Frontend");
      console.log("─".repeat(60));
      buildWeb();
    }

    // Step 3: Build server
    if (!options.skipServer) {
      console.log("[2/4] Building Server");
      console.log("─".repeat(60));
      buildServer({ platform: options.platform });
    }

    // Step 4: Build Whisper
    if (!options.skipWhisper) {
      console.log("[3/4] Building Whisper");
      console.log("─".repeat(60));
      await buildWhisper();
    }

    // Step 5: Package distribution
    console.log("[4/4] Packaging Distribution");
    console.log("─".repeat(60));
    packageDist();

    // Success summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log("");
    console.log("============================================================");
    console.log("🎉 BUILD COMPLETED SUCCESSFULLY");
    console.log("============================================================");
    console.log("");
    console.log(`⏱️  Build time: ${elapsed}s`);
    console.log("");
    console.log("📦 Distribution ready in: dist/");
    console.log("");
    console.log("Next steps:");
    console.log("  1. Start Whisper API:  dist/whisper(.exe)");
    console.log("  2. Start main server:  dist/dastyar-ai(.exe)");
    console.log("  3. Open browser:       http://localhost:3000");
    console.log("");
    console.log("See dist/README.md for more information");
    console.log("============================================================");
  } catch (error) {
    console.error("");
    console.error(
      "============================================================"
    );
    console.error("❌ BUILD FAILED");
    console.error(
      "============================================================"
    );
    console.error("");
    console.error("Error:", error instanceof Error ? error.message : error);
    console.error("");
    process.exit(1);
  }
}

main();
