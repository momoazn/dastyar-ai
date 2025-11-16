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
import { existsSync } from "node:fs";
import { join } from "node:path";

const isWindows = process.platform === "win32";
const DIST = join(import.meta.dir, "../dist");

const services = {
  whisper: {
    name: "Whisper API",
    bin: isWindows ? "whisper.exe" : "whisper",
    port: 8080,
    url: "http://localhost:8080",
  },
  server: {
    name: "Dastyar AI Server",
    bin: isWindows ? "dastyar-ai.exe" : "dastyar-ai",
    port: 3000,
    url: "http://localhost:3000",
  },
};

type ServiceName = keyof typeof services;

function checkBinary(service: ServiceName): boolean {
  const binPath = join(DIST, services[service].bin);
  if (!existsSync(binPath)) {
    console.error(`❌ ${services[service].name} binary not found: ${binPath}`);
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
    });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

async function startService(service: ServiceName): Promise<void> {
  const { name, bin, port, url } = services[service];

  console.log(`🚀 Starting ${name}...`);
  console.log(`   Binary: ${bin}`);
  console.log(`   Port: ${port}`);

  // Check if already running
  if (await checkPort(port)) {
    console.log(`   ⚠️  Already running at ${url}`);
    console.log("");
    return;
  }

  // Check binary exists
  if (!checkBinary(service)) {
    process.exit(1);
  }

  const binPath = join(DIST, bin);

  // Start the service in the background
  const child = spawn(binPath, [], {
    cwd: DIST,
    detached: true,
    stdio: "ignore",
    env: process.env,
  });

  child.unref();

  // Wait a moment and check if it started
  await new Promise((resolve) => setTimeout(resolve, 2000));

  if (await checkPort(port)) {
    console.log(`   ✅ Started successfully at ${url}`);
  } else {
    console.log("   ⚠️  Service started but not responding yet");
    console.log("   Check logs for details");
  }

  console.log("");
}

async function main() {
  const arg = process.argv[2];

  console.log("============================================================");
  console.log("🚀 DASTYAR AI - SERVICE STARTER");
  console.log("============================================================");
  console.log("");

  if (arg === "whisper") {
    await startService("whisper");
  } else if (arg === "server") {
    await startService("server");
  } else {
    // Start both services
    console.log("Starting all services...");
    console.log("");

    await startService("whisper");
    await startService("server");

    console.log("============================================================");
    console.log("✅ All services started!");
    console.log("============================================================");
    console.log("");
    console.log("Services:");
    console.log(`  • Whisper API: ${services.whisper.url}`);
    console.log(`  • Main Server: ${services.server.url}`);
    console.log("");
    console.log("Open your browser:");
    console.log(`  ${services.server.url}`);
    console.log("");
    console.log("To stop services:");
    console.log("  bun scripts/stop.ts");
    console.log("============================================================");
  }
}

main();
