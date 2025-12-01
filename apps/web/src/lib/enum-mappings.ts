import { fa } from "@/lib/persian-texts";
// Directly import database schema types
import type {
  CodeMode,
  LanguageCode,
  LLMModelProvider,
  MessageRole,
  MessageStatus,
  ProgrammingLanguage,
  SummaryMode,
  Tone,
  TranscribeLanguage,
} from "@/server/database/schema";

// Language code to label mappings
export const languageCodeToLabel: Record<LanguageCode, string> = {
  en: fa.languages.english,
  fa: fa.languages.persian,
  ar: fa.languages.arabic,
  fr: fa.languages.french,
  de: fa.languages.german,
  es: fa.languages.spanish,
} as const;

// Tone to label mappings
export const toneToLabel: Record<Tone, string> = {
  formal: fa.tones.formal,
  informal: fa.tones.informal,
  business: fa.tones.business,
  academic: fa.tones.academic,
  technical: fa.tones.technical,
  creative: fa.tones.creative,
  friendly: fa.tones.friendly,
  professional: fa.tones.professional,
} as const;

// Summary mode to label mappings
export const summaryModeToLabel: Record<SummaryMode, string> = {
  concise: fa.summarize.modes.concise,
  standard: fa.summarize.modes.standard,
  detailed: fa.summarize.modes.detailed,
} as const;

// Code mode to label mappings
export const codeModeToLabel: Record<CodeMode, string> = {
  explain: fa.codeAssistant.modes.explain,
  refactor: "بازنویسی کد",
  debug: fa.codeAssistant.modes.debug,
  optimize: "بهینه‌سازی",
  document: "مستندسازی",
  test: "تست‌نویسی",
} as const;

// Programming language to label mappings
export const programmingLanguageToLabel: Record<ProgrammingLanguage, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  go: "Go",
  rust: "Rust",
  php: "PHP",
  ruby: "Ruby",
  swift: "Swift",
  kotlin: "Kotlin",
  dart: "Dart",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  other: "سایر",
} as const;

// Transcribe language to label mappings
export const transcribeLanguageToLabel: Record<TranscribeLanguage, string> = {
  fa: fa.transcribeLanguages.fa,
  en: fa.transcribeLanguages.en,
} as const;

// Message status to label mappings
export const messageStatusToLabel: Record<MessageStatus, string> = {
  streaming: "در حال پاسخگویی",
  finished: "تمام شده",
  errored: "خطا",
  stopped: "متوقف شده",
} as const;

// Message role to label mappings
export const messageRoleToLabel: Record<MessageRole, string> = {
  user: "کاربر",
  assistant: "دستیار",
} as const;

// LLM model provider to label mappings
export const llmModelProviderToLabel: Record<LLMModelProvider, string> = {
  ollama: "Ollama",
  lmstudio: "LM Studio",
  "stable-diffusion": "Stable Diffusion",
  whisper: "Whisper",
} as const;

// Helper functions to create option arrays for select components
export const createLanguageOptions = () =>
  Object.entries(languageCodeToLabel).map(([value, label]) => ({
    value: value as LanguageCode,
    label,
  }));

export const createToneOptions = () =>
  Object.entries(toneToLabel).map(([value, label]) => ({
    value: value as Tone,
    label,
  }));

export const createSummaryModeOptions = () =>
  Object.entries(summaryModeToLabel).map(([value, label]) => ({
    value: value as SummaryMode,
    label,
  }));

export const createMessageStatusOptions = () =>
  Object.entries(messageStatusToLabel).map(([value, label]) => ({
    value: value as MessageStatus,
    label,
  }));

export const createMessageRoleOptions = () =>
  Object.entries(messageRoleToLabel).map(([value, label]) => ({
    value: value as MessageRole,
    label,
  }));

export const createLLMModelProviderOptions = () =>
  Object.entries(llmModelProviderToLabel).map(([value, label]) => ({
    value: value as LLMModelProvider,
    label,
  }));

export const createCodeModeOptions = () =>
  Object.entries(codeModeToLabel).map(([value, label]) => ({
    value: value as CodeMode,
    label,
  }));

export const createProgrammingLanguageOptions = () =>
  Object.entries(programmingLanguageToLabel).map(([value, label]) => ({
    value: value as ProgrammingLanguage,
    label,
  }));

export const createTranscribeLanguageOptions = () =>
  Object.entries(transcribeLanguageToLabel).map(([value, label]) => ({
    value: value as TranscribeLanguage,
    label,
  }));
