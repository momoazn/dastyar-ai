import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { logger } from "@/lib/logger";
import { deleteChunksForDocument } from "@/repositories/documents";
import { extractTextFromDocx } from "./docx";
import { extractTextFromPdf } from "./pdf";
import { indexDocumentPages, indexDocumentText } from "./rag";

const TEXT_FILE_EXTENSIONS = new Set(["txt", "md", "markdown", "csv", "json"]);
const DOCX_FILE_EXTENSIONS = new Set(["docx"]);
const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);
const DOCX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const RETRY_DELAYS_MS = [300, 900] as const;
const LEADING_DOT_REGEX = /^\./u;

export type UploadIndexingReason =
  | "indexed"
  | "unsupported_file_type"
  | "no_extractable_content"
  | "indexing_failed";
export type UploadIndexingStatus = "indexed" | "not_indexed";
export type UploadIndexingSource =
  | "server_pdf"
  | "server_docx"
  | "server_text"
  | "client_pages"
  | "client_text"
  | "none";
type PdfPage = { page: number; text: string };

export type UploadIndexingDeps = {
  clearChunks: (documentId: number) => Promise<void>;
  extractDocxText: (filePath: string) => Promise<string>;
  extractPdfPages: (filePath: string) => Promise<PdfPage[]>;
  indexPages: (documentId: number, pages: PdfPage[]) => Promise<number>;
  indexText: (documentId: number, text: string) => Promise<number>;
  readTextFile: (filePath: string) => Promise<string>;
};

const defaultDeps: UploadIndexingDeps = {
  clearChunks: deleteChunksForDocument,
  extractDocxText: extractTextFromDocx,
  extractPdfPages: extractTextFromPdf,
  indexPages: indexDocumentPages,
  indexText: indexDocumentText,
  readTextFile: async (filePath: string): Promise<string> => {
    const raw = await readFile(filePath, "utf8");
    return normalizeText(raw);
  },
};

export type UploadIndexingInput = {
  clientPages?: PdfPage[];
  clientTextContent?: string;
  documentId: number;
  fileName: string;
  filePath: string;
  mimeType: string;
  userId: number;
};

export type UploadIndexingResult = {
  chunks: number;
  reason: UploadIndexingReason;
  source: UploadIndexingSource;
  status: UploadIndexingStatus;
};

type ResolvedInput =
  | { pages: PdfPage[]; source: UploadIndexingSource; type: "pages" }
  | { source: UploadIndexingSource; text: string; type: "text" }
  | {
      reason: UploadIndexingReason;
      source: UploadIndexingSource;
      type: "none";
    };

export async function indexUploadedDocument(
  input: UploadIndexingInput,
  deps: UploadIndexingDeps = defaultDeps
): Promise<UploadIndexingResult> {
  const resolvedInput = await resolveIndexingInput(input, deps);
  if (resolvedInput.type === "none") {
    return {
      chunks: 0,
      reason: resolvedInput.reason,
      source: resolvedInput.source,
      status: "not_indexed",
    };
  }

  try {
    const chunks =
      resolvedInput.type === "pages"
        ? await runIndexingWithRetry(
            () => deps.indexPages(input.documentId, resolvedInput.pages),
            input.documentId,
            input.userId,
            deps
          )
        : await runIndexingWithRetry(
            () => deps.indexText(input.documentId, resolvedInput.text),
            input.documentId,
            input.userId,
            deps
          );

    if (chunks > 0) {
      return {
        chunks,
        reason: "indexed",
        source: resolvedInput.source,
        status: "indexed",
      };
    }

    return {
      chunks: 0,
      reason: "no_extractable_content",
      source: resolvedInput.source,
      status: "not_indexed",
    };
  } catch (error) {
    logger.error(
      "Document indexing failed, continuing without embeddings",
      error,
      {
        documentId: input.documentId,
        source: resolvedInput.source,
        userId: input.userId,
      }
    );
    return {
      chunks: 0,
      reason: "indexing_failed",
      source: resolvedInput.source,
      status: "not_indexed",
    };
  }
}

export function isPdfDocument(fileName: string, mimeType: string): boolean {
  const mime = normalizeMimeType(mimeType);
  return mime.includes("pdf") || getFileExtension(fileName) === "pdf";
}

export function isTextDocument(fileName: string, mimeType: string): boolean {
  const mime = normalizeMimeType(mimeType);
  return (
    TEXT_MIME_TYPES.has(mime) ||
    TEXT_FILE_EXTENSIONS.has(getFileExtension(fileName))
  );
}

