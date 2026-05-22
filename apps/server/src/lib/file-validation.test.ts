import { describe, expect, it } from "bun:test";
import {
  FILE_VALIDATION_CONFIG,
  FileValidationError,
  formatFileSize,
  sanitizeFilename,
  validateUploadedFile,
} from "./file-validation";

describe("File Validation", () => {
  describe("sanitizeFilename", () => {
    it("should sanitize unsafe characters", () => {
      expect(sanitizeFilename("test file.pdf")).toBe("test_file.pdf");
      expect(sanitizeFilename("../../../etc/passwd")).toBe("__._._etc_passwd");
      expect(sanitizeFilename('test<>:"|?*.pdf')).toBe("test_______.pdf");
    });

    it("should handle leading dots", () => {
      expect(sanitizeFilename(".htaccess")).toBe("_htaccess");
    });

    it("should truncate long filenames", () => {
      const longName = `${"a".repeat(300)}.pdf`;
      const sanitized = sanitizeFilename(longName);
      expect(sanitized.length).toBeLessThanOrEqual(
        FILE_VALIDATION_CONFIG.MAX_FILENAME_LENGTH
      );
    });

    it("should preserve valid filenames", () => {
      expect(sanitizeFilename("document.pdf")).toBe("document.pdf");
      expect(sanitizeFilename("test_file-123.txt")).toBe("test_file-123.txt");
    });
  });

  describe("formatFileSize", () => {
    it("should format bytes correctly", () => {
      expect(formatFileSize(0)).toBe("0 Bytes");
      expect(formatFileSize(1024)).toBe("1.00 KB");
      expect(formatFileSize(1024 * 1024)).toBe("1.00 MB");
      expect(formatFileSize(1024 * 1024 * 1024)).toBe("1.00 GB");
    });

    it("should handle decimal values", () => {
      expect(formatFileSize(1536)).toBe("1.50 KB");
      expect(formatFileSize(2.5 * 1024 * 1024)).toBe("2.50 MB");
    });
  });

  describe("validateUploadedFile", () => {
    // Helper to create a mock File object
    const createMockFile = (
      name: string,
      size: number,
      type: string,
      content?: Uint8Array
    ): File => {
      const buffer = content || new Uint8Array(size);
      const blob = new Blob([buffer] as BlobPart[], { type });
      return new File([blob], name, { type });
    };

    it("should accept valid PDF file", async () => {
      const file = createMockFile("document.pdf", 1024, "application/pdf");
      await expect(validateUploadedFile(file)).resolves.toBeUndefined();
    });

    it("should accept common PDF MIME alias", async () => {
      const file = createMockFile("document.pdf", 1024, "application/x-pdf");
      await expect(validateUploadedFile(file)).resolves.toBeUndefined();
    });

    it("should accept generic octet-stream MIME for valid PDF by extension", async () => {
      const file = createMockFile(
        "document.pdf",
        1024,
        "application/octet-stream"
      );
      await expect(validateUploadedFile(file)).resolves.toBeUndefined();
    });

    it("should accept valid text file", async () => {
      const file = createMockFile("notes.txt", 512, "text/plain");
      await expect(validateUploadedFile(file)).resolves.toBeUndefined();
    });

    it("should accept valid EML file", async () => {
      const file = createMockFile("mail.eml", 512, "message/rfc822");
      await expect(validateUploadedFile(file)).resolves.toBeUndefined();
    });

    it("should accept valid HTML file", async () => {
      const file = createMockFile("page.html", 512, "text/html");
      await expect(validateUploadedFile(file)).resolves.toBeUndefined();
    });

    it("should accept valid TSV file", async () => {
      const file = createMockFile(
        "table.tsv",
        512,
        "text/tab-separated-values"
      );
      await expect(validateUploadedFile(file)).resolves.toBeUndefined();
    });

    it("should accept valid YAML file", async () => {
      const file = createMockFile("config.yaml", 512, "application/x-yaml");
      await expect(validateUploadedFile(file)).resolves.toBeUndefined();
    });

    it("should accept valid TOML file", async () => {
      const file = createMockFile("config.toml", 512, "application/toml");
      await expect(validateUploadedFile(file)).resolves.toBeUndefined();
    });

    it("should accept valid XML file", async () => {
      const file = createMockFile("data.xml", 512, "application/xml");
      await expect(validateUploadedFile(file)).resolves.toBeUndefined();
    });

    it("should accept valid RTF file", async () => {
      const file = createMockFile("doc.rtf", 512, "application/rtf");
      await expect(validateUploadedFile(file)).resolves.toBeUndefined();
    });

    it("should accept valid code file extension with generic mime", async () => {
      const file = createMockFile("script.py", 512, "application/octet-stream");
      await expect(validateUploadedFile(file)).resolves.toBeUndefined();
    });

    it("should reject empty file", async () => {
      const file = createMockFile("empty.pdf", 0, "application/pdf");
      await expect(validateUploadedFile(file)).rejects.toThrow(
        FileValidationError
      );
      await expect(validateUploadedFile(file)).rejects.toThrow(
        "فایل خالی است."
      );
    });

    it("should reject file that is too large", async () => {
      const file = createMockFile(
        "large.pdf",
        FILE_VALIDATION_CONFIG.MAX_FILE_SIZE + 1,
        "application/pdf"
      );
      await expect(validateUploadedFile(file)).rejects.toThrow(
        FileValidationError
      );
      await expect(validateUploadedFile(file)).rejects.toThrow("از حد مجاز");
    });

    it("should reject files with blocked extensions", async () => {
      const file = createMockFile(
        "malware.exe",
        1024,
        "application/x-msdownload"
      );
      await expect(validateUploadedFile(file)).rejects.toThrow(
        FileValidationError
      );
      await expect(validateUploadedFile(file)).rejects.toThrow("مجاز نیست");
    });

    it("should reject files with invalid MIME types", async () => {
      const file = createMockFile("script.js", 1024, "application/javascript");
      await expect(validateUploadedFile(file)).rejects.toThrow(
        FileValidationError
      );
    });

    it("should respect custom allowed MIME types option", async () => {
      const file = createMockFile("document.pdf", 1024, "application/pdf");
      await expect(
        validateUploadedFile(file, {
          allowedMimeTypes: ["text/plain"],
        })
      ).rejects.toThrow(FileValidationError);
    });

    it("should reject filename with path traversal", async () => {
      const file = createMockFile("../../../etc/passwd", 1024, "text/plain");
      await expect(validateUploadedFile(file)).rejects.toThrow(
        FileValidationError
      );
      await expect(validateUploadedFile(file)).rejects.toThrow(
        "مسیر یا کاراکتر غیرمجاز"
      );
    });

    it("should reject filename with null bytes", async () => {
      const file = createMockFile("file\0.pdf", 1024, "application/pdf");
      await expect(validateUploadedFile(file)).rejects.toThrow(
        FileValidationError
      );
      await expect(validateUploadedFile(file)).rejects.toThrow(
        "کاراکتر نامعتبر"
      );
    });

    it("should reject executable signatures", async () => {
      // MZ executable signature
      const mzSignature = new Uint8Array([
        0x4d,
        0x5a,
        ...new Array(1022).fill(0),
      ]);
      const file = createMockFile(
        "fake.pdf",
        1024,
        "application/pdf",
        mzSignature
      );
      await expect(validateUploadedFile(file)).rejects.toThrow(
        FileValidationError
      );
      await expect(validateUploadedFile(file)).rejects.toThrow(
        "محتوای فایل مجاز نیست."
      );
    });

    it("should accept zip-based office container signatures for docx", async () => {
      const zipSignature = new Uint8Array([
        0x50,
        0x4b,
        0x03,
        0x04,
        ...new Array(1020).fill(0),
      ]);
      const file = createMockFile(
        "report.docx",
        1024,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        zipSignature
      );
      await expect(validateUploadedFile(file)).resolves.toBeUndefined();
    });

    it("should accept zip-based office container signatures for xlsx", async () => {
      const zipSignature = new Uint8Array([
        0x50,
        0x4b,
        0x03,
        0x04,
        ...new Array(1020).fill(0),
      ]);
      const file = createMockFile(
        "sheet.xlsx",
        1024,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        zipSignature
      );
      await expect(validateUploadedFile(file)).resolves.toBeUndefined();
    });

    it("should reject zip signature for non-office extension", async () => {
      const zipSignature = new Uint8Array([
        0x50,
        0x4b,
        0x03,
        0x04,
        ...new Array(1020).fill(0),
      ]);
      const file = createMockFile(
        "archive.pdf",
        1024,
        "application/pdf",
        zipSignature
      );
      await expect(validateUploadedFile(file)).rejects.toThrow(
        "محتوای فایل مجاز نیست."
      );
    });

    it("should accept file with custom size limit", async () => {
      const file = createMockFile("small.pdf", 1024, "application/pdf");
      await expect(
        validateUploadedFile(file, { maxSize: 2048 })
      ).resolves.toBeUndefined();
    });

    it("should reject file exceeding custom size limit", async () => {
      const file = createMockFile("large.pdf", 2048, "application/pdf");
      await expect(
        validateUploadedFile(file, { maxSize: 1024 })
      ).rejects.toThrow(FileValidationError);
    });

    it("should skip content validation when requested", async () => {
      const mzSignature = new Uint8Array([
        0x4d,
        0x5a,
        ...new Array(1022).fill(0),
      ]);
      const file = createMockFile(
        "fake.pdf",
        1024,
        "application/pdf",
        mzSignature
      );
      // This should NOT throw when content validation is skipped
      await expect(
        validateUploadedFile(file, { skipContentValidation: true })
      ).resolves.toBeUndefined();
      // But it should still fail on signature check if not skipped
      await expect(validateUploadedFile(file)).rejects.toThrow(
        "محتوای فایل مجاز نیست."
      );
    });
  });

  describe("FileValidationError", () => {
    it("should create error with code", () => {
      const error = new FileValidationError("Test error", "TEST_CODE", {
        foo: "bar",
      });
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_CODE");
      expect(error.details).toEqual({ foo: "bar" });
      expect(error.name).toBe("FileValidationError");
    });

    it("should be instanceof Error", () => {
      const error = new FileValidationError("Test", "CODE");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(FileValidationError);
    });
  });
});
