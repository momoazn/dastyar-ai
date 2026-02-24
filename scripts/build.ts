#!/usr/bin/env bun

/**
 * Dastyar AI - Main Build Orchestrator
 *
 * Usage:
 *   bun scripts/build.ts
 *   bun scripts/build.ts --platform=windows
 *   bun scripts/build.ts --platform=all
 *   bun scripts/build.ts --skip-deps
 *   bun scripts/build.ts --force-deps
 *   bun scripts/build.ts --no-parallel
 *   bun scripts/build.ts --skip-package
 */

import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { CONFIG_KEYS, CONFIG_SCHEMA } from "../apps/server/src/config-schema";
import { buildServer } from "./build-server";
import { buildWeb } from "./build-web";
import { buildWhisper } from "./build-whisper";
import { checkDependencies } from "./check-dependencies";
import { packageDist, verifyDistribution } from "./package-dist";
import { DIST_DIR, REPO_ROOT } from "./project-paths";
import { runCommand } from "./run-command";

const ROOT = REPO_ROOT;
const BUILD_STATE_DIR = join(ROOT, ".turbo");
const BUILD_STATE_FILE = join(BUILD_STATE_DIR, "build-state.json");

const DEPENDENCY_FILES = [
  "bun.lock",
  "package.json",
  "apps/server/package.json",
  "apps/web/package.json",
  "apps/whisper/package.json",
] as const;

type BuildPlatform = "current" | "windows" | "all";

type BuildOptions = {
  platform: BuildPlatform;
  skipDeps: boolean;
  skipWeb: boolean;
  skipServer: boolean;
  skipWhisper: boolean;
  skipPackage: boolean;
  forceDeps: boolean;
  parallel: boolean;
};

type BuildState = {
  dependencyFingerprint?: string;
};

type StepTiming = {
  name: string;
  durationMs: number;
};

const DEFAULT_OPTIONS: BuildOptions = {
  platform: "current",
  skipDeps: false,
  skipWeb: false,
  skipServer: false,
  skipWhisper: false,
  skipPackage: false,
  forceDeps: false,
  parallel: true,
};

function parseArgs(): BuildOptions {
  const args = process.argv.slice(2);
  const options: BuildOptions = { ...DEFAULT_OPTIONS };
  const flagHandlers: Record<string, () => void> = {
    "--skip-deps": () => {
      options.skipDeps = true;
    },
    "--skip-web": () => {
      options.skipWeb = true;
    },
    "--skip-server": () => {
      options.skipServer = true;
    },
    "--skip-whisper": () => {
      options.skipWhisper = true;
    },
    "--skip-package": () => {
      options.skipPackage = true;
    },
    "--force-deps": () => {
      options.forceDeps = true;
    },
    "--no-parallel": () => {
      options.parallel = false;
    },
  };

  for (const arg of args) {
    if (arg.startsWith("--platform=")) {
      const platform = arg.split("=")[1];
      if (
        platform === "current" ||
        platform === "windows" ||
        platform === "all"
      ) {
        options.platform = platform;
      }
      continue;
    }

    const handler = flagHandlers[arg];
    if (handler) {
      handler();
    }
  }

  return options;
}

async function pathExists(path: string): Promise<boolean> {
  return await Bun.file(path).exists();
}

async function readBuildState(): Promise<BuildState> {
  if (!(await pathExists(BUILD_STATE_FILE))) {
    return {};
  }

  try {
    const parsed = (await Bun.file(BUILD_STATE_FILE).json()) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed as BuildState;
  } catch {
    return {};
  }
}