export function isDocxDocument(fileName: string, mimeType: string): boolean {
  const mime = normalizeMimeType(mimeType);
  return (
    DOCX_MIME_TYPES.has(mime) ||
    DOCX_FILE_EXTENSIONS.has(getFileExtension(fileName))
  );
}

function getFileExtension(fileName: string): string {
  return extname(fileName).replace(LEADING_DOT_REGEX, "").toLowerCase();
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.split(";")[0].trim().toLowerCase();
}

function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00A0/g, " ")
    .trim();
}

function sanitizeClientPages(pages?: PdfPage[]): PdfPage[] {
  if (!Array.isArray(pages) || pages.length === 0) {
    return [];
  }

  const sanitized: PdfPage[] = [];
  for (const page of pages) {
    const text = normalizeText(page.text);
    if (text.length > 0) {
      sanitized.push({ page: page.page, text });
    }
  }
  return sanitized;
}

function sanitizeClientText(text?: string): string {
  if (typeof text !== "string") {
    return "";
  }
  return normalizeText(text);
}

function isTransientIndexingError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("connection") ||
    message.includes("timeout") ||
    message.includes("econnrefused") ||
    message.includes("network")
  );
}

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function runIndexingWithRetry(
  operation: () => Promise<number>,
  documentId: number,
  userId: number,
  deps: UploadIndexingDeps
): Promise<number> {
  let attempt = 0;
  let lastError: unknown;
  const maxAttempts = RETRY_DELAYS_MS.length + 1;

  while (attempt < maxAttempts) {
    try {
      await deps.clearChunks(documentId);
      return await operation();
    } catch (error) {
      lastError = error;
      const canRetry =
        isTransientIndexingError(error) && attempt < maxAttempts - 1;
      if (!canRetry) {
        throw error;
      }

      logger.warn("Transient indexing failure, retrying", {
        attempt: attempt + 1,
        documentId,
        userId,
      });
      await sleep(RETRY_DELAYS_MS[attempt]);
      attempt += 1;
    }
  }

  throw lastError;
}

async function safeReadTextFile(
  filePath: string,
  deps: UploadIndexingDeps
): Promise<string> {
  try {
    return normalizeText(await deps.readTextFile(filePath));
  } catch (error) {
    logger.warn("Text extraction failed", {
      error: error instanceof Error ? error.message : String(error),
      filePath,
    });
    return "";
  }
}

async function resolveIndexingInput(
  input: UploadIndexingInput,
  deps: UploadIndexingDeps
): Promise<ResolvedInput> {
  const clientPages = sanitizeClientPages(input.clientPages);
  const clientText = sanitizeClientText(input.clientTextContent);

  if (isPdfDocument(input.fileName, input.mimeType)) {
    const serverPages = await deps.extractPdfPages(input.filePath);
    if (serverPages.length > 0) {
      return { pages: serverPages, source: "server_pdf", type: "pages" };
    }
    if (clientPages.length > 0) {
      return { pages: clientPages, source: "client_pages", type: "pages" };
    }
    if (clientText.length > 0) {
      return { source: "client_text", text: clientText, type: "text" };
    }
    return {
      reason: "no_extractable_content",
      source: "none",
      type: "none",
    };
  }

  if (isDocxDocument(input.fileName, input.mimeType)) {
    const serverText = await safeReadDocxFile(input.filePath, deps);
    if (serverText.length > 0) {
      return { source: "server_docx", text: serverText, type: "text" };
    }
    if (clientText.length > 0) {
      return { source: "client_text", text: clientText, type: "text" };
    }
    return {
      reason: "no_extractable_content",
      source: "none",
      type: "none",
    };
  }

  if (isTextDocument(input.fileName, input.mimeType)) {
    const serverText = await safeReadTextFile(input.filePath, deps);
    if (serverText.length > 0) {
      return { source: "server_text", text: serverText, type: "text" };
    }
    if (clientText.length > 0) {
      return { source: "client_text", text: clientText, type: "text" };
    }
    return {
      reason: "no_extractable_content",
      source: "none",
      type: "none",
    };
  }

  if (clientPages.length > 0) {
    return { pages: clientPages, source: "client_pages", type: "pages" };
  }
  if (clientText.length > 0) {
    return { source: "client_text", text: clientText, type: "text" };
  }

  return {
    reason: "unsupported_file_type",
    source: "none",
    type: "none",
  };
}

async function safeReadDocxFile(
  filePath: string,
  deps: UploadIndexingDeps
): Promise<string> {
  try {
    return normalizeText(await deps.extractDocxText(filePath));
  } catch (error) {
    logger.warn("DOCX extraction failed", {
      error: error instanceof Error ? error.message : String(error),
      filePath,
    });
    return "";
  }
}
