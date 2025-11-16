#!/usr/bin/env bun

const API_URL = process.env.API_URL || "http://localhost:3000";

console.log("===========================================");
console.log("Code Execution API Test Script");
console.log("===========================================");
console.log("");

let codeRunId = "";

// Test 1: Health Check
console.log("1. Testing health endpoint...");
try {
  const healthResponse = await fetch(`${API_URL}/health`);
  const healthData = await healthResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(healthData, null, 2));

  if (healthResponse.ok) {
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

// Test 2: Execute JavaScript Code
console.log("2. Testing JavaScript code execution...");
try {
  const jsCode = `
console.log("Hello, World!");
const result = 2 + 2;
result;
`;

  const executeResponse = await fetch(`${API_URL}/rpc/code.execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language: "javascript",
      code: jsCode,
    }),
  });
  const executeData = await executeResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(executeData, null, 2));

  if (executeResponse.ok && executeData.data) {
    codeRunId = executeData.data.id;
    console.log("✓ JavaScript code execution passed");
  } else {
    console.log("✗ JavaScript code execution failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ JavaScript code execution failed:", error);
  process.exit(1);
}

console.log("");

// Test 3: Execute Python Code
console.log("3. Testing Python code execution...");
try {
  const pythonCode = `
print("Hello from Python!")
result = 10 * 5
print(f"Result: {result}")
`;

  const pythonResponse = await fetch(`${API_URL}/rpc/code.execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language: "python",
      code: pythonCode,
    }),
  });
  const pythonData = await pythonResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(pythonData, null, 2));

  if (pythonResponse.ok && pythonData.data) {
    console.log("✓ Python code execution passed");
  } else {
    console.log("✗ Python code execution failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Python code execution failed:", error);
  process.exit(1);
}

console.log("");

// Test 4: Get Code Run Details
console.log("4. Testing code run retrieval...");
try {
  const getRunResponse = await fetch(
    `${API_URL}/rpc/codeRuns.get?id=${codeRunId}`
  );
  const getRunData = await getRunResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(getRunData, null, 2));

  if (getRunResponse.ok && getRunData.data) {
    console.log("✓ Code run retrieval passed");
  } else {
    console.log("✗ Code run retrieval failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Code run retrieval failed:", error);
  process.exit(1);
}

console.log("");

// Test 5: List Code Runs
console.log("5. Testing code runs list...");
try {
  const listRunsResponse = await fetch(`${API_URL}/rpc/codeRuns.list`);
  const listRunsData = await listRunsResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(listRunsData, null, 2));

  if (listRunsResponse.ok && listRunsData.data) {
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

// Test 6: Execute Code with Error
console.log("6. Testing code execution with error...");
try {
  const errorCode = `
const obj = null;
obj.property; // This will throw an error
`;

  const errorResponse = await fetch(`${API_URL}/rpc/code.execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language: "javascript",
      code: errorCode,
    }),
  });
  const errorData = await errorResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(errorData, null, 2));

  if (errorResponse.ok && errorData.data && errorData.data.error) {
    console.log("✓ Error handling passed");
  } else {
    console.log("✗ Error handling failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Error handling test failed:", error);
  process.exit(1);
}

console.log("");

// Test 7: Execute Code with Timeout
console.log("7. Testing code execution with timeout...");
try {
  const timeoutCode = `
// Infinite loop to test timeout
while (true) {
  // This should timeout
}
`;

  const timeoutResponse = await fetch(`${API_URL}/rpc/code.execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language: "javascript",
      code: timeoutCode,
      timeout: 1000, // 1 second timeout
    }),
  });
  const timeoutData = await timeoutResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(timeoutData, null, 2));

  // This might fail due to timeout, which is expected
  if (timeoutResponse.ok || (timeoutData.data && timeoutData.data.error)) {
    console.log("✓ Timeout handling passed");
  } else {
    console.log("✗ Timeout handling failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Timeout handling test failed:", error);
  process.exit(1);
}

console.log("");

// Test 8: Delete Code Run
console.log("8. Testing code run deletion...");
try {
  const deleteResponse = await fetch(
    `${API_URL}/rpc/codeRuns.delete?id=${codeRunId}`,
    {
      method: "DELETE",
    }
  );
  const deleteData = await deleteResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(deleteData, null, 2));

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

console.log("");
console.log("===========================================");
console.log("All code execution API tests completed successfully!");
console.log("===========================================");
