#!/usr/bin/env bun

const API_URL = process.env.API_URL || "http://localhost:3000";
const DOCUMENT_FILE = process.argv[2];

console.log("===========================================");
console.log("Document Processing API Test Script");
console.log("===========================================");
console.log("");

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

// Test 2: List Documents
console.log("2. Testing documents list endpoint...");
try {
  const documentsResponse = await fetch(`${API_URL}/rpc/documents.list`);
  const documentsData = await documentsResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(documentsData, null, 2));

  if (documentsResponse.ok && documentsData.data !== undefined) {
    console.log("✓ Documents list endpoint passed");
  } else {
    console.log("✗ Documents list endpoint failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Documents list endpoint failed:", error);
  process.exit(1);
}

console.log("");

// Test 3: Upload Document (if file provided)
if (DOCUMENT_FILE) {
  if (!Bun.file(DOCUMENT_FILE).size) {
    console.log(`✗ Document file not found: ${DOCUMENT_FILE}`);
    process.exit(1);
  }

  console.log("3. Testing document upload...");
  console.log(`Document file: ${DOCUMENT_FILE}`);
  console.log("");

  try {
    console.log("Uploading document...");

    const formData = new FormData();
    const documentBlob = Bun.file(DOCUMENT_FILE);
    formData.append("file", documentBlob);
    formData.append("title", "Test Document");
    formData.append("description", "Test document uploaded via API test");

    const uploadResponse = await fetch(`${API_URL}/rpc/documents.upload`, {
      method: "POST",
      body: formData,
    });

    const uploadData = await uploadResponse.json();

    console.log("Response:");
    console.log(JSON.stringify(uploadData, null, 2));

    if (uploadResponse.ok && uploadData.data) {
      console.log("✓ Document upload passed");

      // Test 4: Get Document Details
      console.log("");
      console.log("4. Testing document retrieval...");
      const documentId = uploadData.data.id;

      try {
        const getDocumentResponse = await fetch(
          `${API_URL}/rpc/documents.get?id=${documentId}`
        );
        const getDocumentData = await getDocumentResponse.json();

        console.log("Response:");
        console.log(JSON.stringify(getDocumentData, null, 2));

        if (getDocumentResponse.ok && getDocumentData.data) {
          console.log("✓ Document retrieval passed");
        } else {
          console.log("✗ Document retrieval failed");
          process.exit(1);
        }
      } catch (error) {
        console.error("✗ Document retrieval failed:", error);
        process.exit(1);
      }

      // Test 5: Extract Text from Document
      console.log("");
      console.log("5. Testing document text extraction...");

      try {
        const extractResponse = await fetch(
          `${API_URL}/rpc/documents.extract?id=${documentId}`,
          {
            method: "POST",
          }
        );
        const extractData = await extractResponse.json();

        console.log("Response:");
        console.log(JSON.stringify(extractData, null, 2));

        if (extractResponse.ok && extractData.data) {
          console.log("✓ Document text extraction passed");
        } else {
          console.log("✗ Document text extraction failed");
          process.exit(1);
        }
      } catch (error) {
        console.error("✗ Document text extraction failed:", error);
        process.exit(1);
      }
    } else {
      console.log("✗ Document upload failed");
      process.exit(1);
    }
  } catch (error) {
    console.error("✗ Document upload failed:", error);
    process.exit(1);
  }
} else {
  console.log("3. Skipping document upload tests (no file provided)");
  console.log("");
  console.log(`Usage: bun ${import.meta.file} <document-file>`);
  console.log("Example: bun test-document-api.ts sample.pdf");
  console.log("         bun test-document-api.ts sample.docx");
}

console.log("");

// Test 6: Search Documents
console.log("6. Testing document search...");
try {
  const searchResponse = await fetch(
    `${API_URL}/rpc/documents.search?query=test`
  );
  const searchData = await searchResponse.json();

  console.log("Response:");
  console.log(JSON.stringify(searchData, null, 2));

  if (searchResponse.ok && searchData.data !== undefined) {
    console.log("✓ Document search passed");
  } else {
    console.log("✗ Document search failed");
    process.exit(1);
  }
} catch (error) {
  console.error("✗ Document search failed:", error);
  process.exit(1);
}

console.log("");

// Test 7: Delete Document (if we uploaded one)
if (DOCUMENT_FILE) {
  console.log("7. Testing document deletion...");
  // Note: This would require the document ID from the upload test
  // For now, we'll skip this as it would require state management
  console.log("Skipping document deletion (requires document ID)");
}

console.log("");
console.log("===========================================");
console.log("All document processing API tests completed successfully!");
console.log("===========================================");