async function writeBuildState(state: BuildState): Promise<void> {
  if (!(await pathExists(BUILD_STATE_DIR))) {
    mkdirSync(BUILD_STATE_DIR, { recursive: true });
  }
  await Bun.write(BUILD_STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
}

async function getDependencyFingerprint(): Promise<string> {
  const hash = createHash("sha256");

  for (const relativePath of DEPENDENCY_FILES) {
    const absolutePath = join(ROOT, relativePath);
    hash.update(relativePath);
    hash.update(":");

    if (await pathExists(absolutePath)) {
      const fileData = await Bun.file(absolutePath).arrayBuffer();
      hash.update(Buffer.from(fileData));
    }
    hash.update(";");
  }

  return hash.digest("hex");
}

async function hasInstalledDependencies(): Promise<boolean> {
  return await pathExists(join(ROOT, "node_modules"));
}

function isCiEnvironment(): boolean {
  const value = process.env.CI;
  if (!value) {
    return false;
  }
  return value.toLowerCase() !== "false";
}

async function installDependenciesIfNeeded(
  options: BuildOptions
): Promise<void> {
  if (options.skipDeps) {
    console.log("⏭️  Skipping dependency installation (--skip-deps)\n");
    return;
  }

  const inCi = isCiEnvironment();
  const dependencyFingerprint = await getDependencyFingerprint();
  const state = await readBuildState();
  const fingerprintChanged =
    state.dependencyFingerprint !== dependencyFingerprint;
  const depsInstalled = await hasInstalledDependencies();

  const shouldInstall =
    options.forceDeps || inCi || !depsInstalled || fingerprintChanged;

  if (!shouldInstall) {
    console.log("⚡ Dependencies unchanged, skipping install\n");
    return;
  }

  let reason = "dependency fingerprint changed";
  if (options.forceDeps) {
    reason = "--force-deps";
  } else if (inCi) {
    reason = "CI environment";
  } else if (!depsInstalled) {
    reason = "node_modules missing";
  }

  console.log(`📦 Installing dependencies (${reason})...`);
  await runCommand("bun", ["install"], { cwd: ROOT });
  await writeBuildState({ dependencyFingerprint });
  console.log("✅ Dependencies ready\n");
}

async function runTimedStep(
  name: string,
  run: () => Promise<void>,
  timings: StepTiming[]
): Promise<void> {
  const startedAt = Date.now();
  await run();
  timings.push({
    name,
    durationMs: Date.now() - startedAt,
  });
}

async function buildWebAndServer(options: BuildOptions): Promise<void> {
  const buildJobs: Array<{ name: string; run: () => Promise<void> }> = [];

  if (!options.skipWeb) {
    buildJobs.push({
      name: "Web Frontend",
      run: async () => buildWeb(),
    });
  }

  if (!options.skipServer) {
    buildJobs.push({
      name: "Server Binary",
      run: async () => buildServer({ platform: options.platform }),
    });
  }

  if (buildJobs.length === 0) {
    console.log("⏭️  Skipping web and server build stages\n");
    return;
  }

  if (!options.parallel || buildJobs.length === 1) {
    for (const job of buildJobs) {
      console.log(`🔨 Building ${job.name}...`);
      await job.run();
    }
    console.log("");
    return;
  }

  console.log("⚡ Building web and server in parallel...");
  await Promise.all(
    buildJobs.map(async (job) => {
      await job.run();
    })
  );
  console.log("✅ Parallel web/server stage completed\n");
}

function isWindowsBuildTarget(platform: BuildPlatform): boolean {
  return platform === "windows" || platform === "all";
}

async function validateWindowsBinaryInDist(
  options: BuildOptions
): Promise<void> {
  const binaryPath = join(DIST_DIR, "dastyar-ai.exe");
  if (!(await Bun.file(binaryPath).exists())) {
    throw new Error(`Windows binary is missing in dist: ${binaryPath}`);
  }

  const signature = new Uint8Array(
    await Bun.file(binaryPath).slice(0, 2).arrayBuffer()
  );
  if (signature[0] !== 0x4d || signature[1] !== 0x5a) {
    throw new Error(`Invalid Windows executable header in ${binaryPath}`);
  }

  await verifyDistribution({ platform: options.platform });
}

async function validateWindowsDistConfig(): Promise<void> {
  const configPath = join(DIST_DIR, "config.json");
  if (!(await Bun.file(configPath).exists())) {
    throw new Error(`dist config is missing: ${configPath}`);
  }

  const parsed = (await Bun.file(configPath).json()) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`dist config must be a JSON object: ${configPath}`);
  }

  const config = parsed as Record<string, unknown>;
  const missingKeys = CONFIG_KEYS.filter((key) => !(key in config));
  if (missingKeys.length > 0) {
    throw new Error(
      `dist config is missing required keys: ${missingKeys.join(", ")}`
    );
  }

  const unknownKeys = Object.keys(config).filter(
    (key) => !CONFIG_KEYS.includes(key as (typeof CONFIG_KEYS)[number])
  );
  if (unknownKeys.length > 0) {
    throw new Error(`dist config has unknown keys: ${unknownKeys.join(", ")}`);
  }

  const configParse = CONFIG_SCHEMA.safeParse(config);
  if (!configParse.success) {
    throw new Error(
      `dist config has invalid values: ${JSON.stringify(configParse.error.flatten())}`
    );
  }
}

