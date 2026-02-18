import { promises as fs } from "node:fs";
import path from "node:path";
import { env, resolveConfiguredPath } from "@/config";
import { sanitizeFilename } from "@/lib/file-validation";

const DATA_URL_PREFIX_REGEX = /^data:application\/[a-zA-Z0-9.+-]+;base64,/;

export type SaveDocumentResult = {
  filePath: string;
  fileName: string;
  mimeType: string;
};

function getDocumentsBaseDir(): string {
  return resolveConfiguredPath(env.DOCUMENTS_DIR);
}

function ensureDateDir(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return path.join(getDocumentsBaseDir(), String(year), month);
}

function generateFileName(originalName?: string): string {
  const base = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  if (!originalName) {
    return `${base}.bin`;
  }
  // Sanitize the original filename and extract extension
  const sanitized = sanitizeFilename(originalName);
  const ext = path.extname(sanitized) || ".bin";
  return `${base}${ext}`;
}

export async function saveDocumentFromBase64(
  base64Data: string,
  originalName?: string
): Promise<SaveDocumentResult> {
  const cleanBase64 = base64Data.replace(DATA_URL_PREFIX_REGEX, "");
  const buffer = Buffer.from(cleanBase64, "base64");
  const dir = ensureDateDir();
  await fs.mkdir(dir, { recursive: true });
  const fileName = generateFileName(originalName);
  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, buffer);

  const mimeType = guessMimeType(fileName);
  return { filePath, fileName, mimeType };
}

export async function saveDocumentFromFile(
  file: File,
  originalName?: string
): Promise<SaveDocumentResult> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const dir = ensureDateDir();
  await fs.mkdir(dir, { recursive: true });
  const fileName = generateFileName(originalName ?? file.name);
  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, buffer);
  const mimeType = file.type || guessMimeType(fileName);
  return { filePath, fileName, mimeType };
}

export async function deleteDocumentFile(filePath: string): Promise<void> {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
  } catch {
    // ignore
  }
}

export function guessMimeType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".txt":
    case ".log":
    case ".ini":
    case ".conf":
    case ".sql":
    case ".py":
    case ".ts":
    case ".tsx":
    case ".java":
    case ".go":
    case ".rs":
    case ".c":
    case ".cc":
    case ".cpp":
    case ".h":
    case ".hpp":
    case ".cs":
    case ".rb":
    case ".php":
    case ".swift":
    case ".kt":
    case ".kts":
    case ".scala":
    case ".lua":
    case ".r":
    case ".m":
      return "text/plain";
    case ".md":
    case ".markdown":
      return "text/markdown";
    case ".csv":
      return "text/csv";
    case ".tsv":
      return "text/tab-separated-values";
    case ".json":
      return "application/json";
    case ".yaml":
    case ".yml":
      return "application/x-yaml";
    case ".toml":
      return "application/toml";
    case ".html":
    case ".htm":
      return "text/html";
    case ".xml":
      return "application/xml";
    case ".rtf":
      return "application/rtf";
    case ".eml":
      return "message/rfc822";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xls":
      return "application/vnd.ms-excel";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".xlsm":
      return "application/vnd.ms-excel.sheet.macroenabled.12";
    default:
      return "application/octet-stream";
  }
}
