/**
 * WhisperX engine client
 *
 * This module integrates with the external WhisperX FastAPI server
 * configured by `WHISPER_SERVER_URL`. It is distinct from the official
 * OpenAI Whisper API. To use OpenAI Whisper, use the OpenAI-specific provider
 * (see `openai-whisper.ts`) and select engine "openai" at the call site.
 */
import { defaultWhisperModel, env, whisperModelIds } from "@/config";

export type ModelInfo = { id: string; name: string };

const RE_SPLIT_DELIMS = /[-_\s]+/;
const RE_DIGIT = /[0-9]/;
const RE_WHISPER_PREFIX = /^whisper-/i;
const TRAILING_SLASH_REGEX = /\/$/;

const toTitleCase = (s: string): string =>
  s
    .split(RE_SPLIT_DELIMS)
    .map((w) => (RE_DIGIT.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

export const prettyWhisperName = (modelId: string): string => {
  const [vendor, model] = modelId.split("/");
  const vendorPretty = vendor?.charAt(0).toUpperCase() + vendor?.slice(1);
  const modelPretty = toTitleCase(
    model?.replace(RE_WHISPER_PREFIX, "Whisper ") ?? ""
  );
  return `${vendorPretty} ${modelPretty}`.trim();
};

type ModelsCache = { at: number; list: ModelInfo[] } | null;
let _modelsCache: ModelsCache = null;
const MODELS_TTL_MS = 60_000;

// Lists models from the WhisperX FastAPI server; falls back to config defaults
export async function getWhisperModels(): Promise<ModelInfo[]> {
  const now = Date.now();
  if (_modelsCache && now - _modelsCache.at < MODELS_TTL_MS) {
    return _modelsCache.list;
  }

  const base = env.WHISPER_SERVER_URL.replace(TRAILING_SLASH_REGEX, "");
  const url = `${base}/models`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), env.WHISPER_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = (await res.json()) as unknown;
    const list = Array.isArray(data)
      ? (data as ModelInfo[]).filter(
          (m) => m && typeof m.id === "string" && typeof m.name === "string"
        )
      : [];
    if (list.length > 0) {
      _modelsCache = { at: now, list };
      return list;
    }
  } catch {
    // ignore and fall back
  }

  const list = (
    whisperModelIds.length > 0 ? whisperModelIds : [defaultWhisperModel]
  ).map((id) => ({ id, name: prettyWhisperName(id) }));
  _modelsCache = { at: now, list };
  return list;
}

export type SttEngine = "whisperx" | "whisper";
export type TranscribeArgs = {
  file: File;
  language?: string;
  model?: string;
  engine?: SttEngine;
};

// Transcribes via the WhisperX FastAPI server at WHISPER_SERVER_URL
export async function transcribe({
  file,
  language,
  model,
  engine,
}: TranscribeArgs): Promise<string> {
  const startedAt = Date.now();
  const base = env.WHISPER_SERVER_URL.replace(TRAILING_SLASH_REGEX, "");
  const url = `${base}/transcribe`;

  // Validate model against available list; if unknown, omit and let server default
  let forwardModel: string | undefined;
  try {
    const available = await getWhisperModels();
    if (model && available.some((m) => m.id === model)) {
      forwardModel = model;
    }
  } catch {
    // ignore; use server default
  }

  const form = new FormData();
  form.append("file", file as unknown as Blob, file.name);
  if (forwardModel) {
    form.append("model", forwardModel);
  }
  if (language) {
    form.append("language", language);
  }
  if (engine) {
    form.append("engine", engine);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.WHISPER_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Whisper server error (${res.status}): ${text.slice(0, 200)}`
      );
    }
    const json = (await res.json()) as { text?: string };
    const output = (json?.text ?? "").trim();
    // Avoid console logging per style guide
    // Successful transcription
    const _ = startedAt; // prevent unused variable in case formatters strip further
    return output;
  } catch (err) {
    clearTimeout(timer);
    const message = err instanceof Error ? err.message : String(err);
    throw mapTranscriptionError(message);
  }
}

// Maps WhisperX network/server errors to localized user-facing messages
export function mapTranscriptionError(message: string): Error {
  if (
    message.includes("fetch") ||
    message.includes("Whisper server error") ||
    message.toLowerCase().includes("abort")
  ) {
    return new Error(
      "سرویس تشخیص گفتار در دسترس نیست. لطفاً Whisper Server را اجرا کنید."
    );
  }
  return new Error("تبدیل صوت به متن انجام نشد. لطفاً دوباره تلاش کنید.");
}