async function runWindowsPostBuildChecks(options: BuildOptions): Promise<void> {
  if (!isWindowsBuildTarget(options.platform)) {
    return;
  }

  if (options.skipPackage) {
    console.log(
      "⏭️  Skipping Windows post-build checks because packaging was skipped (--skip-package)\n"
    );
    return;
  }

  console.log("🔍 Running Windows post-build checks...");
  await validateWindowsBinaryInDist(options);
  await validateWindowsDistConfig();
  console.log("✅ Windows post-build checks passed\n");
}

function printHeader(options: BuildOptions): void {
  console.log("============================================================");
  console.log("🚀 DASTYAR AI - BUILD SYSTEM");
  console.log("============================================================");
  console.log("");
  console.log("Building:");
  console.log("  • Web frontend (React 19 + Vite)");
  console.log("  • Server binary (Bun runtime + Hono API)");
  console.log("  • Whisper server (Go + whisper.cpp)");
  console.log("  • Distribution package");
  console.log("");
  console.log(`Platform: ${options.platform}`);
  console.log(
    `Parallel web/server: ${options.parallel ? "enabled" : "disabled"}`
  );
  console.log("============================================================");
  console.log("");
}

function printSummary(
  startedAt: number,
  timings: StepTiming[],
  options: BuildOptions
): void {
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

  console.log("");
  console.log("============================================================");
  console.log("🎉 BUILD COMPLETED SUCCESSFULLY");
  console.log("============================================================");
  console.log("");
  console.log(`⏱️  Total build time: ${elapsed}s`);
  console.log("📊 Step timings:");
  for (const timing of timings) {
    const seconds = (timing.durationMs / 1000).toFixed(1);
    console.log(`  • ${timing.name}: ${seconds}s`);
  }
  console.log("");

  if (options.skipPackage) {
    console.log("ℹ️  Packaging skipped (--skip-package)");
  } else {
    console.log("📦 Distribution ready in: dist/");
    console.log("");
    console.log("Next steps:");
    console.log("  1. Start Whisper API:  dist/whisper(.exe)");
    console.log("  2. Start main server:  dist/dastyar-ai(.exe)");
    console.log("  3. Open browser:       http://localhost:3000");
    console.log("");
    console.log("See dist/README.md for more information");
  }

  console.log("============================================================");
}

async function main() {
  const startedAt = Date.now();
  const options = parseArgs();
  const timings: StepTiming[] = [];
  const isWindowsHost = process.platform === "win32";
  const isWindowsTarget = options.platform === "windows";

  printHeader(options);

  try {
    await runTimedStep(
      "Dependency Check",
      async () => checkDependencies(),
      timings
    );

    await runTimedStep(
      "Dependency Install",
      async () => installDependenciesIfNeeded(options),
      timings
    );

    await runTimedStep(
      "Web + Server Build",
      async () => buildWebAndServer(options),
      timings
    );

    if (!options.skipWhisper) {
      await runTimedStep(
        "Whisper Build",
        async () => {
          if (isWindowsTarget && !isWindowsHost) {
            console.log(
              "⏭️  Skipping Whisper build: cross-compiling Whisper for Windows is not supported on this host\n"
            );
            return;
          }
          await buildWhisper();
        },
        timings
      );
    }

    if (!options.skipPackage) {
      await runTimedStep(
        "Distribution Packaging",
        async () => packageDist({ platform: options.platform }),
        timings
      );
    }

    await runTimedStep(
      "Windows Build Validation",
      async () => runWindowsPostBuildChecks(options),
      timings
    );

    printSummary(startedAt, timings, options);
  } catch (error) {
    console.error("");
    console.error(
      "============================================================"
    );
    console.error("❌ BUILD FAILED");
    console.error(
      "============================================================"
    );
    console.error("");
    console.error("Error:", error instanceof Error ? error.message : error);
    console.error("");
    process.exit(1);
  }
}

await main();
