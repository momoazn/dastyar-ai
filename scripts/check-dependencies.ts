#!/usr/bin/env bun

import { hasCommand } from "./command-discovery";

export function checkDependencies(): void {
  console.log("🔍 Checking build dependencies...");
  const requiresTar = process.platform === "linux";

  const deps = {
    bun: hasCommand("bun"),
    go: hasCommand("go"),
    cmake: hasCommand("cmake"),
    git: hasCommand("git"),
    tar: requiresTar ? hasCommand("tar") : true,
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

  if (!requiresTar) {
    console.log("  ✓ Tar check skipped (not required on this platform)");
  } else if (deps.tar) {
    console.log("  ✓ Tar found");
  } else {
    errors.push("❌ tar is required on Linux for FFmpeg extraction");
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
