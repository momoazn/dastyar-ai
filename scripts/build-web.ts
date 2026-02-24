#!/usr/bin/env bun

import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { withTag } from "./build-log";
import { WEB_APP_DIR } from "./project-paths";
import { runCommand } from "./run-command";

const WEB_DIR = WEB_APP_DIR;

type WebBuildStats = {
  fileCount: number;
  largestAssetBytes: number;
  largestAssetPath: string;
  totalBytes: number;
};

function collectWebBuildStats(path: string): WebBuildStats {
  const stack = [path];
  let fileCount = 0;
  let totalBytes = 0;
  let largestAssetBytes = 0;
  let largestAssetPath = "";

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }

      const size = statSync(entryPath).size;
      fileCount += 1;
      totalBytes += size;
      if (size > largestAssetBytes) {
        largestAssetBytes = size;
        largestAssetPath = entryPath;
      }
    }
  }

  return {
    fileCount,
    totalBytes,
    largestAssetBytes,
    largestAssetPath,
  };
}

function formatMb(sizeInBytes: number): string {
  return `${(sizeInBytes / 1024 / 1024).toFixed(2)} MB`;
}

export async function buildWeb(): Promise<void> {
  console.log(withTag("step", "Building web frontend..."));

  const webEntry = join(WEB_DIR, "dist", "index.html");
  const buildResult = await runCommand(
    "bun",
    ["run", "build", "--", "--logLevel", "warn"],
    { cwd: WEB_DIR, quiet: true }
  );

  if (!(await Bun.file(webEntry).exists())) {
    throw new Error(`Web build artifacts not found at ${webEntry}`);
  }

  const stats = collectWebBuildStats(join(WEB_DIR, "dist"));
  console.log(
    `  ${withTag("ok", `Built in ${(buildResult.durationMs / 1000).toFixed(1)}s`)}`
  );
  console.log(
    `  ${withTag("info", `Assets: ${stats.fileCount} files, ${formatMb(stats.totalBytes)} total`)}`
  );
  if (stats.largestAssetPath.length > 0) {
    const largestAsset = relative(WEB_DIR, stats.largestAssetPath).replace(
      /\\/g,
      "/"
    );
    console.log(
      `  ${withTag("info", `Largest asset: ${largestAsset} (${formatMb(stats.largestAssetBytes)})`)}`
    );
  }

  const buildOutput = `${buildResult.stdout}\n${buildResult.stderr}`;
  if (buildOutput.includes("Some chunks are larger than 500 kB")) {
    console.warn(
      `  ${withTag("warn", "Vite reported large chunks (>500 kB). Consider additional code splitting.")}`
    );
  }

  console.log(`${withTag("ok", "Web frontend built successfully")}\n`);
}

// Run if executed directly
if (import.meta.main) {
  await buildWeb();
}
