import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { extractTextFromPdf } from "./pdf";

// Create a temporary directory for test files
const TEST_DIR = join(import.meta.dir, "__test_files__");

describe("PDF Processor", () => {
  beforeEach(async () => {
    // Create test directory
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore errors during cleanup
    }
  });

  describe("extractTextFromPdf", () => {
    it("should return empty array for non-existent file", async () => {
      const result = await extractTextFromPdf(
        join(TEST_DIR, "nonexistent.pdf")
      );
      expect(result).toEqual([]);
    });

    it("should return empty array for invalid PDF file", async () => {
      const invalidPdfPath = join(TEST_DIR, "invalid.pdf");
      await writeFile(invalidPdfPath, "This is not a valid PDF file");

      const result = await extractTextFromPdf(invalidPdfPath);
      expect(result).toEqual([]);
    });

    it("should return empty array for empty file", async () => {
      const emptyPdfPath = join(TEST_DIR, "empty.pdf");
      await writeFile(emptyPdfPath, "");

      const result = await extractTextFromPdf(emptyPdfPath);
      expect(result).toEqual([]);
    });

    it("should return empty array for corrupted PDF", async () => {
      const corruptedPdfPath = join(TEST_DIR, "corrupted.pdf");
      // Write PDF header but incomplete content
      await writeFile(corruptedPdfPath, "%PDF-1.4\nincomplete content");

      const result = await extractTextFromPdf(corruptedPdfPath);
      expect(result).toEqual([]);
    });

    // Note: Testing with actual valid PDF files would require generating or
    // including test PDF fixtures. For now, we test error handling paths.
    // In a complete test suite, you would:
    // 1. Include small test PDF files in the test fixtures
    // 2. Test extraction of actual text content
    // 3. Test multi-page PDFs
    // 4. Test PDFs with different encodings

    it("should handle PDF with special characters in filename", async () => {
      const specialPath = join(TEST_DIR, "file with spaces & special.pdf");
      await writeFile(specialPath, "Not a PDF");

      const result = await extractTextFromPdf(specialPath);
      expect(result).toEqual([]);
    });

    it("should handle very long file paths", async () => {
      const longName = `${"a".repeat(100)}.pdf`;
      const longPath = join(TEST_DIR, longName);
      await writeFile(longPath, "Not a PDF");

      const result = await extractTextFromPdf(longPath);
      expect(result).toEqual([]);
    });
  });

  // Note: For comprehensive PDF testing, you would need:
  // 1. Sample PDF files in your test fixtures
  // 2. Tests verifying correct text extraction
  // 3. Tests for different PDF versions and features
  // 4. Tests for PDFs with images, tables, forms
  // 5. Performance tests for large PDFs
});
