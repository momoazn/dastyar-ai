#!/usr/bin/env bun

/**
 * Stop Dastyar AI Services
 *
 * This script stops both the Whisper API server and the main Dastyar AI server.
 * Works cross-platform on Windows, macOS, and Linux.
 *
 * Usage:
 *   bun scripts/stop.ts           # Stop both services
 *   bun scripts/stop.ts whisper   # Stop only Whisper
 *   bun scripts/stop.ts server    # Stop only main server
 */

import { execSync } from "node:child_process";

const isWindows = process.platform === "win32";

// Regex patterns at top level for performance
const WHITESPACE_REGEX = /\s+/;
const NUMERIC_REGEX = /^\d+$/;

const services = {
  whisper: {
    name: "Whisper API",
    processName: isWindows ? "whisper.exe" : "whisper",
    port: 8080,
  },
  server: {
    name: "Dastyar AI Server",
    processName: isWindows ? "dastyar-ai.exe" : "dastyar-ai",
    port: 3000,
  },
};

type ServiceName = keyof typeof services;

function killProcess(processName: string): boolean {
  try {
    if (isWindows) {
      // Windows: Use taskkill
      execSync(`taskkill /F /IM ${processName}`, {
        stdio: "ignore",
      });
    } else {
      // Unix: Use pkill
      execSync(`pkill -f ${processName}`, {
        stdio: "ignore",
      });
    }
    return true;
  } catch {
    return false;
  }
}

function killByPort(port: number): boolean {
  try {
    if (isWindows) {
      // Windows: Find PID and kill
      const findCmd = `netstat -ano | findstr :${port}`;
      const output = execSync(findCmd, { encoding: "utf8" });
      const lines = output
        .split("\n")
        .filter((line) => line.includes("LISTENING"));

      for (const line of lines) {
        const parts = line.trim().split(WHITESPACE_REGEX);
        const pid = parts.at(-1);
        if (pid && NUMERIC_REGEX.test(pid)) {
          execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
        }
      }
    } else {
      // Unix: Use lsof
      const findCmd = `lsof -ti:${port}`;
      const output = execSync(findCmd, { encoding: "utf8" }).trim();
      if (output) {
        execSync(`kill -9 ${output}`, { stdio: "ignore" });
      }
    }
    return true;
  } catch {
    return false;
  }
}

function stopService(service: ServiceName): void {
  const { name, processName, port } = services[service];

  console.log(`🛑 Stopping ${name}...`);

  let stopped = false;

  // Try to kill by process name
  if (killProcess(processName)) {
    console.log("   ✅ Stopped by process name");
    stopped = true;
  }

  // Try to kill by port as backup
  if (!stopped && killByPort(port)) {
    console.log(`   ✅ Stopped by port ${port}`);
    stopped = true;
  }

  if (!stopped) {
    console.log("   ℹ️  Not running or already stopped");
  }

  console.log("");
}

function main() {
  const arg = process.argv[2];

  console.log("============================================================");
  console.log("🛑 DASTYAR AI - SERVICE STOPPER");
  console.log("============================================================");
  console.log("");

  if (arg === "whisper") {
    stopService("whisper");
  } else if (arg === "server") {
    stopService("server");
  } else {
    // Stop both services
    console.log("Stopping all services...");
    console.log("");

    stopService("server");
    stopService("whisper");

    console.log("============================================================");
    console.log("✅ All services stopped!");
    console.log("============================================================");
  }
}

main();
