#!/usr/bin/env bun

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { appRouter } from "../../../src/procedures";

const API_URL = process.env.API_URL || "http://localhost:3000";
const DOCUMENT_FILE = process.argv[2];

console.log("===========================================");
console.log("Document Processing API Test Script (ORPC Client)");
console.log("===========================================");
console.log("");

// Create ORPC client
const link = new RPCLink({
  url: `${API_URL}/rpc`,
});

const client = createORPCClient<typeof appRouter>(link);

let authToken = "";
let _userId = 0;

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

// Test 4: Upload Document (if file provided)
if (DOCUMENT_FILE) {
  if (!Bun.file(DOCUMENT_FILE).size) {
    console.log(`✗ Document file not found: ${DOCUMENT_FILE}`);
    process.exit(1);
  }

  console.log("4. Testing document upload...");
  console.log(`Document file: ${DOCUMENT_FILE}`);
  console.log("");

  try {
    console.log("Uploading document...");

    const documentBlob = Bun.file(DOCUMENT_FILE);

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("file", documentBlob);
    formData.append("title", "Test Document");
    formData.append("description", "Test document uploaded via API test");

    const uploadResponse = await fetch(`${API_URL}/rpc/documents.upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    const uploadData = await uploadResponse.json();

    console.log("Response:");
    console.log(JSON.stringify(uploadData, null, 2));

    if (uploadResponse.ok && uploadData.data) {
      console.log("✓ Document upload passed");
    } else {
      console.log("✗ Document upload failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("✗ Document upload failed:", error);
    process.exit(1);
  }
} else {
  console.log("4. Skipping document upload tests (no file provided)");
  console.log("");
  console.log(`Usage: bun ${import.meta.file} <document-file>`);
  console.log("Example: bun test-document-api.ts sample.pdf");
  console.log("         bun test-document-api.ts sample.docx");
}

console.log("");

// Test 5: List Documents by Thread (basic test)
console.log("5. Testing document listing by thread...");
try {
  const documentsData = await authClient.documents.listByThread({
    threadId: 1,
  });

  console.log("Response:");
  console.log(JSON.stringify(documentsData, null, 2));

  if (Array.isArray(documentsData)) {
    console.log("✓ Document listing by thread passed");
  } else {
    console.log("✗ Document listing by thread failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Document listing by thread failed:", error);
  process.exit(1);
}

console.log("");
console.log("===========================================");
console.log("All document processing API tests completed successfully!");
console.log("===========================================");
