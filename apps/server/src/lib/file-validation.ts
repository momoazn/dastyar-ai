import { logger } from "./logger";

// Regex constants for performance
// biome-ignore lint/suspicious/noControlCharactersInRegex: Needed for security validation
const CONTROL_CHARACTERS_REGEX = /[\x00-\x1F\x7F]/;
const LEADING_DOT_REGEX = /^\./;

/**
 * File validation configuration
 */
export const FILE_VALIDATION_CONFIG = {
  // Maximum file size: 50MB
  MAX_FILE_SIZE: 50 * 1024 * 1024,

  // Allowed MIME types for document uploads
  ALLOWED_MIME_TYPES: [
    "application/pdf",
    "application/x-pdf", // Common PDF alias (older browsers/platforms)
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-excel", // .xls
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  ] as const,

  // Allowed file extensions (without dot)
  ALLOWED_EXTENSIONS: [
    "pdf",
    "txt",
    "md",
    "markdown",
    "csv",
    "json",
    "doc",
    "docx",
    "xls",
    "xlsx",
  ] as const,

  // Dangerous file extensions that should never be allowed
  BLOCKED_EXTENSIONS: [
    "exe",
    "bat",
    "cmd",
    "com",
    "scr",
    "vbs",
    "js",
    "jse",
    "jar",
    "zip",
    "rar",
    "7z",
    "tar",
    "gz",
    "sh",
    "ps1",
    "dll",
    "so",
    "dylib",
  ] as const,

  // Maximum filename length
  MAX_FILENAME_LENGTH: 255,
} as const;

/**
 * File validation error types
 */
export class FileValidationError extends Error {
  code: string;
  details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = "FileValidationError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Extract file extension from filename
 */
function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? (parts.at(-1) ?? "") : "";
}

/**
 * Check if file extension is allowed
 */
function isExtensionAllowed(filename: string): boolean {
  const ext = getFileExtension(filename);

  // Check if extension is explicitly blocked
  if (FILE_VALIDATION_CONFIG.BLOCKED_EXTENSIONS.includes(ext as never)) {
    return false;
  }

  // Check if extension is in allowed list
  return FILE_VALIDATION_CONFIG.ALLOWED_EXTENSIONS.includes(ext as never);
}

/**
 * Check if MIME type is allowed
 */
function isMimeTypeAllowed(mimeType: string): boolean {
  // Normalize MIME type (remove charset, etc.)
  const normalizedMimeType = mimeType.split(";")[0].trim().toLowerCase();

  return FILE_VALIDATION_CONFIG.ALLOWED_MIME_TYPES.some(
    (allowed) => allowed.toLowerCase() === normalizedMimeType
  );
}

/**
 * Validate filename for security issues
 */
function validateFilename(filename: string): void {
  // Check filename length
  if (filename.length > FILE_VALIDATION_CONFIG.MAX_FILENAME_LENGTH) {
    throw new FileValidationError(
      `Filename too long (max ${FILE_VALIDATION_CONFIG.MAX_FILENAME_LENGTH} characters)`,
      "FILENAME_TOO_LONG"
    );
  }

  // Check for null bytes (path traversal attempt)
  if (filename.includes("\0")) {
    throw new FileValidationError(
      "Filename contains null bytes",
      "INVALID_FILENAME"
    );
  }

  // Check for path traversal attempts
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\")
  ) {
    throw new FileValidationError(
      "Filename contains path traversal characters",
      "PATH_TRAVERSAL_ATTEMPT"
    );
  }

  // Check for empty filename
  if (filename.trim().length === 0) {
    throw new FileValidationError("Filename cannot be empty", "EMPTY_FILENAME");
  }

  // Check for control characters
  if (CONTROL_CHARACTERS_REGEX.test(filename)) {
    throw new FileValidationError(
      "Filename contains control characters",
      "INVALID_FILENAME"
    );
  }
}

/**
 * Perform basic content-based validation
 * This is a simple check and not a replacement for proper virus scanning
 */
