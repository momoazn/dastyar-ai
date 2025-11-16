#!/usr/bin/env bun

console.log("===========================================");
console.log("Running All API Tests");
console.log("===========================================");
console.log("");

const tests = [
  {
    name: "Whisper API Test",
    command: "bun run scripts/testing/test-whisper-api.ts",
    cwd: "/Users/mohamadhosein/Workspace/side/dastyar-ai",
  },
  {
    name: "Complete API Test (ORPC)",
    command: "bun run test-complete-api.ts",
    cwd: "/Users/mohamadhosein/Workspace/side/dastyar-ai/apps/server",
  },
];

let passedTests = 0;
let totalTests = tests.length;

for (const test of tests) {
  console.log(`\n🧪 Running: ${test.name}`);
  console.log("─".repeat(50));

  try {
    const result = Bun.spawn({
      cmd: ["bun", "run", test.command.split(" ").slice(2).join(" ")],
      cwd: test.cwd,
      stdout: "pipe",
      stderr: "pipe",
    });

    const text = await new Response(result.stdout).text();
    const errorText = await new Response(result.stderr).text();

    if ((await result.exited) === 0) {
      console.log(text);
      console.log(`✅ ${test.name} - PASSED`);
      passedTests++;
    } else {
      console.log(text);
      console.error(errorText);
      console.log(`❌ ${test.name} - FAILED`);
    }
  } catch (error) {
    console.error(`❌ ${test.name} - ERROR:`, error);
  }
}

console.log("\n" + "=".repeat(50));
console.log(`Test Results: ${passedTests}/${totalTests} tests passed`);
console.log("=".repeat(50));

if (passedTests === totalTests) {
  console.log("🎉 All tests passed successfully!");
  process.exit(0);
} else {
  console.log("💥 Some tests failed!");
  process.exit(1);
}
