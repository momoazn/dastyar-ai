#!/usr/bin/env bun

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import JSZip from "jszip";

const projectName = "dastyar-ai";
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const releaseDir = "release";
const folderName = `${projectName}-source-${timestamp}`;
const archivePath = join(releaseDir, `${folderName}.zip`);

const excludedPrefixes = [
  "dist/",
  "node_modules/",
  "apps/server/dist/",
  "apps/web/dist/",
  "apps/server/generated-images/",
  "apps/server/uploaded-documents/",
  "apps/server/config.json",
  "apps/whisper/.go-work/",
  "apps/whisper/models/",
  "apps/whisper/temp/",
  "apps/whisper/whisper.cpp/",
  "release/",
  "tmp/",
] as const;

function shouldInclude(path: string): boolean {
  return !excludedPrefixes.some((prefix) => path.startsWith(prefix));
}

function getSourceFiles(): string[] {
  const result = Bun.spawnSync(
    ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
    {
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  if (result.exitCode !== 0) {
    const stderr = new TextDecoder().decode(result.stderr).trim();
    throw new Error(`git ls-files failed${stderr ? `: ${stderr}` : ""}`);
  }

  return new TextDecoder()
    .decode(result.stdout)
    .split("\n")
    .filter(Boolean)
    .filter(shouldInclude)
    .filter((file) => existsSync(file));
}

async function main(): Promise<void> {
  mkdirSync(releaseDir, { recursive: true });

  const trackedFiles = getSourceFiles();
  const zip = new JSZip();

  for (const file of trackedFiles) {
    zip.file(`${folderName}/${file}`, readFileSync(file));
  }

  const buffer = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  await Bun.write(archivePath, buffer);
  console.log(`Created ${archivePath}`);
  console.log(`Included ${trackedFiles.length} source files`);
}

await main();
