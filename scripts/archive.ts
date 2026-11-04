#!/usr/bin/env bun

import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import JSZip from "jszip";
import { REPO_ROOT } from "./project-paths";

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
  "release/",
  "tmp/",
] as const;

const includedIgnoredSourceDirs = ["apps/whisper/whisper.cpp"] as const;

const excludedArchivePrefixes = [
  "apps/whisper/whisper.cpp/.git/",
  "apps/whisper/whisper.cpp/build/",
  "apps/whisper/whisper.cpp/build_go/",
  "apps/whisper/whisper.cpp/cmake-build-",
  "apps/whisper/whisper.cpp/models/",
  "apps/whisper/whisper.cpp/samples/",
] as const;

function toArchivePath(path: string): string {
  return path.replaceAll("\\", "/");
}

function shouldInclude(path: string): boolean {
  const normalizedPath = toArchivePath(path);
  return !(
    excludedPrefixes.some((prefix) => normalizedPath.startsWith(prefix)) ||
    excludedArchivePrefixes.some((prefix) => normalizedPath.startsWith(prefix))
  );
}

function isSourceFile(path: string): boolean {
  return !path.endsWith(".DS_Store") && shouldInclude(path);
}

function collectFilesInDirectory(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  const files: string[] = [];
  const entries = readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (!shouldInclude(`${path}/`) && entry.isDirectory()) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...collectFilesInDirectory(path));
      continue;
    }

    if (entry.isFile() && isSourceFile(path)) {
      files.push(path);
    }
  }

  return files;
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
    .filter(isSourceFile)
    .filter((file) => existsSync(file));
}

function getArchiveFiles(): string[] {
  const files = new Set(getSourceFiles());

  for (const directory of includedIgnoredSourceDirs) {
    for (const file of collectFilesInDirectory(directory)) {
      files.add(file);
    }
  }

  return [...files].sort();
}

async function main(): Promise<void> {
  // Paths below are relative to the repo root, whatever the caller's cwd is.
  process.chdir(REPO_ROOT);
  mkdirSync(releaseDir, { recursive: true });

  const trackedFiles = getArchiveFiles();
  const zip = new JSZip();

  for (const file of trackedFiles) {
    zip.file(`${folderName}/${toArchivePath(file)}`, readFileSync(file));
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
