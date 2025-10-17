#!/usr/bin/env bun

import { execSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT_DIR = process.cwd();
const DIST_DIR = join(ROOT_DIR, "dist");
const SERVER_DIR = join(ROOT_DIR, "apps", "server");
const WEB_DIR = join(ROOT_DIR, "apps", "web");

type BuildPlatform = "host" | "windows";

const parseBuildPlatform = (): BuildPlatform => {
  const envPlatform = process.env.BUILD_PLATFORM?.toLowerCase();
  if (envPlatform === "windows") {
    return "windows";
  }
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--platform" && i + 1 < args.length) {
      const v = args[i + 1]?.toLowerCase();
      if (v === "windows") {
        return "windows";
      }
    } else if (a.startsWith("--platform=")) {
      const v = a.split("=", 2)[1]?.toLowerCase();
      if (v === "windows") {
        return "windows";
      }
    }
  }
  return "host";
};

const ensureDir = (dirPath: string): void => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

const safeCopyDir = (srcDir: string, destDir: string): void => {
  if (!existsSync(srcDir)) {
    return;
  }
  ensureDir(destDir);
  cpSync(srcDir, destDir, { recursive: true, force: true });
};

const safeCopyFile = (srcFile: string, destFile: string): void => {
  if (!existsSync(srcFile)) {
    return;
  }
  if (existsSync(destFile)) {
    return;
  }
  ensureDir(dirname(destFile));
  copyFileSync(srcFile, destFile);
};

function main() {
  console.log("🚀 Building Dastyar AI...");

  const buildPlatform = parseBuildPlatform();
  const serverBuildCommand =
    buildPlatform === "windows" ? "bun run build:windows" : "bun run build";
  const serverTargetLabel =
    buildPlatform === "windows"
      ? "bun-windows-x64"
      : `native (${process.platform})`;

  // Create root dist directory
  ensureDir(DIST_DIR);

  // Build server
  console.log(`📦 Building server (target: ${serverTargetLabel})...`);
  execSync(serverBuildCommand, { cwd: SERVER_DIR, stdio: "inherit" });

  // Copy .env.example to dist/
  safeCopyFile(
    join(SERVER_DIR, ".env.example"),
    join(DIST_DIR, ".env.example")
  );

  // Build web
  console.log("🌐 Building web...");
  execSync("bun run build", { cwd: WEB_DIR, stdio: "inherit" });

  // Copy server output into dist/
  const serverOut = join(SERVER_DIR, "dist");
  console.log("📋 Copying server artifacts...");
  safeCopyDir(serverOut, DIST_DIR);

  // Copy web output into dist/web
  const webOut = join(WEB_DIR, "dist");
  const webTarget = join(DIST_DIR, "web");
  console.log("📋 Copying web artifacts...");
  safeCopyDir(webOut, webTarget);

  // Optional convenience copies if present in workspace
  // - Root config.json -> dist/config.json (server reads from exec dir)
  safeCopyFile(join(ROOT_DIR, "config.json"), join(DIST_DIR, "config.json"));

  console.log("✅ Done. Artifacts available in ./dist");
}

try {
  main();
} catch (err) {
  console.error("Build failed:", err);
  process.exit(1);
}