async function validateFileContent(file: File): Promise<void> {
  // Read first few bytes to check for common malicious patterns
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer.slice(0, 1024)); // Check first 1KB

  // Check for executable signatures (basic check)
  const executableSignatures = [
    [0x4d, 0x5a], // MZ (Windows executable)
    [0x7f, 0x45, 0x4c, 0x46], // ELF (Linux executable)
    [0xca, 0xfe, 0xba, 0xbe], // Mach-O (macOS executable)
    [0x50, 0x4b, 0x03, 0x04], // ZIP archive (could contain executables)
  ];

  for (const signature of executableSignatures) {
    if (bytes.length >= signature.length) {
      let match = true;
      for (let i = 0; i < signature.length; i++) {
        if (bytes[i] !== signature[i]) {
          match = false;
          break;
        }
      }
      if (match) {
        throw new FileValidationError(
          "File contains executable or archive signature",
          "SUSPICIOUS_CONTENT"
        );
      }
    }
  }
}

/**
 * Validate uploaded file
 * @throws {FileValidationError} If validation fails
 */
export async function validateUploadedFile(
  file: File,
  options: {
    maxSize?: number;
    allowedMimeTypes?: readonly string[];
    allowedExtensions?: readonly string[];
    skipContentValidation?: boolean;
  } = {}
): Promise<void> {
  const {
    maxSize = FILE_VALIDATION_CONFIG.MAX_FILE_SIZE,
    allowedMimeTypes = FILE_VALIDATION_CONFIG.ALLOWED_MIME_TYPES,
    allowedExtensions = FILE_VALIDATION_CONFIG.ALLOWED_EXTENSIONS,
    skipContentValidation = false,
  } = options;

  // Validate file object
  if (!(file && file instanceof File)) {
    throw new FileValidationError("Invalid file object", "INVALID_FILE_OBJECT");
  }

  // Validate filename
  validateFilename(file.name);

  // Check file size
  if (file.size === 0) {
    throw new FileValidationError("File is empty", "EMPTY_FILE");
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new FileValidationError(
      `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
      "FILE_TOO_LARGE",
      { fileSize: file.size, maxSize }
    );
  }

  // Validate file extension
  if (!isExtensionAllowed(file.name)) {
    const ext = getFileExtension(file.name);
    throw new FileValidationError(
      `File extension '.${ext}' is not allowed. Allowed extensions: ${allowedExtensions.join(", ")}`,
      "INVALID_EXTENSION",
      { extension: ext, allowedExtensions }
    );
  }

  // Validate MIME type
  // Some clients/platforms send generic MIME values for valid files (e.g. application/octet-stream)
  // so we rely on extension + content checks in those cases.
  const normalizedMimeType = file.type.split(";")[0].trim().toLowerCase();
  const genericMimeTypes = new Set(["application/octet-stream", "binary/octet-stream"]);

  if (
    normalizedMimeType &&
    !genericMimeTypes.has(normalizedMimeType) &&
    !isMimeTypeAllowed(normalizedMimeType)
  ) {
    throw new FileValidationError(
      `MIME type '${file.type}' is not allowed. Allowed types: ${allowedMimeTypes.join(", ")}`,
      "INVALID_MIME_TYPE",
      { mimeType: file.type, allowedMimeTypes }
    );
  }

  // Perform content-based validation
  if (!skipContentValidation) {
    try {
      await validateFileContent(file);
    } catch (error) {
      if (error instanceof FileValidationError) {
        throw error;
      }
      logger.error("Content validation failed", error);
      throw new FileValidationError(
        "Failed to validate file content",
        "CONTENT_VALIDATION_FAILED"
      );
    }
  }

  logger.info("File validation passed", {
    filename: file.name,
    size: file.size,
    mimeType: file.type,
  });
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove or replace unsafe characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace unsafe chars with underscore
    .replace(/\.{2,}/g, ".") // Replace multiple dots with single dot
    .replace(LEADING_DOT_REGEX, "_") // Replace leading dot
    .slice(0, FILE_VALIDATION_CONFIG.MAX_FILENAME_LENGTH); // Trim to max length
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
}
