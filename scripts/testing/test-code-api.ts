#!/usr/bin/env bun

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { appRouter } from "../../../src/procedures";

const API_URL = process.env.API_URL || "http://localhost:3000";

console.log("===========================================");
console.log("Code Execution API Test Script (ORPC Client)");
console.log("===========================================");
console.log("");

// Create ORPC client
const link = new RPCLink({
  url: `${API_URL}/rpc`,
});

const client = createORPCClient<typeof appRouter>(link);

let authToken = "";
let _userId = 0;
let codeRunId = 0;

// Test 1: Health Check
console.log("1. Testing health endpoint...");
try {
  const healthData = await client.healthCheck();

  console.log("Response:");
  console.log(JSON.stringify(healthData, null, 2));

  if (healthData === "OK") {
    console.log("✓ Health endpoint passed");
  } else {
    console.log("✗ Health endpoint failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Health endpoint failed:", error);
  process.exit(1);
}

console.log("");

// Test 2: User Registration
console.log("2. Testing user registration...");
const testUser = {
  username: `test${Date.now()}`,
  password: "testPassword123",
};

try {
  const registerData = await client.auth.register(testUser);

  console.log("Response:");
  console.log(JSON.stringify(registerData, null, 2));

  if (registerData.token && registerData.user) {
    authToken = registerData.token;
    _userId = registerData.user.id;
    console.log("✓ User registration passed");
  } else {
    console.log("✗ User registration failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ User registration failed:", error);
  process.exit(1);
}

console.log("");

// Test 3: Create authenticated client
const authLink = new RPCLink({
  url: `${API_URL}/rpc`,
  headers: () => ({
    Authorization: `Bearer ${authToken}`,
  }),
});

const authClient = createORPCClient<typeof appRouter>(authLink);

// Test 4: Execute JavaScript Code
console.log("4. Testing JavaScript code execution...");
const jsCode = `
console.log("Hello, World!");
const result = 2 + 2;
result;
`;

try {
  // First get available models
  const modelsData = await client.models.list();

  if (modelsData && modelsData.length > 0) {
    const executeResponse = await authClient.code.run({
      mode: "generate",
      language: "javascript",
      code: jsCode,
      modelId: modelsData[0].id,
      prompt: "Execute this code and return the result",
    });

    console.log("Response:");
    console.log(JSON.stringify(executeResponse, null, 2));

    if (executeResponse?.id) {
      codeRunId = executeResponse.id;
      console.log("✓ JavaScript code execution passed");
    } else {
      console.log("✗ JavaScript code execution failed");
      process.exit(1);
    }
  } else {
    console.log("✗ JavaScript code execution skipped (no models available)");
  }
} catch (error) {
  console.error("✗ JavaScript code execution failed:", error);
  process.exit(1);
}

console.log("");

// Test 5: Execute Python Code
console.log("5. Testing Python code execution...");
const pythonCode = `
print("Hello from Python!")
result = 10 * 5
print(f"Result: {result}")
`;

try {
  // First get available models
  const modelsData = await client.models.list();

  if (modelsData && modelsData.length > 0) {
    const pythonResponse = await authClient.code.run({
      mode: "generate",
      language: "python",
      code: pythonCode,
      modelId: modelsData[0].id,
    });

    console.log("Response:");
    console.log(JSON.stringify(pythonResponse, null, 2));

    if (pythonResponse?.id) {
      console.log("✓ Python code execution passed");
    } else {
      console.log("✗ Python code execution failed");
      process.exit(1);
    }
  } else {
    console.log("✗ Python code execution skipped (no models available)");
  }
} catch (error) {
  console.error("✗ Python code execution failed:", error);
  process.exit(1);
}

console.log("");

// Test 6: Get Code Run Details
console.log("6. Testing code run retrieval...");
if (codeRunId > 0) {
  try {
    const getRunResponse = await authClient.code.getRun({ id: codeRunId });

    console.log("Response:");
    console.log(JSON.stringify(getRunResponse, null, 2));

    if (getRunResponse?.id) {
      console.log("✓ Code run retrieval passed");
    } else {
      console.log("✗ Code run retrieval failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("✗ Code run retrieval failed:", error);
    process.exit(1);
  }
} else {
  console.log("✗ Code run retrieval skipped (no code was executed)");
}

console.log("");

// Test 7: List Code Runs
console.log("7. Testing code runs list...");
try {
  const listRunsResponse = await authClient.code.listRuns();

  console.log("Response:");
  console.log(JSON.stringify(listRunsResponse, null, 2));

  if (Array.isArray(listRunsResponse)) {
    console.log("✓ Code runs list passed");
  } else {
    console.log("✗ Code runs list failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Code runs list failed:", error);
  process.exit(1);
}

console.log("");

// Test 8: Execute Code with Error
console.log("8. Testing code execution with error...");
const errorCode = `
const obj = null;
obj.property; // This will throw an error
`;

try {
  // First get available models
  const modelsData = await client.models.list();

  if (modelsData && modelsData.length > 0) {
    const errorResponse = await authClient.code.run({
      mode: "debug",
      language: "javascript",
      code: errorCode,
      modelId: modelsData[0].id,
    });

    console.log("Response:");
    console.log(JSON.stringify(errorResponse, null, 2));

    if (errorResponse && (errorResponse.rootCause || errorResponse.solution)) {
      console.log("✓ Error handling passed");
    } else {
      console.log("✗ Error handling failed");
      process.exit(1);
    }
  } else {
    console.log("✗ Error handling test skipped (no models available)");
  }
} catch (error) {
  console.error("✗ Error handling test failed:", error);
  process.exit(1);
}

console.log("");

// Test 9: Delete Code Run
console.log("9. Testing code run deletion...");
if (codeRunId > 0) {
  try {
    const deleteResponse = await authClient.code.deleteRun({ id: codeRunId });

    console.log("Response:");
    console.log(JSON.stringify(deleteResponse, null, 2));

    if (deleteResponse.ok) {
      console.log("✓ Code run deletion passed");
    } else {
      console.log("✗ Code run deletion failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("✗ Code run deletion failed:", error);
    process.exit(1);
  }
} else {
  console.log("✗ Code run deletion skipped (no code was executed)");
}

console.log("");
console.log("===========================================");
console.log("All code execution API tests completed successfully!");
console.log("===========================================");
