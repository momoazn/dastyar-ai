#!/usr/bin/env bun

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { LLMModel } from "../../../src/database";
import type { appRouter } from "../../../src/procedures";

const API_URL = process.env.API_URL || "http://localhost:3000";

console.log("===========================================");
console.log("Translation API Test Script (ORPC Client)");
console.log("===========================================");
console.log("");

// Create ORPC client
const link = new RPCLink({
  url: `${API_URL}/rpc`,
});

const client = createORPCClient<typeof appRouter>(link);

let authToken = "";
let _userId = 0;
let translationId = 0;

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

// Test 4: List Translations
console.log("4. Testing translations list...");
try {
  const translationsData = await authClient.translations.list();

  console.log("Response:");
  console.log(JSON.stringify(translationsData, null, 2));

  if (Array.isArray(translationsData)) {
    console.log("✓ Translations list passed");
  } else {
    console.log("✗ Translations list failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Translations list failed:", error);
  process.exit(1);
}

console.log("");

// Test 5: Get Available Models (for translation)
console.log("5. Testing models endpoint for translation...");
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

// Test 6: Create Translation (if models available)
if (modelsData && modelsData.length > 0) {
  console.log("6. Testing translation creation...");
  try {
    const translateResponse = await authClient.translations.translate({
      text: "Hello, how are you today? I hope you are doing well.",
      sourceLanguage: "en",
      targetLanguage: "fa",
      tone: "formal",
      modelId: modelsData[0].id,
    });

    console.log("Response:");
    console.log(JSON.stringify(translateResponse, null, 2));

    if (translateResponse?.id) {
      translationId = translateResponse.id;
      console.log("✓ Translation creation passed");
    } else {
      console.log("✗ Translation creation failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("✗ Translation creation failed:", error);
    process.exit(1);
  }

  console.log("");

  // Test 7: Get Translation Details
  console.log("7. Testing translation retrieval...");
  try {
    const getTranslationResponse = await authClient.translations.get({
      id: translationId,
    });

    console.log("Response:");
    console.log(JSON.stringify(getTranslationResponse, null, 2));

    if (getTranslationResponse?.id) {
      console.log("✓ Translation retrieval passed");
    } else {
      console.log("✗ Translation retrieval failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("✗ Translation retrieval failed:", error);
    process.exit(1);
  }

  console.log("");

  // Test 8: Delete Translation
  console.log("8. Testing translation deletion...");
  try {
    const deleteResponse = await authClient.translations.delete({
      id: translationId,
    });

    console.log("Response:");
    console.log(JSON.stringify(deleteResponse, null, 2));

    if (deleteResponse.ok) {
      console.log("✓ Translation deletion passed");
    } else {
      console.log("✗ Translation deletion failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("✗ Translation deletion failed:", error);
    process.exit(1);
  }
} else {
  console.log("6. Skipping translation tests (no models available)");
  console.log("✓ Translation tests skipped");
}

console.log("");
console.log("===========================================");
console.log("All translation API tests completed successfully!");
console.log("===========================================");
