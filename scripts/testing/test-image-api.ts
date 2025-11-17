#!/usr/bin/env bun

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { appRouter } from "../../../src/procedures";

const API_URL = process.env.API_URL || "http://localhost:3000";

console.log("===========================================");
console.log("Image Generation API Test Script (ORPC Client)");
console.log("===========================================");
console.log("");

// Create ORPC client
const link = new RPCLink({
  url: `${API_URL}/rpc`,
});

const client = createORPCClient<typeof appRouter>(link);

let authToken = "";
let _userId = 0;
let imageThreadId = 0;

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

// Test 2: Get Available Image Models
console.log("2. Testing image models endpoint...");
try {
  const modelsData = await client.models.list({ type: "image" });

  console.log("Response:");
  console.log(JSON.stringify(modelsData, null, 2));

  if (Array.isArray(modelsData)) {
    console.log("✓ Image models endpoint passed");
  } else {
    console.log("✗ Image models endpoint failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Image models endpoint failed:", error);
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

// Test 4: Create authenticated client
const authLink = new RPCLink({
  url: `${API_URL}/rpc`,
  headers: () => ({
    Authorization: `Bearer ${authToken}`,
  }),
});

const authClient = createORPCClient<typeof appRouter>(authLink);

// Test 5: Create Image Thread
console.log("5. Testing image thread creation...");
try {
  const threadResponse = await authClient.imageThreads.create({
    prompt: "A beautiful sunset over mountains",
    model: "dall-e-3",
    width: 1024,
    height: 1024,
  });

  console.log("Response:");
  console.log(JSON.stringify(threadResponse, null, 2));

  if (threadResponse?.id) {
    imageThreadId = threadResponse.id;
    console.log("✓ Image thread creation passed");
  } else {
    console.log("✗ Image thread creation failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Image thread creation failed:", error);
  process.exit(1);
}

console.log("");

// Test 6: Get Image Thread
console.log("6. Testing image thread retrieval...");
try {
  const getThreadResponse = await authClient.imageThreads.get({
    id: imageThreadId,
  });

  console.log("Response:");
  console.log(JSON.stringify(getThreadResponse, null, 2));

  if (getThreadResponse?.id) {
    console.log("✓ Image thread retrieval passed");
  } else {
    console.log("✗ Image thread retrieval failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Image thread retrieval failed:", error);
  process.exit(1);
}

console.log("");

// Test 7: List Image Threads
console.log("7. Testing image threads list...");
try {
  const listThreadsResponse = await authClient.imageThreads.list();

  console.log("Response:");
  console.log(JSON.stringify(listThreadsResponse, null, 2));

  if (Array.isArray(listThreadsResponse)) {
    console.log("✓ Image threads list passed");
  } else {
    console.log("✗ Image threads list failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Image threads list failed:", error);
  process.exit(1);
}

console.log("");
console.log("===========================================");
console.log("All image generation API tests completed successfully!");
console.log("===========================================");
