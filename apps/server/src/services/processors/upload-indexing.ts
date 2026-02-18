import { extname } from "node:path";
import { logger } from "@/lib/logger";
import { deleteChunksForDocument } from "@/repositories/documents";
import { extractTextFromDocx } from "./docx";
import { extractTextFromPdf } from "./pdf";
import { indexDocumentPages, indexDocumentText } from "./rag";
import {
  extractTextFromEml,
  extractTextFromHtmlFile,
  extractTextFromRtfFile,
  extractTextFromUtf8File,
  extractTextFromXlsx,
} from "./text-extractors";

const TEXT_FILE_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "csv",
  "tsv",
  "json",
  "yaml",
  "yml",
  "toml",
  "ini",
  "conf",
  "log",
  "sql",
  "xml",
  "py",
  "ts",
  "tsx",
  "java",
  "go",
  "rs",
  "c",
  "cpp",
  "cc",
  "h",
  "hpp",
  "cs",
  "rb",
  "php",
  "swift",
  "kt",
  "kts",
  "scala",
  "lua",
  "r",
  "m",
]);
const DOCX_FILE_EXTENSIONS = new Set(["docx"]);
const SPREADSHEET_FILE_EXTENSIONS = new Set(["xlsx", "xls", "xlsm"]);
const HTML_FILE_EXTENSIONS = new Set(["html", "htm"]);
const EML_FILE_EXTENSIONS = new Set(["eml"]);
const RTF_FILE_EXTENSIONS = new Set(["rtf"]);
const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/tab-separated-values",
  "application/json",
  "text/yaml",
  "application/x-yaml",
  "application/yaml",
  "application/toml",
  "text/x-toml",
  "text/xml",
  "application/xml",
  "text/x-python",
  "text/x-java-source",
]);
const DOCX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const SPREADSHEET_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.ms-excel.sheet.macroenabled.12",
]);
const HTML_MIME_TYPES = new Set(["text/html", "application/xhtml+xml"]);
const EML_MIME_TYPES = new Set(["message/rfc822", "text/rfc822"]);
const RTF_MIME_TYPES = new Set(["application/rtf", "text/rtf"]);
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
  | "server_xlsx"
  | "server_html"
  | "server_eml"
  | "server_rtf"
  | "server_text"
  | "client_pages"
  | "client_text"
  | "none";
type PdfPage = { page: number; text: string };

export type UploadIndexingDeps = {
  clearChunks: (documentId: number) => Promise<void>;
  extractDocxText: (filePath: string) => Promise<string>;
  extractEmlText: (filePath: string) => Promise<string>;
  extractHtmlText: (filePath: string) => Promise<string>;
  extractPdfPages: (filePath: string) => Promise<PdfPage[]>;
  extractRtfText: (filePath: string) => Promise<string>;
  extractXlsxText: (filePath: string) => Promise<string>;
  indexPages: (documentId: number, pages: PdfPage[]) => Promise<number>;
  indexText: (documentId: number, text: string) => Promise<number>;
  readTextFile: (filePath: string) => Promise<string>;
};

