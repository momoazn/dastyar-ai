#!/usr/bin/env bun

/**
 * Stop Dastyar AI Services
 *
 * Stops the Whisper API server and the main Dastyar AI server.
 * Works on Windows, macOS, and Linux.
 *
 * It finds the process that listens on the configured port. It stops that
 * process only if its name matches the service binary. It sends a normal stop
 * signal first, then forces the stop after a short wait.
 *
 * Usage:
 *   bun scripts/stop.ts           # Stop both services
 *   bun scripts/stop.ts whisper   # Stop only Whisper
 *   bun scripts/stop.ts server    # Stop only main server
 */

import { execFileSync } from "node:child_process";
import { basename } from "node:path";
import { loadRootConfig, portFromUrl } from "./app-config";

const isWindows = process.platform === "win32";
const WHITESPACE_REGEX = /\s+/;
const NUMERIC_REGEX = /^\d+$/;
const QUOTED_FIRST_FIELD_REGEX = /^"([^"]+)"/;
const GRACE_MS = 5000;
const POLL_MS = 200;

const appConfig = loadRootConfig();

const services = {
  whisper: {
    name: "Whisper API",
    bin: isWindows ? "whisper.exe" : "whisper",
    port: portFromUrl(appConfig.WHISPER_SERVER_URL),
  },
  server: {
    name: "Dastyar AI Server",
    bin: isWindows ? "dastyar-ai.exe" : "dastyar-ai",
    port: appConfig.PORT,
  },
};

type ServiceName = keyof typeof services;

function run(cmd: string, args: string[]): string {
  return execFileSync(cmd, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

/** PIDs that listen on a TCP port. Empty when none or when the lookup fails. */
function listenerPids(port: number): number[] {
  try {
    const pids = new Set<number>();
    if (isWindows) {
      for (const line of run("netstat", ["-ano", "-p", "TCP"]).split("\n")) {
        const parts = line.trim().split(WHITESPACE_REGEX);
        // Proto, Local, Foreign, State, PID
        const local = parts[1] ?? "";
        const pid = parts.at(-1) ?? "";
        if (
          parts[3] === "LISTENING" &&
          local.endsWith(`:${port}`) &&
          NUMERIC_REGEX.test(pid)
        ) {
          pids.add(Number(pid));
        }
      }
    } else {
      const out = run("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"]);
      for (const pid of out.split("\n")) {
        if (NUMERIC_REGEX.test(pid.trim())) {
          pids.add(Number(pid.trim()));
        }
      }
    }
    return [...pids];
  } catch {
    // lsof exits 1 when nothing listens; netstat failure is treated the same.
    return [];
  }
}

function processName(pid: number): string | null {
  try {
    if (isWindows) {
      const out = run("tasklist", [
        "/FI",
        `PID eq ${pid}`,
        "/FO",
        "CSV",
        "/NH",
      ]).trim();
      const match = out.match(QUOTED_FIRST_FIELD_REGEX);
      return match ? match[1] : null;
    }
    const out = run("ps", ["-p", String(pid), "-o", "comm="]).trim();
    return out ? basename(out) : null;
  } catch {
    return null;
  }
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM means the process exists but we may not signal it.
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

function terminate(pid: number, force: boolean): void {
  try {
    if (isWindows) {
      run(
        "taskkill",
        force ? ["/F", "/T", "/PID", String(pid)] : ["/PID", String(pid)]
      );
    } else {
      process.kill(pid, force ? "SIGKILL" : "SIGTERM");
    }
  } catch {
    // Already gone, or no permission. The caller checks liveness afterwards.
  }
}

async function waitForExit(pid: number, ms: number): Promise<boolean> {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (!isAlive(pid)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
  return !isAlive(pid);
}

async function stopPid(pid: number): Promise<boolean> {
  terminate(pid, false);
  if (await waitForExit(pid, GRACE_MS)) {
    return true;
  }
  terminate(pid, true);
  return await waitForExit(pid, GRACE_MS);
}

async function stopService(service: ServiceName): Promise<boolean> {
  const { name, bin, port } = services[service];

  console.log(`Stopping ${name}...`);

  const pids = listenerPids(port);
  if (pids.length === 0) {
    console.log("   Not running or already stopped");
    console.log("");
    return true;
  }

  let ok = true;
  for (const pid of pids) {
    const actual = processName(pid);
    if (actual?.toLowerCase() !== bin.toLowerCase()) {
      console.log(
        `   Skipped PID ${pid}: it is "${actual ?? "unknown"}", not "${bin}"`
      );
      ok = false;
      continue;
    }
    if (await stopPid(pid)) {
      console.log(`   Stopped PID ${pid}`);
    } else {
      console.log(`   Could not stop PID ${pid}`);
      ok = false;
    }
  }

  console.log("");
  return ok;
}

async function main(): Promise<number> {
  const arg = process.argv[2];

  if (arg && arg !== "whisper" && arg !== "server") {
    console.error(`Unknown service "${arg}". Use "whisper" or "server".`);
    return 2;
  }

  console.log("============================================================");
  console.log("DASTYAR AI - SERVICE STOPPER");
  console.log("============================================================");
  console.log("");

  const targets: ServiceName[] = arg ? [arg] : ["server", "whisper"];
  let ok = true;
  for (const target of targets) {
    ok = (await stopService(target)) && ok;
  }

  console.log("============================================================");
  console.log(ok ? "Done." : "Some services were not stopped.");
  console.log("============================================================");
  return ok ? 0 : 1;
}

process.exit(await main());
