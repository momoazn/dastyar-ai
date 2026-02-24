#!/usr/bin/env bun

import { join } from "node:path";
import { WEB_APP_DIR } from "./project-paths";
import { runCommand } from "./run-command";

const WEB_DIR = WEB_APP_DIR;

export async function buildWeb(): Promise<void> {
  console.log("📦 Building web frontend...");

  await runCommand("bun", ["run", "build"], { cwd: WEB_DIR });

  const webEntry = join(WEB_DIR, "dist", "index.html");
  if (!(await Bun.file(webEntry).exists())) {
    throw new Error(`Web build artifacts not found at ${webEntry}`);
  }

  console.log("✅ Web frontend built successfully\n");
}

// Run if executed directly
if (import.meta.main) {
  await buildWeb();
}
