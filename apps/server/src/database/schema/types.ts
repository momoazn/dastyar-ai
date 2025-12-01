// ============================================================================
// User Types
// ============================================================================

export const userRoles = ["admin", "user"] as const;
export type UserRole = (typeof userRoles)[number];

// ============================================================================
// LLM Model Types
// ============================================================================

export const llmModelProviders = [
  "ollama",
  "lmstudio",
  "stable-diffusion",
  "whisper",
] as const;
export type LLMModelProvider = (typeof llmModelProviders)[number];

// ============================================================================
// Message Types
// ============================================================================

export const messageStatuses = [
  "streaming",
  "finished",
  "errored",
  "stopped",
] as const;
export type MessageStatus = (typeof messageStatuses)[number];

export const messageRoles = ["user", "assistant"] as const;
export type MessageRole = (typeof messageRoles)[number];

// ============================================================================
// Language and Tone Types
// ============================================================================

export const languageCodes = ["en", "fa", "ar", "fr", "de", "es"] as const;
export type LanguageCode = (typeof languageCodes)[number];

export const tones = [
  "formal",
  "informal",
  "business",
  "academic",
  "technical",
  "creative",
  "friendly",
  "professional",
] as const;
export type Tone = (typeof tones)[number];

// ============================================================================
// Translation Types
// ============================================================================

export const sourceTypes = ["text", "pdf"] as const;
export type SourceType = (typeof sourceTypes)[number];

export type TranslationPayload = {
  page_count: number;
  pages: Array<{
    page: number;
    source_text: string;
    translated_text: string;
  }>;
};

// ============================================================================
// Summary Types
// ============================================================================

export const summaryModes = ["concise", "standard", "detailed"] as const;
export type SummaryMode = (typeof summaryModes)[number];

// ============================================================================
// Code Types
// ============================================================================

export const codeModes = [
  "explain",
  "refactor",
  "debug",
  "optimize",
  "document",
  "test",
] as const;
export type CodeMode = (typeof codeModes)[number];

export const programmingLanguages = [
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
  "csharp",
  "go",
  "rust",
  "php",
  "ruby",
  "swift",
  "kotlin",
  "dart",
  "sql",
  "html",
  "css",
  "other",
] as const;
export type ProgrammingLanguage = (typeof programmingLanguages)[number];

// ============================================================================
// JSON Types
// ============================================================================

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type Json = JsonValue;

// ============================================================================
// Transcribe Types
// ============================================================================

export const transcribeLanguages = ["fa", "en"] as const;
export type TranscribeLanguage = (typeof transcribeLanguages)[number];
