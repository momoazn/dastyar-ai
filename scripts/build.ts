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
import { separator, withTag } from "./build-log";
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
const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)$/;

type BuildPlatform = "current" | "windows" | "all";
type VersionBumpType = "patch" | "minor" | "major";

type BuildOptions = {
  platform: BuildPlatform;
  skipDeps: boolean;
  skipWeb: boolean;
  skipServer: boolean;
  skipWhisper: boolean;
  skipPackage: boolean;
  forceDeps: boolean;
  parallel: boolean;
  release: boolean;
  bump: VersionBumpType;
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
  release: false,
  bump: "minor",
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
    "--release": () => {
      options.release = true;
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

    if (arg.startsWith("--bump=")) {
      const bump = arg.split("=")[1];
      if (bump === "patch" || bump === "minor" || bump === "major") {
        options.bump = bump;
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

type RootPackage = {
  version: string;
};

async function readRootPackage(): Promise<RootPackage> {
  const pkgPath = join(ROOT, "package.json");
  const parsed = (await Bun.file(pkgPath).json()) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Root package.json is invalid");
  }

  const version = (parsed as { version?: unknown }).version;
  if (typeof version !== "string") {
    throw new Error("Root package.json must contain a string version");
  }

  return { version };
}

function bumpVersion(currentVersion: string, bump: VersionBumpType): string {
  const match = currentVersion.match(SEMVER_REGEX);
  if (!match) {
    throw new Error(
      `Unsupported version format "${currentVersion}". Expected semantic version like 1.2.3`
    );
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  if (bump === "major") {
    return `${major + 1}.0.0`;
  }
  if (bump === "minor") {
    return `${major}.${minor + 1}.0`;
  }
  return `${major}.${minor}.${patch + 1}`;
}

function gitOutput(args: string[]): string {
  const result = Bun.spawnSync(["git", ...args], {
    cwd: ROOT,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (result.exitCode !== 0) {
    const stderr = new TextDecoder().decode(result.stderr).trim();
    throw new Error(
      `git ${args.join(" ")} failed${stderr ? `: ${stderr}` : ""}`
    );
  }
  return new TextDecoder().decode(result.stdout).trim();
}

function assertCleanWorkingTreeForRelease(): void {
  const status = gitOutput(["status", "--porcelain"]);
  if (status.length > 0) {
    throw new Error(
      "Release build requires a clean working tree before bumping version. Commit or stash current changes first."
    );
  }
}

async function updateRootVersion(nextVersion: string): Promise<void> {
  const pkgPath = join(ROOT, "package.json");
  const parsed = (await Bun.file(pkgPath).json()) as Record<string, unknown>;
  parsed.version = nextVersion;
  await Bun.write(pkgPath, `${JSON.stringify(parsed, null, 2)}\n`);
}

async function commitReleaseVersion(nextVersion: string): Promise<void> {
  await runCommand("git", ["add", "package.json"], { cwd: ROOT, quiet: true });
  if (await pathExists(join(ROOT, "bun.lock"))) {
    await runCommand("git", ["add", "bun.lock"], { cwd: ROOT, quiet: true });
  }
  await runCommand(
    "git",
    ["commit", "-m", `chore(release): bump version to v${nextVersion}`],
    { cwd: ROOT, quiet: true }
  );
}

async function prepareReleaseVersion(options: BuildOptions): Promise<string> {
  const currentPackage = await readRootPackage();
  if (!options.release) {
    return currentPackage.version;
  }

  assertCleanWorkingTreeForRelease();
  const nextVersion = bumpVersion(currentPackage.version, options.bump);
  await updateRootVersion(nextVersion);
  await commitReleaseVersion(nextVersion);
  console.log(
    withTag(
      "info",
      `Release version bumped: ${currentPackage.version} → ${nextVersion}`
    )
  );
  return nextVersion;
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
    console.log(
      withTag("info", "Skipping dependency installation (--skip-deps)")
    );
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
    console.log(withTag("ok", "Dependencies unchanged, skipping install"));
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

  console.log(withTag("step", `Installing dependencies (${reason})...`));
  const installResult = await runCommand("bun", ["install"], {
    cwd: ROOT,
    quiet: true,
  });
  await writeBuildState({ dependencyFingerprint });
  console.log(
    withTag(
      "ok",
      `Dependencies ready in ${(installResult.durationMs / 1000).toFixed(1)}s`
    )
  );
}

async function runTimedStep(
  name: string,
  run: () => Promise<void>,
  timings: StepTiming[]
): Promise<void> {
  console.log(`\n${withTag("step", name)}`);
  const startedAt = Date.now();
  await run();
  const durationMs = Date.now() - startedAt;
  timings.push({ name, durationMs });
  console.log(
    withTag("ok", `${name} completed in ${(durationMs / 1000).toFixed(1)}s`)
  );
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
    console.log(withTag("info", "Skipping web and server build stages"));
    return;
  }

  if (!options.parallel || buildJobs.length === 1) {
    for (const job of buildJobs) {
      console.log(`🔨 Building ${job.name}...`);
      await job.run();
    }
    return;
  }

  console.log(withTag("step", "Building web and server in parallel..."));
  await Promise.all(
    buildJobs.map(async (job) => {
      await job.run();
    })
  );
  console.log(withTag("ok", "Parallel web/server stage completed"));
}

function isWindowsBuildTarget(platform: BuildPlatform): boolean {
  return platform === "windows" || platform === "all";
}

async function validateWindowsBinaryInDist(
  options: BuildOptions,
  appVersion: string
): Promise<void> {
  const binaryName = options.release
    ? `dastyar-ai-v${appVersion}.exe`
    : "dastyar-ai.exe";
  const binaryPath = join(DIST_DIR, binaryName);
  if (!(await Bun.file(binaryPath).exists())) {
    throw new Error(`Windows binary is missing in dist: ${binaryPath}`);
  }

  const signature = new Uint8Array(
    await Bun.file(binaryPath).slice(0, 2).arrayBuffer()
  );
  if (signature[0] !== 0x4d || signature[1] !== 0x5a) {
    throw new Error(`Invalid Windows executable header in ${binaryPath}`);
  }

  await verifyDistribution({
    appVersion,
    platform: options.platform,
    release: options.release,
  });
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

async function runWindowsPostBuildChecks(
  options: BuildOptions,
  appVersion: string
): Promise<void> {
  if (!isWindowsBuildTarget(options.platform)) {
    return;
  }

  if (options.skipPackage) {
    console.log(
      withTag(
        "info",
        "Skipping Windows post-build checks because packaging was skipped (--skip-package)"
      )
    );
    return;
  }

  console.log(withTag("step", "Running Windows post-build checks..."));
  await validateWindowsBinaryInDist(options, appVersion);
  await validateWindowsDistConfig();
  console.log(withTag("ok", "Windows post-build checks passed"));
}

function printHeader(options: BuildOptions): void {
  console.log(separator("info"));
  console.log(withTag("info", "DASTYAR AI - BUILD SYSTEM"));
  console.log(separator("info"));
  console.log("");
  console.log(withTag("info", "Build components:"));
  console.log("  • Web frontend (React 19 + Vite)");
  console.log("  • Server binary (Bun runtime + Hono API)");
  console.log("  • Whisper server (Go + whisper.cpp)");
  console.log("  • Distribution package");
  console.log("");
  console.log(withTag("info", `Platform: ${options.platform}`));
  console.log(
    withTag("info", `Release mode: ${options.release ? "enabled" : "disabled"}`)
  );
  console.log(
    withTag(
      "info",
      `Parallel web/server: ${options.parallel ? "enabled" : "disabled"}`
    )
  );
  console.log(separator("info"));
  console.log("");
}

type BuildSummaryOptions = {
  appVersion: string;
  artifacts: string[];
  options: BuildOptions;
  startedAt: number;
  timings: StepTiming[];
  warnings: string[];
};

function printTimings(startedAt: number, timings: StepTiming[]): void {
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(withTag("info", `Total build time: ${elapsed}s`));
  console.log(withTag("info", "Step timings:"));
  for (const timing of timings) {
    const seconds = (timing.durationMs / 1000).toFixed(1);
    console.log(`  • ${timing.name}: ${seconds}s`);
  }
  console.log("");
}

function printWarnings(warnings: string[]): void {
  if (warnings.length === 0) {
    return;
  }
  console.log(withTag("warn", "Build warnings:"));
  for (const warning of warnings) {
    console.log(`  • ${warning}`);
  }
  console.log("");
}

function printArtifactPreview(artifacts: string[]): void {
  if (artifacts.length === 0) {
    return;
  }

  console.log(`📁 Packaged artifacts (${artifacts.length}):`);
  const preview = artifacts.slice(0, 8);
  for (const artifact of preview) {
    console.log(`  • dist/${artifact}`);
  }
  if (artifacts.length > preview.length) {
    console.log(`  • ... and ${artifacts.length - preview.length} more`);
  }
}

function printReleaseBinaries(options: BuildOptions, appVersion: string): void {
  if (!options.release) {
    return;
  }

  console.log("Release binaries:");
  if (options.platform !== "windows") {
    console.log(`  • dist/dastyar-ai-v${appVersion}`);
  }
  if (options.platform !== "current" || process.platform === "win32") {
    console.log(`  • dist/dastyar-ai-v${appVersion}.exe`);
  }
  console.log("");
}

function printDistributionSummary(summary: BuildSummaryOptions): void {
  const { options, artifacts, appVersion } = summary;
  if (options.skipPackage) {
    console.log(withTag("info", "Packaging skipped (--skip-package)"));
    return;
  }

  console.log(withTag("ok", "Distribution ready in: dist/"));
  printArtifactPreview(artifacts);
  console.log("");
  console.log(withTag("info", `Build version: v${appVersion}`));
  printReleaseBinaries(options, appVersion);
  console.log("Next steps:");
  console.log("  1. Start Whisper API:  dist/whisper(.exe)");
  console.log(
    `  2. Start main server:  dist/${options.release ? `dastyar-ai-v${appVersion}` : "dastyar-ai"}(.exe)`
  );
  console.log("  3. Open browser:       http://localhost:3000");
  console.log("");
  console.log("See dist/README.md for more information");
}

function printSummary(summary: BuildSummaryOptions): void {
  console.log("");
  console.log(separator("ok"));
  console.log(withTag("ok", "BUILD COMPLETED SUCCESSFULLY"));
  console.log(separator("ok"));
  console.log("");
  printTimings(summary.startedAt, summary.timings);
  printWarnings(summary.warnings);
  printDistributionSummary(summary);

  console.log(separator("ok"));
}

async function main() {
  const startedAt = Date.now();
  const options = parseArgs();
  const timings: StepTiming[] = [];
  const isWindowsHost = process.platform === "win32";
  const isWindowsTarget = options.platform === "windows";
  let appVersion = "0.0.0";
  const buildWarnings: string[] = [];
  const packagedArtifacts: string[] = [];

  printHeader(options);

  try {
    await runTimedStep(
      "Release Versioning",
      async () => {
        appVersion = await prepareReleaseVersion(options);
      },
      timings
    );

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
              withTag(
                "info",
                "Skipping Whisper build: cross-compiling Whisper for Windows is not supported on this host"
              )
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
        async () => {
          const packageResult = await packageDist({
            appVersion,
            platform: options.platform,
            release: options.release,
          });
          buildWarnings.push(...packageResult.warnings);
          packagedArtifacts.push(...packageResult.artifacts);
        },
        timings
      );
    }

    await runTimedStep(
      "Windows Build Validation",
      async () => runWindowsPostBuildChecks(options, appVersion),
      timings
    );

    printSummary({
      startedAt,
      timings,
      options,
      appVersion,
      artifacts: packagedArtifacts,
      warnings: buildWarnings,
    });
  } catch (error) {
    console.error("");
    console.error(separator("error"));
    console.error(withTag("error", "BUILD FAILED"));
    console.error(separator("error"));
    console.error("");
    if (error instanceof Error) {
      console.error(withTag("error", error.message));
      if (error.stack) {
        console.error("");
        console.error(error.stack);
      }
    } else {
      console.error("Error:", error);
    }
    console.error("");
    process.exit(1);
  }
}

await main();
