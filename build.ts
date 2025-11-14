#!/usr/bin/env bun

import { runBuild } from "./scripts/build/index";

try {
  runBuild(process.argv.slice(2));
} catch (error) {
  console.error("❌ Build failed:", error);
  process.exit(1);
}
