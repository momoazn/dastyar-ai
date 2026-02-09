#!/usr/bin/env bun

import { execFileSync } from "node:child_process";

const args = [
  "build",
  "src/index.ts",
  "--compile",
  "--minify",
  "--target",
  "bun-windows-x64",
  "--outfile",
  "./dist/dastyar-ai.exe",
];

if (process.platform === "win32") {
  args.push("--windows-icon=./assets/app.ico");
}

execFileSync("bun", args, {
  stdio: "inherit",
});
