#!/usr/bin/env bun

/**
 * Start Dastyar AI Services
 *
 * This script starts both the Whisper API server and the main Dastyar AI server.
 * Works cross-platform on Windows, macOS, and Linux.
 *
 * Usage:
 *   bun scripts/start.ts           # Start both services
 *   bun scripts/start.ts whisper   # Start only Whisper
 *   bun scripts/start.ts server    # Start only main server
 */

import { spawn } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync } from "node:fs";
import { join } from "node:path";
import {
  loadRootConfig,
  portFromUrl,
  serverUrl,
  whisperUrl,
} from "./app-config";

const isWindows = process.platform === "win32";
const DIST = join(import.meta.dir, "../dist");
const LOG_DIR = join(DIST, "logs");
const READY_TIMEOUT_MS = 30_000;
const POLL_MS = 500;
const appConfig = loadRootConfig();

const services = {
  whisper: {
    name: "Whisper API",
    bin: isWindows ? "whisper.exe" : "whisper",
    port: portFromUrl(appConfig.WHISPER_SERVER_URL),
    url: whisperUrl(appConfig),
  },
  server: {
    name: "Dastyar AI Server",
    bin: isWindows ? "dastyar-ai.exe" : "dastyar-ai",
    port: appConfig.PORT,
    url: serverUrl(appConfig),
  },
};

type ServiceName = keyof typeof services;

function checkBinary(service: ServiceName): boolean {
  const binPath = join(DIST, services[service].bin);
  if (!existsSync(binPath)) {
    console.error(
      `ERROR: ${services[service].name} binary not found: ${binPath}`
    );
    console.error("");
    console.error("Please build the project first:");
    console.error("  bun run build");
    return false;
  }
  return true;
}

async function checkPort(port: number): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${port}`, {
      method: "HEAD",
      signal: AbortSignal.timeout(2000),
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

/** Start the binary detached. Resolves with how it ended up. */
function launch(service: ServiceName): {
  exited: Promise<string>;
  logPath: string;
} {
  const { bin } = services[service];
  mkdirSync(LOG_DIR, { recursive: true });
  const logPath = join(LOG_DIR, `${service}.log`);
  const logFd = openSync(logPath, "a");

  const child = spawn(join(DIST, bin), [], {
    cwd: DIST,
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env: process.env,
    windowsHide: true,
  });

  // The child has its own copy of the descriptor.
  closeSync(logFd);

  const exited = new Promise<string>((resolve) => {
    child.once("error", (error) =>
      resolve(`failed to start: ${error.message}`)
    );
    child.once("exit", (code, signal) =>
      resolve(`exited early (code ${code}, signal ${signal})`)
    );
  });
  child.unref();
  return { exited, logPath };
}

async function startService(service: ServiceName): Promise<boolean> {
  const { name, bin, port, url } = services[service];

  console.log(`Starting ${name}...`);
  console.log(`   Binary: ${bin}`);
  console.log(`   Port: ${port}`);

  if (await checkPort(port)) {
    console.log(`   Already running at ${url}`);
    console.log("");
    return true;
  }

  if (!checkBinary(service)) {
    return false;
  }

  const { exited, logPath } = launch(service);

  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const early = await Promise.race([
      exited,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), POLL_MS)),
    ]);
    if (early) {
      console.error(`   ERROR: ${name} ${early}`);
      console.error(`   Log: ${logPath}`);
      console.log("");
      return false;
    }
    if (await checkPort(port)) {
      console.log(`   Started at ${url}`);
      console.log(`   Log: ${logPath}`);
      console.log("");
      return true;
    }
  }

  console.error(
    `   ERROR: ${name} did not respond within ${READY_TIMEOUT_MS / 1000}s`
  );
  console.error(`   Log: ${logPath}`);
  console.log("");
  return false;
}

async function main(): Promise<number> {
  const arg = process.argv[2];

  if (arg && arg !== "whisper" && arg !== "server") {
    console.error(`Unknown service "${arg}". Use "whisper" or "server".`);
    return 2;
  }

  console.log("============================================================");
  console.log("DASTYAR AI - SERVICE STARTER");
  console.log("============================================================");
  console.log("");

  const targets: ServiceName[] = arg ? [arg] : ["whisper", "server"];
  for (const target of targets) {
    if (!(await startService(target))) {
      return 1;
    }
  }

  console.log("============================================================");
  console.log("Services started.");
  console.log("============================================================");
  if (!arg) {
    console.log("");
    console.log("Services:");
    console.log(`  - Whisper API: ${services.whisper.url}`);
    console.log(`  - Main Server: ${services.server.url}`);
    console.log("");
    console.log("To stop services:");
    console.log("  bun scripts/stop.ts");
  }
  return 0;
}

process.exit(await main());
