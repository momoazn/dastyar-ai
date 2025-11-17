#!/usr/bin/env bun

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { appRouter } from "../../../src/procedures";

const API_URL = process.env.API_URL || "http://localhost:3000";

console.log("===========================================");
console.log("Authentication API Test Script (ORPC Client)");
console.log("===========================================");
console.log("");

// Create ORPC client
const link = new RPCLink({
  url: `${API_URL}/rpc`,
});

const client = createORPCClient<typeof appRouter>(link);

let authToken = "";
let userId = 0;

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

// Test 3: Create authenticated client
const authLink = new RPCLink({
  url: `${API_URL}/rpc`,
  headers: () => ({
    Authorization: `Bearer ${authToken}`,
  }),
});

const authClient = createORPCClient<typeof appRouter>(authLink);

// Test 4: Get Current User
console.log("4. Testing current user retrieval...");
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

// Test 5: Update Username
console.log("5. Testing username update...");
try {
  const updateData = await authClient.auth.updateUsername({
    newUsername: `updated${testUser.username}`,
  });

  console.log("Response:");
  console.log(JSON.stringify(updateData, null, 2));

  if (updateData.token && updateData.user) {
    console.log("✓ Username update passed");
  } else {
    console.log("✗ Username update failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Username update failed:", error);
  process.exit(1);
}

console.log("");

// Test 6: Update Password
console.log("6. Testing password update...");
try {
  const passwordData = await authClient.auth.updatePassword({
    currentPassword: testUser.password,
    newPassword: "newPassword123",
  });

  console.log("Response:");
  console.log(JSON.stringify(passwordData, null, 2));

  if (passwordData.success) {
    console.log("✓ Password update passed");
  } else {
    console.log("✗ Password update failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Password update failed:", error);
  process.exit(1);
}

console.log("");

// Test7: Login with new password
console.log("7. Testing login with new password...");
try {
  const loginData = await client.auth.login({
    username: `updated${testUser.username}`,
    password: "newPassword123",
  });

  console.log("Response:");
  console.log(JSON.stringify(loginData, null, 2));

  if (loginData.token && loginData.user) {
    console.log("✓ Login with new password passed");
  } else {
    console.log("✗ Login with new password failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Login with new password failed:", error);
  process.exit(1);
}

console.log("");
console.log("===========================================");
console.log("All authentication API tests completed successfully!");
console.log("===========================================");
