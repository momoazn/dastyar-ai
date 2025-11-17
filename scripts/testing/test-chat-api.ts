#!/usr/bin/env bun

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { appRouter } from "../../../src/procedures";

const API_URL = process.env.API_URL || "http://localhost:3000";

console.log("===========================================");
console.log("Chat API Test Script (ORPC Client)");
console.log("===========================================");
console.log("");

// Create ORPC client
const link = new RPCLink({
  url: `${API_URL}/rpc`,
});

const client = createORPCClient<typeof appRouter>(link);

let authToken = "";
let userId = 0;
let threadId = 0;

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

// Test 2: Get Available Models
console.log("2. Testing LLM models endpoint...");
try {
  const modelsData = await client.models.list();

  console.log("Response:");
  console.log(JSON.stringify(modelsData, null, 2));

  if (Array.isArray(modelsData)) {
    console.log("✓ Models endpoint passed");
  } else {
    console.log("✗ Models endpoint failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Models endpoint failed:", error);
  process.exit(1);
}

console.log("");

// Test 3: User Registration
console.log("3. Testing user registration...");
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
    userId = registerData.user.id;
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

// Test 4: Create authenticated client
const authLink = new RPCLink({
  url: `${API_URL}/rpc`,
  headers: () => ({
    Authorization: `Bearer ${authToken}`,
  }),
});

const authClient = createORPCClient<typeof appRouter>(authLink);

// Test 5: Get Current User
console.log("5. Testing current user retrieval...");
try {
  const userData = await authClient.auth.me();

  console.log("Response:");
  console.log(JSON.stringify(userData, null, 2));

  if (userData.id === userId) {
    console.log("✓ Current user retrieval passed");
  } else {
    console.log("✗ Current user retrieval failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Current user retrieval failed:", error);
  process.exit(1);
}

console.log("");

// Test 6: Create Thread
console.log("6. Testing thread creation...");
try {
  const threadData = await authClient.threads.create({ title: "Test Thread" });

  console.log("Response:");
  console.log(JSON.stringify(threadData, null, 2));

  if (threadData?.id) {
    threadId = threadData.id;
    console.log("✓ Thread creation passed");
  } else {
    console.log("✗ Thread creation failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Thread creation failed:", error);
  process.exit(1);
}

console.log("");

// Test 7: Get Thread Messages
console.log("7. Testing thread messages retrieval...");
try {
  const messagesData = await authClient.messages.listByThread({ threadId });

  console.log("Response:");
  console.log(JSON.stringify(messagesData, null, 2));

  if (Array.isArray(messagesData)) {
    console.log("✓ Thread messages retrieval passed");
  } else {
    console.log("✗ Thread messages retrieval failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Thread messages retrieval failed:", error);
  process.exit(1);
}

console.log("");

// Test 8: Get User Threads
console.log("8. Testing user threads retrieval...");
try {
  const threadsData = await authClient.threads.list();

  console.log("Response:");
  console.log(JSON.stringify(threadsData, null, 2));

  if (Array.isArray(threadsData)) {
    console.log("✓ User threads retrieval passed");
  } else {
    console.log("✗ User threads retrieval failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ User threads retrieval failed:", error);
  process.exit(1);
}

console.log("");

// Test 9: Get Last Used Model
console.log("9. Testing last used model retrieval...");
try {
  const lastModelData = await authClient.messages.getLastUsedModelGlobal();

  console.log("Response:");
  console.log(JSON.stringify(lastModelData, null, 2));

  // This might be null if no messages sent yet
  console.log("✓ Last used model retrieval passed");
} catch (error) {
  console.error("✗ Last used model retrieval failed:", error);
  process.exit(1);
}

console.log("");

// Test 10: Rename Thread
console.log("10. Testing thread rename...");
try {
  const renameData = await authClient.threads.rename({
    id: threadId,
    title: "Updated Test Thread",
  });

  console.log("Response:");
  console.log(JSON.stringify(renameData, null, 2));

  if (renameData.ok) {
    console.log("✓ Thread rename passed");
  } else {
    console.log("✗ Thread rename failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Thread rename failed:", error);
  process.exit(1);
}

console.log("");

// Test 11: Archive Thread
console.log("11. Testing thread archive...");
try {
  const archiveData = await authClient.threads.archive({ id: threadId });

  console.log("Response:");
  console.log(JSON.stringify(archiveData, null, 2));

  if (archiveData.ok) {
    console.log("✓ Thread archive passed");
  } else {
    console.log("✗ Thread archive failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Thread archive failed:", error);
  process.exit(1);
}

console.log("");
console.log("===========================================");
console.log("All chat API tests completed successfully!");
console.log("===========================================");
