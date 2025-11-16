#!/usr/bin/env bun

const API_URL = process.env.API_URL || "http://localhost:3000";

console.log("===========================================");
console.log("Summary API Test Script");
console.log("===========================================");
console.log("");

let summaryId = "";

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

// Test 2: Create Summary from Text
console.log("2. Testing text summary creation...");
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
  const summaryResponse = await fetch(`${API_URL}/rpc/summaries.create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: longText,
      type: "text",
      summaryLength: "medium",
    }),
  });
  const summaryData = await summaryResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(summaryData, null, 2));

  if (summaryResponse.ok && summaryData.data) {
    summaryId = summaryData.data.id;
    console.log("✓ Text summary creation passed");
  } else {
    console.log("✗ Text summary creation failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Text summary creation failed:", error);
  process.exit(1);
}

console.log("");

// Test 3: Get Summary Details
console.log("3. Testing summary retrieval...");
try {
  const getSummaryResponse = await fetch(
    `${API_URL}/rpc/summaries.get?id=${summaryId}`
  );
  const getSummaryData = await getSummaryResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(getSummaryData, null, 2));

  if (getSummaryResponse.ok && getSummaryData.data) {
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

// Test 4: List Summaries
console.log("4. Testing summaries list...");
try {
  const listSummariesResponse = await fetch(`${API_URL}/rpc/summaries.list`);
  const listSummariesData = await listSummariesResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(listSummariesData, null, 2));

  if (listSummariesResponse.ok && listSummariesData.data) {
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

// Test 5: Create Summary with Different Length
console.log("5. Testing short summary creation...");
try {
  const shortSummaryResponse = await fetch(`${API_URL}/rpc/summaries.create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: longText,
      type: "text",
      summaryLength: "short",
    }),
  });
  const shortSummaryData = await shortSummaryResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(shortSummaryData, null, 2));

  if (shortSummaryResponse.ok && shortSummaryData.data) {
    console.log("✓ Short summary creation passed");
  } else {
    console.log("✗ Short summary creation failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Short summary creation failed:", error);
  process.exit(1);
}

console.log("");

// Test 6: Create Summary from URL
console.log("6. Testing URL summary creation...");
try {
  const urlSummaryResponse = await fetch(`${API_URL}/rpc/summaries.create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: "https://www.example.com/article", // Example URL
      type: "url",
      summaryLength: "medium",
    }),
  });
  const urlSummaryData = await urlSummaryResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(urlSummaryData, null, 2));

  // URL summarization might fail due to invalid URL, which is expected
  if (urlSummaryResponse.ok && urlSummaryData.data) {
    console.log("✓ URL summary creation passed");
  } else if (urlSummaryData.error && urlSummaryData.error.includes("URL")) {
    console.log("✓ URL error handling passed (expected for invalid URL)");
  } else {
    console.log("✗ URL summary creation failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ URL summary creation failed:", error);
  process.exit(1);
}

console.log("");

// Test 7: Update Summary
console.log("7. Testing summary update...");
try {
  const updateResponse = await fetch(`${API_URL}/rpc/summaries.update`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: summaryId,
      title: "Updated AI Summary",
      notes: "This is an updated note for the summary",
    }),
  });
  const updateData = await updateResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(updateData, null, 2));

  if (updateResponse.ok && updateData.data) {
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

// Test 8: Search Summaries
console.log("8. Testing summary search...");
try {
  const searchResponse = await fetch(
    `${API_URL}/rpc/summaries.search?query=artificial intelligence`
  );
  const searchData = await searchResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(searchData, null, 2));

  if (searchResponse.ok && searchData.data) {
    console.log("✓ Summary search passed");
  } else {
    console.log("✗ Summary search failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Summary search failed:", error);
  process.exit(1);
}

console.log("");

// Test 9: Delete Summary
console.log("9. Testing summary deletion...");
try {
  const deleteResponse = await fetch(
    `${API_URL}/rpc/summaries.delete?id=${summaryId}`,
    {
      method: "DELETE",
    }
  );
  const deleteData = await deleteResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(deleteData, null, 2));

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

console.log("");
console.log("===========================================");
console.log("All summary API tests completed successfully!");
console.log("===========================================");
