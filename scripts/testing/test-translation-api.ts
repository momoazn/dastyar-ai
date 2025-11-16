#!/usr/bin/env bun

const API_URL = process.env.API_URL || "http://localhost:3000";

console.log("===========================================");
console.log("Translation API Test Script");
console.log("===========================================");
console.log("");

let translationId = "";

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

// Test 2: Get Supported Languages
console.log("2. Testing supported languages endpoint...");
try {
  const languagesResponse = await fetch(
    `${API_URL}/rpc/translations.languages`
  );
  const languagesData = await languagesResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(languagesData, null, 2));

  if (languagesResponse.ok && languagesData.data) {
    console.log("✓ Supported languages endpoint passed");
  } else {
    console.log("✗ Supported languages endpoint failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Supported languages endpoint failed:", error);
  process.exit(1);
}

console.log("");

// Test 3: Create Translation (English to Persian)
console.log("3. Testing translation creation (EN to FA)...");
try {
  const translateResponse = await fetch(`${API_URL}/rpc/translations.create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: "Hello, how are you today? I hope you are doing well.",
      sourceLanguage: "en",
      targetLanguage: "fa",
    }),
  });
  const translateData = await translateResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(translateData, null, 2));

  if (translateResponse.ok && translateData.data) {
    translationId = translateData.data.id;
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

// Test 4: Get Translation Details
console.log("4. Testing translation retrieval...");
try {
  const getTranslationResponse = await fetch(
    `${API_URL}/rpc/translations.get?id=${translationId}`
  );
  const getTranslationData = await getTranslationResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(getTranslationData, null, 2));

  if (getTranslationResponse.ok && getTranslationData.data) {
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

// Test 5: List Translations
console.log("5. Testing translations list...");
try {
  const listTranslationsResponse = await fetch(
    `${API_URL}/rpc/translations.list`
  );
  const listTranslationsData = await listTranslationsResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(listTranslationsData, null, 2));

  if (listTranslationsResponse.ok && listTranslationsData.data) {
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

// Test 6: Create Translation (Persian to English)
console.log("6. Testing translation creation (FA to EN)...");
try {
  const reverseTranslateResponse = await fetch(
    `${API_URL}/rpc/translations.create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: "سلام، حال شما چطور است؟ امیدوارم خوب باشید.",
        sourceLanguage: "fa",
        targetLanguage: "en",
      }),
    }
  );
  const reverseTranslateData = await reverseTranslateResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(reverseTranslateData, null, 2));

  if (reverseTranslateResponse.ok && reverseTranslateData.data) {
    console.log("✓ Reverse translation creation passed");
  } else {
    console.log("✗ Reverse translation creation failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Reverse translation creation failed:", error);
  process.exit(1);
}

console.log("");

// Test 7: Auto-detect Language Translation
console.log("7. Testing auto-detect language translation...");
try {
  const autoDetectResponse = await fetch(`${API_URL}/rpc/translations.create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: "Bonjour, comment allez-vous?",
      sourceLanguage: "auto",
      targetLanguage: "en",
    }),
  });
  const autoDetectData = await autoDetectResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(autoDetectData, null, 2));

  if (autoDetectResponse.ok && autoDetectData.data) {
    console.log("✓ Auto-detect translation passed");
  } else {
    console.log("✗ Auto-detect translation failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Auto-detect translation failed:", error);
  process.exit(1);
}

console.log("");

// Test 8: Batch Translation
console.log("8. Testing batch translation...");
try {
  const batchResponse = await fetch(`${API_URL}/rpc/translations.batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      texts: [
        "Good morning",
        "How are you?",
        "Thank you very much",
        "See you later",
      ],
      sourceLanguage: "en",
      targetLanguage: "fa",
    }),
  });
  const batchData = await batchResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(batchData, null, 2));

  if (batchResponse.ok && batchData.data) {
    console.log("✓ Batch translation passed");
  } else {
    console.log("✗ Batch translation failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Batch translation failed:", error);
  process.exit(1);
}

console.log("");

// Test 9: Delete Translation
console.log("9. Testing translation deletion...");
try {
  const deleteResponse = await fetch(
    `${API_URL}/rpc/translations.delete?id=${translationId}`,
    {
      method: "DELETE",
    }
  );
  const deleteData = await deleteResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(deleteData, null, 2));

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

console.log("");
console.log("===========================================");
console.log("All translation API tests completed successfully!");
console.log("===========================================");
