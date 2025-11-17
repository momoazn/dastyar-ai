#!/usr/bin/env bun

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { LLMModel } from "../../../src/database";
import type { appRouter } from "../../../src/procedures";

const API_URL = process.env.API_URL || "http://localhost:3000";

console.log("===========================================");
console.log("Summary API Test Script (ORPC Client)");
console.log("===========================================");
console.log("");

// Create ORPC client
const link = new RPCLink({
  url: `${API_URL}/rpc`,
});

const client = createORPCClient<typeof appRouter>(link);

let authToken = "";
let _userId = 0;
let summaryId = 0;

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

// Test 4: List Summaries
console.log("4. Testing summaries list...");
try {
  const summariesData = await authClient.summarize.list();

  console.log("Response:");
  console.log(JSON.stringify(summariesData, null, 2));

  if (Array.isArray(summariesData)) {
    console.log("✓ Summaries list passed");
  } else {
    console.log("✗ Summaries list failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Summaries list failed:", error);
  process.exit(1);
}

console.log("");

// Test 5: Get Available Models (for summary)
console.log("5. Testing models endpoint for summary...");
let modelsData: LLMModel[] = [];
try {
  modelsData = await client.models.list();

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

// Test 6: Create Summary (if models available)
if (modelsData && modelsData.length > 0) {
  console.log("6. Testing summary creation...");
  const longText = `
Artificial intelligence (AI) is a broad field of computer science focused on creating systems 
that can perform tasks that typically require human intelligence. These tasks include learning, 
reasoning, problem-solving, perception, and language understanding. Machine learning, a subset 
of AI, enables systems to learn and improve from experience without being explicitly programmed. 
Deep learning, a further subset of machine learning, uses neural networks with multiple layers to 
analyze various forms of data. Natural language processing allows computers to understand and 
generate human language, while computer vision enables machines to interpret and make decisions 
based on visual data. AI applications range from virtual assistants and recommendation systems 
to autonomous vehicles and medical diagnosis. As AI technology continues to advance, it raises 
important questions about ethics, privacy, and the future of work, while also offering tremendous 
potential to solve complex global challenges.
`;

  try {
    const summaryResponse = await authClient.summarize.create({
      content: longText,
      type: "text",
      summaryLength: "medium",
    });

    console.log("Response:");
    console.log(JSON.stringify(summaryResponse, null, 2));

    if (summaryResponse?.id) {
      summaryId = summaryResponse.id;
      console.log("✓ Summary creation passed");
    } else {
      console.log("✗ Summary creation failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("✗ Summary creation failed:", error);
    process.exit(1);
  }

  console.log("");

  // Test 7: Get Summary Details
  console.log("7. Testing summary retrieval...");
  try {
    const getSummaryResponse = await authClient.summarize.get({
      id: summaryId,
    });

    console.log("Response:");
    console.log(JSON.stringify(getSummaryResponse, null, 2));

    if (getSummaryResponse?.id) {
      console.log("✓ Summary retrieval passed");
    } else {
      console.log("✗ Summary retrieval failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("✗ Summary retrieval failed:", error);
    process.exit(1);
  }

  console.log("");

  // Test 8: Update Summary
  console.log("8. Testing summary update...");
  try {
    const updateResponse = await authClient.summarize.update({
      id: summaryId,
      title: "Updated AI Summary",
      notes: "This is an updated note for summary",
    });

    console.log("Response:");
    console.log(JSON.stringify(updateResponse, null, 2));

    if (updateResponse?.id) {
      console.log("✓ Summary update passed");
    } else {
      console.log("✗ Summary update failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("✗ Summary update failed:", error);
    process.exit(1);
  }

  console.log("");

  // Test 9: Delete Summary
  console.log("9. Testing summary deletion...");
  try {
    const deleteResponse = await authClient.summarize.delete({ id: summaryId });

    console.log("Response:");
    console.log(JSON.stringify(deleteResponse, null, 2));

    if (deleteResponse.ok) {
      console.log("✓ Summary deletion passed");
    } else {
      console.log("✗ Summary deletion failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("✗ Summary deletion failed:", error);
    process.exit(1);
  }
} else {
  console.log("6. Skipping summary tests (no models available)");
  console.log("✓ Summary tests skipped");
}

console.log("");
console.log("===========================================");
console.log("All summary API tests completed successfully!");
console.log("===========================================");
