#!/usr/bin/env bun

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import JSZip from "jszip";
import { REPO_ROOT } from "./project-paths";

type PackageManifest = {
  name: string;
  version: string;
};

const ROOT = REPO_ROOT;
const TOP_LEVEL_ALLOWLIST = new Set([
  "apps",
  "scripts",
  "package.json",
  "bun.lock",
  "turbo.json",
  "tsconfig.json",
]);

const EXCLUDED_DIR_NAMES = new Set([
  ".git",
  "node_modules",
  ".turbo",
  ".idea",
  ".vscode",
  "dist",
  "build",
  "coverage",
  ".nyc_output",
  ".cache",
  ".parcel-cache",
  ".next",
  ".nuxt",
  ".output",
  ".react-router",
  ".tanstack",
  "tmp",
  "temp",
]);

const EXCLUDED_PATH_PREFIXES = [
  ".git/",
  ".github/",
  ".opencode/",
  "docs/",
  "specs/",
  "report/",
  "apps/server/dist/",
  "apps/web/dist/",
  "apps/whisper/dist/",
  "apps/whisper/temp/",
  "apps/whisper/whisper.cpp/",
  "apps/whisper/.go-work/",
  "apps/whisper/models/",
  "apps/whisper/ffmpeg-binaries/",
  "generated-images/",
  "uploaded-documents/",
  "whisper-models/",
  "worktrees/",
];

const EXCLUDED_EXACT_PATHS = new Set([
  "server.log",
  "config.json",
  "apps/whisper/whisper",
  "apps/whisper/whisper.exe",
]);

const EXCLUDED_SUFFIXES = [
  ".log",
  ".tsbuildinfo",
  ".db",
  ".sqlite",
  ".sqlite3",
  ".pid",
  ".pid.lock",
  ".zip",
];

const normalize = (path: string): string => path.split("\\").join("/");

function shouldExclude(relativePath: string, isDirectory: boolean): boolean {
  const normalized = normalize(relativePath);

  if (!normalized) {
    return false;
  }

  if (EXCLUDED_EXACT_PATHS.has(normalized)) {
    return true;
  }

  const [topLevel] = normalized.split("/");
  if (topLevel && !TOP_LEVEL_ALLOWLIST.has(topLevel)) {
    return true;
  }

  for (const prefix of EXCLUDED_PATH_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      return true;
    }
  }

  if (normalized === ".env" || normalized.startsWith(".env.")) {
    return true;
  }

  if (isDirectory) {
    const parts = normalized.split("/");
    for (const part of parts) {
      if (EXCLUDED_DIR_NAMES.has(part)) {
        return true;
      }
    }
    return false;
  }

  for (const suffix of EXCLUDED_SUFFIXES) {
    if (normalized.endsWith(suffix)) {
      return true;
    }
  }

  return false;
}

function collectFiles(
  baseDir: string,
  relativeDir: string,
  output: string[]
): void {
  const currentDir = join(baseDir, relativeDir);
  const entries = readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = relativeDir
      ? normalize(join(relativeDir, entry.name))
      : entry.name;

    if (entry.isSymbolicLink()) {
      continue;
    }

    if (shouldExclude(relativePath, entry.isDirectory())) {
      continue;
    }

    if (entry.isDirectory()) {
      collectFiles(baseDir, relativePath, output);
      continue;
    }

    if (entry.isFile()) {
      output.push(relativePath);
    }
  }
}

async function main(): Promise<void> {
  const manifest = JSON.parse(
    readFileSync(join(ROOT, "package.json"), "utf8")
  ) as PackageManifest;

  const prefix = `${manifest.name}-source-v${manifest.version}`;
  const outputZip = join(ROOT, `${prefix}.zip`);
  const files: string[] = [];
  collectFiles(ROOT, "", files);

  const zip = new JSZip();
  for (const relativePath of files) {
    const absolutePath = join(ROOT, relativePath);
    zip.file(
      `${prefix}/${normalize(relativePath)}`,
      readFileSync(absolutePath)
    );
  }

  const buffer = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  await Bun.write(outputZip, buffer);
  process.stdout.write(`✅ Source package created: ${outputZip}\n`);
  process.stdout.write(`📦 Files included: ${files.length}\n`);
}

await main();
