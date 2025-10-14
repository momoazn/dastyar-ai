import { fa } from "@/lib/persian-texts";
// Directly import database schema types
import type {
  LanguageCode,
  LLMModelProvider,
  MessageRole,
  MessageStatus,
  SummaryMode,
  Tone,
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
