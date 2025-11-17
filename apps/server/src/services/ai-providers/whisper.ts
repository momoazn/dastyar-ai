/**
 * Whisper engine client
 *
 * This module integrates with the external Whisper Go server
 * configured by `WHISPER_SERVER_URL` using AI SDK transcription.
 * The server exposes OpenAI-compatible APIs for transcription.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { experimental_transcribe as aiTranscribe } from "ai";
import { env, whisperModelIds } from "@/config";
import { logger } from "@/lib/logger";
import { normalizePersianText } from "@/utils/persian-normalize";

type ModelInfo = { id: string; name: string };

const DEFAULT_MODEL = "ggml-base.bin";
const TRAILING_SLASH_REGEX = /\/$/;

// Create OpenAI provider for the Whisper server with custom baseURL
const configuredWhisperBase = env.WHISPER_SERVER_URL.replace(
  TRAILING_SLASH_REGEX,
  ""
);
const whisperApiBaseUrl = configuredWhisperBase.endsWith("/v1")
  ? configuredWhisperBase
  : `${configuredWhisperBase}/v1`;
const whisperProvider = createOpenAI({
  baseURL: whisperApiBaseUrl,
  apiKey: "", // Not needed for local Whisper server
});

// Static fallback model list with human-readable names
const STATIC_MODELS: ModelInfo[] = [
  { id: "ggml-tiny.bin", name: "Tiny" },
  { id: "ggml-base.bin", name: "Base" },
  { id: "ggml-small.bin", name: "Small" },
  { id: "ggml-medium.bin", name: "Medium" },
  { id: "ggml-large-v3.bin", name: "Large V3" },
];

type ModelsCache = { at: number; list: ModelInfo[] } | null;
let _modelsCache: ModelsCache = null;
const MODELS_TTL_MS = 60_000;

// Lists models from the Whisper Go server; falls back to config defaults
export async function getWhisperModels(): Promise<ModelInfo[]> {
  const now = Date.now();
  if (_modelsCache && now - _modelsCache.at < MODELS_TTL_MS) {
    return _modelsCache.list;
  }

  const url = `${whisperApiBaseUrl}/models`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.WHISPER_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      data?: { id: string; object: string; owned_by: string }[];
    };
    const list = Array.isArray(data.data)
      ? data.data.map((m) => ({ id: m.id, name: m.id }))
      : [];
    if (list.length > 0) {
      _modelsCache = { at: now, list };
      return list;
    }
  } catch {
    // ignore and fall back to static list
  }

  // Fallback: use config-based models if available, otherwise use static list
  const configModels =
    whisperModelIds.length > 0
      ? whisperModelIds.map((id) => ({ id, name: id }))
      : [];
  const list = configModels.length > 0 ? configModels : STATIC_MODELS;
  _modelsCache = { at: now, list };
  return list;
}

type TranscribeArgs = {
  file: File;
  language?: string;
  model?: string;
  initialPrompt?: string;
};

// Transcribes via the Whisper Go server at WHISPER_SERVER_URL using AI SDK
export async function transcribe({
  file,
  language,
  model,
  initialPrompt,
}: TranscribeArgs): Promise<string> {
  logger.info("start of transcribe args", {
    fileType: typeof file,
    fileConstructor: file?.constructor?.name,
    fileIsFile: file instanceof File,
    fileIsBlob: file instanceof Blob,
    fileName: file?.name,
    fileSize: file?.size,
    fileTypeProp: file?.type,
    language,
    model,
    initialPrompt,
  });

  // Validate model against available list; if unknown, use default
  let transcriptionModel = model ?? DEFAULT_MODEL;
  try {
    const available = await getWhisperModels();
    if (model && available.some((m) => m.id === model)) {
      transcriptionModel = model;
    } else if (!model && available.length > 0) {
      transcriptionModel = available[0]?.id ?? DEFAULT_MODEL;
    }
  } catch {
    // ignore; use default model
  }

  // Convert File to ArrayBuffer for AI SDK
  let audioBuffer: ArrayBuffer;
  try {
    audioBuffer = await file.arrayBuffer();
  } catch (err) {
    logger.error("Failed to convert file to ArrayBuffer", err, {
      fileType: typeof file,
      fileConstructor: file?.constructor?.name,
      fileIsFile: file instanceof File,
      fileIsBlob: file instanceof Blob,
      fileName: file?.name,
      fileSize: file?.size,
    });
    throw new Error(
      `Failed to read file: ${err instanceof Error ? err.message : String(err)}`
    );
  }
  const audioData = new Uint8Array(audioBuffer);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.WHISPER_TIMEOUT_MS);

  try {
    const result = await aiTranscribe({
      model: whisperProvider.transcription(transcriptionModel),
      audio: audioData,
      providerOptions: {
        openai: {
          ...(language && { language }),
          ...(initialPrompt && { prompt: initialPrompt }),
        },
      },
      abortSignal: controller.signal,
    });

    clearTimeout(timer);

    const output = (result.text ?? "").trim();

    // Apply Persian text normalization to improve text quality
    // Converts Arabic chars to Persian, maps punctuation, removes tatweel
    const normalized = normalizePersianText(output);

    return normalized;
  } catch (err) {
    clearTimeout(timer);
    const error =
      err instanceof Error ? err : new Error(String(err ?? "Unknown error"));
    logger.error("Whisper transcription request failed", error, {
      providerBaseUrl: whisperApiBaseUrl,
      model: transcriptionModel,
      language,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
    });
    const mapped = mapTranscriptionError(error.message);
    (mapped as { cause?: unknown }).cause = error;
    throw mapped;
  }
}

// Maps Whisper network/server errors to localized user-friendly messages
function mapTranscriptionError(message: string): Error {
  const lowerMsg = message.toLowerCase();

  // Explicit timeout/abort handling so users know to adjust server config
  if (lowerMsg.includes("timeout") || lowerMsg.includes("abort")) {
    return new Error(
      "زمان پردازش به پایان رسید. لطفاً فایل کوتاه‌تری ضبط کنید یا مقدار WHISPER_TIMEOUT_MS را در config.json افزایش دهید."
    );
  }

  // Payload too large (413) — prioritize this over generic server errors
  if (
    message.includes("413") ||
    lowerMsg.includes("too large") ||
    lowerMsg.includes("payload too large") ||
    lowerMsg.includes("request entity too large")
  ) {
    return new Error(
      "فایل ضبط شده خیلی بزرگ است. لطفاً صدای کوتاه‌تری ضبط کنید."
    );
  }

  // Service unavailable, timeout, or network error
  if (
    lowerMsg.includes("fetch") ||
    lowerMsg.includes("network") ||
    lowerMsg.includes("econnrefused") ||
    message.includes("Whisper server error")
  ) {
    return new Error(
      "سرویس تشخیص گفتار در دسترس نیست. لطفاً Whisper Server را اجرا کنید."
    );
  }

  // Generic failure
  return new Error("تبدیل صوت به متن انجام نشد. لطفاً دوباره تلاش کنید.");
}
