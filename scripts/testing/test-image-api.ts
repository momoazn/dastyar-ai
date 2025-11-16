#!/usr/bin/env bun

const API_URL = process.env.API_URL || "http://localhost:3000";

console.log("===========================================");
console.log("Image Generation API Test Script");
console.log("===========================================");
console.log("");

let imageThreadId = "";

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

// Test 2: Get Available Image Models
console.log("2. Testing image models endpoint...");
try {
  const modelsResponse = await fetch(
    `${API_URL}/rpc/llmModels.list?type=image`
  );
  const modelsData = await modelsResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(modelsData, null, 2));

  if (modelsResponse.ok && modelsData.data) {
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

// Test 3: Create Image Thread
console.log("3. Testing image thread creation...");
try {
  const threadResponse = await fetch(`${API_URL}/rpc/imageThreads.create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "A beautiful sunset over mountains",
      model: "dall-e-3",
      width: 1024,
      height: 1024,
    }),
  });
  const threadData = await threadResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(threadData, null, 2));

  if (threadResponse.ok && threadData.data) {
    imageThreadId = threadData.data.id;
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

// Test 4: Get Image Thread
console.log("4. Testing image thread retrieval...");
try {
  const getThreadResponse = await fetch(
    `${API_URL}/rpc/imageThreads.get?id=${imageThreadId}`
  );
  const getThreadData = await getThreadResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(getThreadData, null, 2));

  if (getThreadResponse.ok && getThreadData.data) {
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

// Test 5: List Image Threads
console.log("5. Testing image threads list...");
try {
  const listThreadsResponse = await fetch(`${API_URL}/rpc/imageThreads.list`);
  const listThreadsData = await listThreadsResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(listThreadsData, null, 2));

  if (listThreadsResponse.ok && listThreadsData.data) {
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

// Test 6: Generate Image (if supported)
console.log("6. Testing image generation...");
try {
  const generateResponse = await fetch(`${API_URL}/rpc/images.generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      threadId: imageThreadId,
      prompt: "A futuristic city with flying cars",
      model: "dall-e-3",
      width: 1024,
      height: 1024,
    }),
  });
  const generateData = await generateResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(generateData, null, 2));

  if (generateResponse.ok && generateData.data) {
    console.log("✓ Image generation passed");
  } else {
    console.log("✗ Image generation failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Image generation failed:", error);
  process.exit(1);
}

console.log("");

// Test 7: Get Images from Thread
console.log("7. Testing thread images retrieval...");
try {
  const imagesResponse = await fetch(
    `${API_URL}/rpc/images.list?threadId=${imageThreadId}`
  );
  const imagesData = await imagesResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(imagesData, null, 2));

  if (imagesResponse.ok && imagesData.data) {
    console.log("✓ Thread images retrieval passed");
  } else {
    console.log("✗ Thread images retrieval failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Thread images retrieval failed:", error);
  process.exit(1);
}

console.log("");
console.log("===========================================");
console.log("All image generation API tests completed successfully!");
console.log("===========================================");
