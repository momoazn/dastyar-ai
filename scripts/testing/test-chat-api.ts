#!/usr/bin/env bun

const API_URL = process.env.API_URL || "http://localhost:3000";

console.log("===========================================");
console.log("Chat API Test Script");
console.log("===========================================");
console.log("");

let authToken = "";

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

// Test 2: Get Available Models
console.log("2. Testing LLM models endpoint...");
try {
  const modelsResponse = await fetch(`${API_URL}/rpc/models.list`);
  const modelsData = await modelsResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(modelsData, null, 2));

  if (modelsResponse.ok && modelsData) {
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

// Test 3: Create Thread
console.log("3. Testing thread creation...");
let threadId = "";
try {
  const threadResponse = await fetch(`${API_URL}/rpc/threads.create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "Test Thread",
    }),
  });
  const threadData = await threadResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(threadData, null, 2));

  if (threadResponse.ok && threadData) {
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

// Test 4: Send Message
console.log("4. Testing message sending...");
try {
  const messageResponse = await fetch(`${API_URL}/rpc/messages.create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      threadId,
      content: "Hello, this is a test message!",
      role: "user",
    }),
  });
  const messageData = await messageResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(messageData, null, 2));

  if (messageResponse.ok && messageData) {
    console.log("✓ Message sending passed");
  } else {
    console.log("✗ Message sending failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Message sending failed:", error);
  process.exit(1);
}

console.log("");

// Test 5: Get Thread Messages
console.log("5. Testing thread messages retrieval...");
try {
  const messagesResponse = await fetch(
    `${API_URL}/rpc/messages.list?threadId=${threadId}`
  );
  const messagesData = await messagesResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(messagesData, null, 2));

  if (messagesResponse.ok && messagesData) {
    console.log("✓ Thread messages retrieval passed");
  } else {
    console.log("✗ Thread messages retrieval failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Thread messages retrieval failed:", error);
  process.exit(1);
}
} catch (error)
{
  console.error("✗ Thread messages retrieval failed:", error);
  process.exit(1);
}

console.log("");

// Test 6: Get User Threads
console.log("6. Testing user threads retrieval...");
try {
  const threadsResponse = await fetch(`${API_URL}/rpc/threads.list`);
  const threadsData = await threadsResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(threadsData, null, 2));

  if (threadsResponse.ok && threadsData) {
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
console.log("===========================================");
console.log("All chat API tests completed successfully!");
console.log("===========================================");