const defaultDeps: UploadIndexingDeps = {
  clearChunks: deleteChunksForDocument,
  extractDocxText: extractTextFromDocx,
  extractEmlText: extractTextFromEml,
  extractHtmlText: extractTextFromHtmlFile,
  extractPdfPages: extractTextFromPdf,
  extractRtfText: extractTextFromRtfFile,
  extractXlsxText: extractTextFromXlsx,
  indexPages: indexDocumentPages,
  indexText: indexDocumentText,
  readTextFile: extractTextFromUtf8File,
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

type ServerTextCandidate = {
  matches: (fileName: string, mimeType: string) => boolean;
  read: (filePath: string, deps: UploadIndexingDeps) => Promise<string>;
  source: UploadIndexingSource;
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

export function isSpreadsheetDocument(
  fileName: string,
  mimeType: string
): boolean {
  const mime = normalizeMimeType(mimeType);
  return (
    SPREADSHEET_MIME_TYPES.has(mime) ||
    SPREADSHEET_FILE_EXTENSIONS.has(getFileExtension(fileName))
  );
}

export function isHtmlDocument(fileName: string, mimeType: string): boolean {
  const mime = normalizeMimeType(mimeType);
  return (
    HTML_MIME_TYPES.has(mime) ||
    HTML_FILE_EXTENSIONS.has(getFileExtension(fileName))
  );
}

export function isEmlDocument(fileName: string, mimeType: string): boolean {
  const mime = normalizeMimeType(mimeType);
  return (
    EML_MIME_TYPES.has(mime) ||
    EML_FILE_EXTENSIONS.has(getFileExtension(fileName))
  );
}

export function isRtfDocument(fileName: string, mimeType: string): boolean {
  const mime = normalizeMimeType(mimeType);
  return (
    RTF_MIME_TYPES.has(mime) ||
    RTF_FILE_EXTENSIONS.has(getFileExtension(fileName))
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

function resolveIndexingInput(
  input: UploadIndexingInput,
  deps: UploadIndexingDeps
): Promise<ResolvedInput> {
  const clientPages = sanitizeClientPages(input.clientPages);
  const clientText = sanitizeClientText(input.clientTextContent);

  if (isPdfDocument(input.fileName, input.mimeType)) {
    return resolvePdfInput(input, deps, clientPages, clientText);
  }

  const serverTextCandidates = getServerTextCandidates();
  for (const candidate of serverTextCandidates) {
    if (!candidate.matches(input.fileName, input.mimeType)) {
      continue;
    }
    return resolveServerTextInput(input, deps, candidate, clientText);
  }

  return Promise.resolve(resolveClientOnlyInput(clientPages, clientText));
}

function getServerTextCandidates(): ServerTextCandidate[] {
  return [
    {
      matches: isDocxDocument,
      read: safeReadDocxFile,
      source: "server_docx",
    },
    {
      matches: isSpreadsheetDocument,
      read: safeReadXlsxFile,
      source: "server_xlsx",
    },
    {
      matches: isHtmlDocument,
      read: safeReadHtmlFile,
      source: "server_html",
    },
    {
      matches: isEmlDocument,
      read: safeReadEmlFile,
      source: "server_eml",
    },
    {
      matches: isRtfDocument,
      read: safeReadRtfFile,
      source: "server_rtf",
    },
    {
      matches: isTextDocument,
      read: safeReadTextFile,
      source: "server_text",
    },
  ];
}

async function resolvePdfInput(
  input: UploadIndexingInput,
  deps: UploadIndexingDeps,
  clientPages: PdfPage[],
  clientText: string
): Promise<ResolvedInput> {
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

  return noExtractableContentResult();
}

async function resolveServerTextInput(
  input: UploadIndexingInput,
  deps: UploadIndexingDeps,
  candidate: ServerTextCandidate,
  clientText: string
): Promise<ResolvedInput> {
  const serverText = await candidate.read(input.filePath, deps);
  if (serverText.length > 0) {
    return { source: candidate.source, text: serverText, type: "text" };
  }

  if (clientText.length > 0) {
    return { source: "client_text", text: clientText, type: "text" };
  }

  return noExtractableContentResult();
}

function resolveClientOnlyInput(
  clientPages: PdfPage[],
  clientText: string
): ResolvedInput {
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

function noExtractableContentResult(): ResolvedInput {
  return {
    reason: "no_extractable_content",
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

async function safeReadEmlFile(
  filePath: string,
  deps: UploadIndexingDeps
): Promise<string> {
  try {
    return normalizeText(await deps.extractEmlText(filePath));
  } catch (error) {
    logger.warn("EML extraction failed", {
      error: error instanceof Error ? error.message : String(error),
      filePath,
    });
    return "";
  }
}

async function safeReadHtmlFile(
  filePath: string,
  deps: UploadIndexingDeps
): Promise<string> {
  try {
    return normalizeText(await deps.extractHtmlText(filePath));
  } catch (error) {
    logger.warn("HTML extraction failed", {
      error: error instanceof Error ? error.message : String(error),
      filePath,
    });
    return "";
  }
}

async function safeReadRtfFile(
  filePath: string,
  deps: UploadIndexingDeps
): Promise<string> {
  try {
    return normalizeText(await deps.extractRtfText(filePath));
  } catch (error) {
    logger.warn("RTF extraction failed", {
      error: error instanceof Error ? error.message : String(error),
      filePath,
    });
    return "";
  }
}

async function safeReadXlsxFile(
  filePath: string,
  deps: UploadIndexingDeps
): Promise<string> {
  try {
    return normalizeText(await deps.extractXlsxText(filePath));
  } catch (error) {
    logger.warn("Spreadsheet extraction failed", {
      error: error instanceof Error ? error.message : String(error),
      filePath,
    });
    return "";
  }
}
