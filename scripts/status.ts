#!/usr/bin/env bun

/**
 * Check Dastyar AI Services Status
 *
 * This script checks if the Whisper API server and main server are running.
 * Works cross-platform on Windows, macOS, and Linux.
 *
 * Usage:
 *   bun scripts/status.ts
 */

const services = [
  {
    name: "Whisper API",
    url: "http://localhost:8080",
    endpoint: "/v1/models",
  },
  {
    name: "Dastyar AI Server",
    url: "http://localhost:3000",
    endpoint: "/api/health",
  },
];

async function checkService(
  name: string,
  url: string,
  endpoint: string
): Promise<boolean> {
  try {
    const response = await fetch(`${url}${endpoint}`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });

    if (response.ok) {
      console.log(`✅ ${name}`);
      console.log(`   ${url} - Running`);
      return true;
    }
    console.log(`⚠️  ${name}`);
    console.log(`   ${url} - Responded with status ${response.status}`);
    return false;
  } catch {
    console.log(`❌ ${name}`);
    console.log(`   ${url} - Not running`);
    return false;
  }
}

async function main() {
  console.log("============================================================");
  console.log("📊 DASTYAR AI - SERVICE STATUS");
  console.log("============================================================");
  console.log("");

  const results = await Promise.all(
    services.map((service) =>
      checkService(service.name, service.url, service.endpoint)
    )
  );

  console.log("");
  console.log("============================================================");

  const allRunning = results.every((r) => r);

  if (allRunning) {
    console.log("✅ All services are running!");
  } else {
    console.log("⚠️  Some services are not running");
    console.log("");
    console.log("To start services:");
    console.log("  bun scripts/start.ts");
  }

  console.log("============================================================");

  process.exit(allRunning ? 0 : 1);
}

main();
