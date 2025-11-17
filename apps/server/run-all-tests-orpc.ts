#!/usr/bin/env bun

export {};

console.log("===========================================");
console.log("Running All API Tests (ORPC Client)");
console.log("===========================================");
console.log("");

const tests = [
  {
    name: "Whisper API Test",
    command: "test-whisper-api.ts",
  },
  {
    name: "Authentication API Test (ORPC)",
    command: "test-auth-api.ts",
  },
  {
    name: "Chat API Test (ORPC)",
    command: "test-chat-api.ts",
  },
  {
    name: "Image Generation API Test (ORPC)",
    command: "test-image-api.ts",
  },
  {
    name: "Document Processing API Test (ORPC)",
    command: "test-document-api.ts",
  },
  {
    name: "Code Execution API Test (ORPC)",
    command: "test-code-api.ts",
  },
  {
    name: "Translation API Test (ORPC)",
    command: "test-translation-api.ts",
  },
  {
    name: "Summary API Test (ORPC)",
    command: "test-summary-api.ts",
  },
];

let passedTests = 0;
const totalTests = tests.length;

for (const test of tests) {
  console.log(`\n🧪 Running: ${test.name}`);
  console.log("─".repeat(50));

  try {
    // Read the test script file and execute it in the current context
    const scriptPath = `../../scripts/testing/${test.command}`;
    const scriptContent = await Bun.file(scriptPath).text();

    // Create a temporary file in the current directory
    const tempFileName = `temp-${Date.now()}-${test.command}`;
    await Bun.write(tempFileName, scriptContent);

    const result = Bun.spawn({
      cmd: ["bun", "run", tempFileName],
      cwd: ".",
      stdout: "pipe",
      stderr: "pipe",
    });

    const text = await new Response(result.stdout).text();
    const errorText = await new Response(result.stderr).text();

    // Clean up temporary file
    await Bun.file(tempFileName).delete();

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

console.log(`\n${"=".repeat(50)}`);
console.log(`Test Results: ${passedTests}/${totalTests} tests passed`);
console.log("=".repeat(50));

if (passedTests === totalTests) {
  console.log("🎉 All tests passed successfully!");
  process.exit(0);
} else {
  console.log("💥 Some tests failed!");
  process.exit(1);
}
