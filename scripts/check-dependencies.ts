#!/usr/bin/env bun

import { withTag } from "./build-log";
import { hasCommand } from "./command-discovery";

export function checkDependencies(): void {
  console.log(withTag("step", "Checking build dependencies..."));
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
    console.log(`  ${withTag("ok", "Bun found")}`);
  } else {
    errors.push(
      withTag("error", "Bun is required - Install from: https://bun.sh")
    );
  }

  if (deps.go) {
    console.log(`  ${withTag("ok", "Go found")}`);
  } else {
    errors.push(
      withTag("error", "Go is required - Install from: https://go.dev/dl/")
    );
  }

  if (deps.cmake) {
    console.log(`  ${withTag("ok", "CMake found")}`);
  } else {
    errors.push(
      withTag("error", "CMake is required - Install from: https://cmake.org/")
    );
  }

  if (deps.git) {
    console.log(`  ${withTag("ok", "Git found")}`);
  } else {
    errors.push(withTag("error", "Git is required"));
  }

  if (!requiresTar) {
    console.log(
      `  ${withTag("info", "Tar check skipped (not required on this platform)")}`
    );
  } else if (deps.tar) {
    console.log(`  ${withTag("ok", "Tar found")}`);
  } else {
    errors.push(
      withTag("error", "tar is required on Linux for FFmpeg extraction")
    );
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
