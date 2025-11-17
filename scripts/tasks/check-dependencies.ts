#!/usr/bin/env bun

import { execSync } from "node:child_process";

const isWindows = process.platform === "win32";

export function hasCommand(cmd: string): boolean {
  try {
    // Special handling for CMake on Windows
    if (isWindows && cmd === "cmake") {
      execSync(`where cmake`, { stdio: "ignore" });
      return true;
    }
    execSync(isWindows ? `where ${cmd}` : `which ${cmd}`, {
      stdio: "ignore",
    });
    return true;
  } catch {
    // Fallback: check if CMake is installed in the default location
    if (isWindows && cmd === "cmake") {
      try {
        execSync(`"C:\\Program Files\\CMake\\bin\\cmake" --version`, {
          stdio: "ignore",
        });
        return true;
      } catch {
        return false;
      }
    }
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

  if (deps.bun) {
    console.log("  ✓ Bun found");
  } else {
    errors.push("❌ Bun is required - Install from: https://bun.sh");
  }

  if (deps.go) {
    console.log("  ✓ Go found");
  } else {
    errors.push("❌ Go is required - Install from: https://go.dev/dl/");
  }

  if (deps.cmake) {
    console.log("  ✓ CMake found");
  } else {
    errors.push("❌ CMake is required - Install from: https://cmake.org/");
  }

  if (deps.git) {
    console.log("  ✓ Git found");
  } else {
    errors.push("❌ Git is required");
  }

  if (errors.length > 0) {
    console.error(`\n${errors.join("\n")}`);
    process.exit(1);
  }

  console.log("");
}

// Run if executed directly
if (import.meta.main) {
  checkDependencies();
}
