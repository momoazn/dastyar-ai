import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

type BuildInfo = {
  version: string;
  release: boolean;
  builtAt?: string;
};

const FALLBACK_INFO: BuildInfo = {
  version: "0.0.0",
  release: false,
};

let cached: BuildInfo | null = null;

function getRuntimeBaseDir(): string {
  const execPath = process.execPath ?? "";
  const normalized = execPath.toLowerCase();
  if (normalized.includes("bun")) {
    return process.cwd();
  }
  return dirname(execPath);
}

function readRootVersionFallback(): string | undefined {
  const candidates = [
    resolve(import.meta.dir, "../../../../../package.json"),
    resolve(process.cwd(), "package.json"),
  ];

  for (const candidate of candidates) {
    if (!existsSync(candidate)) {
      continue;
    }
    try {
      const parsed = JSON.parse(readFileSync(candidate, "utf8")) as {
        version?: unknown;
      };
      if (typeof parsed.version === "string") {
        return parsed.version;
      }
    } catch {
      // Try next candidate package file.
    }
  }

  return;
}

export function getBuildInfo(): BuildInfo {
  if (cached) {
    return cached;
  }

  const buildInfoPath = join(getRuntimeBaseDir(), "build-info.json");
  if (existsSync(buildInfoPath)) {
    try {
      const parsed = JSON.parse(readFileSync(buildInfoPath, "utf8")) as {
        version?: unknown;
        release?: unknown;
        builtAt?: unknown;
      };
      if (typeof parsed.version === "string") {
        cached = {
          version: parsed.version,
          release: parsed.release === true,
          builtAt:
            typeof parsed.builtAt === "string" ? parsed.builtAt : undefined,
        };
        return cached;
      }
    } catch {
      // Fall back below.
    }
  }

  const rootVersion = readRootVersionFallback();
  cached = rootVersion
    ? { version: rootVersion, release: false }
    : { ...FALLBACK_INFO };
  return cached;
}
