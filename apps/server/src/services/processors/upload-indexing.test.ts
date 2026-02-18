import { describe, expect, it } from "bun:test";
import {
  indexUploadedDocument,
  isDocxDocument,
  isPdfDocument,
  isTextDocument,
  type UploadIndexingDeps,
  type UploadIndexingInput,
} from "./upload-indexing";

const BASE_INPUT: UploadIndexingInput = {
  documentId: 123,
  fileName: "sample.pdf",
  filePath: "/tmp/sample.pdf",
  mimeType: "application/pdf",
  userId: 99,
};

function buildDeps(
  overrides: Partial<UploadIndexingDeps> = {}
): UploadIndexingDeps {
  return {
    clearChunks: () => Promise.resolve(undefined),
    extractDocxText: () => Promise.resolve(""),
    extractPdfPages: () => Promise.resolve([]),
    indexPages: () => Promise.resolve(0),
    indexText: () => Promise.resolve(0),
    readTextFile: () => Promise.resolve(""),
    ...overrides,
  };
}

describe("upload-indexing", () => {
  it("detects PDF documents by mime and extension", () => {
    expect(isPdfDocument("doc.bin", "application/pdf")).toBe(true);
    expect(isPdfDocument("report.PDF", "application/octet-stream")).toBe(true);
    expect(isPdfDocument("notes.txt", "text/plain")).toBe(false);
  });

  it("detects text documents by mime and extension", () => {
    expect(isTextDocument("notes.txt", "text/plain")).toBe(true);
    expect(isTextDocument("data.bin", "application/json")).toBe(true);
    expect(isTextDocument("table.csv", "application/octet-stream")).toBe(true);
    expect(isTextDocument("archive.zip", "application/octet-stream")).toBe(
      false
    );
  });

  it("detects docx documents by mime and extension", () => {
    expect(
      isDocxDocument(
        "report.bin",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ).toBe(true);
    expect(isDocxDocument("report.docx", "application/octet-stream")).toBe(
      true
    );
    expect(isDocxDocument("report.txt", "text/plain")).toBe(false);
  });

  it("uses server PDF extraction when available", async () => {
    let indexedPages = 0;
    const deps = buildDeps({
      extractPdfPages: async () => [
        { page: 1, text: "server content" },
        { page: 2, text: "server content 2" },
      ],
      indexPages: (_documentId, pages) => {
        indexedPages = pages.length;
        return Promise.resolve(2);
      },
    });

    const result = await indexUploadedDocument(
      {
        ...BASE_INPUT,
        clientPages: [{ page: 1, text: "client content" }],
      },
      deps
    );

    expect(indexedPages).toBe(2);
    expect(result.chunks).toBe(2);
    expect(result.reason).toBe("indexed");
    expect(result.source).toBe("server_pdf");
    expect(result.status).toBe("indexed");
  });

  it("falls back to client PDF pages when server extraction is empty", async () => {
    let indexedPages = 0;
    const deps = buildDeps({
      extractPdfPages: async () => [],
      indexPages: (_documentId, pages) => {
        indexedPages = pages.length;
        return Promise.resolve(1);
      },
    });

    const result = await indexUploadedDocument(
      {
        ...BASE_INPUT,
        clientPages: [{ page: 1, text: "client fallback page" }],
      },
      deps
    );

    expect(indexedPages).toBe(1);
    expect(result.chunks).toBe(1);
    expect(result.source).toBe("client_pages");
    expect(result.status).toBe("indexed");
  });

  it("indexes text documents from server content", async () => {
    const deps = buildDeps({
      indexText: async (_documentId, text) => (text.includes("hello") ? 3 : 0),
      readTextFile: async () => "hello world",
    });

    const result = await indexUploadedDocument(
      {
        ...BASE_INPUT,
        fileName: "notes.txt",
        mimeType: "text/plain",
      },
      deps
    );

    expect(result.chunks).toBe(3);
    expect(result.source).toBe("server_text");
    expect(result.status).toBe("indexed");
  });

  it("indexes docx documents from server extraction", async () => {
    const deps = buildDeps({
      extractDocxText: async () => "docx extracted text",
      indexText: async (_documentId, text) => (text.includes("docx") ? 2 : 0),
    });

    const result = await indexUploadedDocument(
      {
        ...BASE_INPUT,
        fileName: "report.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      deps
    );

    expect(result.chunks).toBe(2);
    expect(result.source).toBe("server_docx");
    expect(result.status).toBe("indexed");
  });

  it("returns unsupported_file_type when no parsable content exists", async () => {
    const result = await indexUploadedDocument(
      {
        ...BASE_INPUT,
        fileName: "archive.zip",
        mimeType: "application/octet-stream",
      },
      buildDeps()
    );

    expect(result.chunks).toBe(0);
    expect(result.reason).toBe("unsupported_file_type");
    expect(result.source).toBe("none");
    expect(result.status).toBe("not_indexed");
  });

  it("retries transient indexing errors and eventually succeeds", async () => {
    let attempts = 0;
    let clears = 0;
    const deps = buildDeps({
      clearChunks: () => {
        clears += 1;
        return Promise.resolve(undefined);
      },
      indexText: () => {
        attempts += 1;
        if (attempts < 3) {
          throw new Error("Connection error.");
        }
        return Promise.resolve(4);
      },
      readTextFile: async () => "retry me",
    });

    const result = await indexUploadedDocument(
      {
        ...BASE_INPUT,
        fileName: "notes.txt",
        mimeType: "text/plain",
      },
      deps
    );

    expect(attempts).toBe(3);
    expect(clears).toBe(3);
    expect(result.chunks).toBe(4);
    expect(result.reason).toBe("indexed");
    expect(result.status).toBe("indexed");
  });
});
