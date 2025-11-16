#!/usr/bin/env bun

import { execSync } from "node:child_process";

const isWindows = process.platform === "win32";

export function hasCommand(cmd: string): boolean {
  try {
    execSync(isWindows ? `where ${cmd}` : `which ${cmd}`, {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

export function checkDependencies(): void {
  console.log("🔍 Checking build dependencies...");

  const deps = {
    bun: hasCommand("bun"),
    go: hasCommand("go"),
    cmake: hasCommand("cmake"),
    git: hasCommand("git"),
  };

  const errors: string[] = [];

  if (!deps.bun) {
    errors.push("❌ Bun is required - Install from: https://bun.sh");
  } else {
    console.log("  ✓ Bun found");
  }

  if (!deps.go) {
    errors.push("❌ Go is required - Install from: https://go.dev/dl/");
  } else {
    console.log("  ✓ Go found");
  }

  if (!deps.cmake) {
    errors.push("❌ CMake is required - Install from: https://cmake.org/");
  } else {
    console.log("  ✓ CMake found");
  }

  if (!deps.git) {
    errors.push("❌ Git is required");
  } else {
    console.log("  ✓ Git found");
  }

  if (errors.length > 0) {
    console.error("\n" + errors.join("\n"));
    process.exit(1);
  }

  console.log("");
}

// Run if executed directly
if (import.meta.main) {
  checkDependencies();
}
