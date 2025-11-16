#!/usr/bin/env bun

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "../..");
const WEB_DIR = join(ROOT, "apps/web");

export function buildWeb(): void {
  console.log("📦 Building web frontend...");

  execSync("bun run build", {
    cwd: WEB_DIR,
    stdio: "inherit",
  });

  const webDist = join(WEB_DIR, "dist");
  if (!existsSync(webDist)) {
    throw new Error(`Web build artifacts not found at ${webDist}`);
  }

  console.log("✅ Web frontend built successfully\n");
}

// Run if executed directly
if (import.meta.main) {
  buildWeb();
}
